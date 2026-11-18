import mongoose from 'mongoose';
import Notebook from '../../models/Notebook.js';
import Document from '../../models/Document.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import { createEmbeddingModel, createChatModel, formatCloudflareError } from '../ai/cloudflare.service.js';
import { searchVectors } from './qdrant.service.js';
import { buildRAGMessages } from './prompt.service.js';

/**
 * Executes the full RAG pipeline for a student's question:
 * Ownership check -> Conversation fetch -> Query embedding -> Qdrant search
 * -> Context construction -> Cloudflare generation -> Citation attachment -> MongoDB persistence.
 *
 * @param {Object} params
 * @param {string} params.notebookId
 * @param {string} params.userId
 * @param {string} params.question
 * @param {string} [params.conversationId]
 * @returns {Promise<Object>}
 */
export const executeRAGChat = async ({ notebookId, userId, question, conversationId }) => {
  // 1. Verify notebook exists and belongs to user
  const notebook = await Notebook.findOne({ _id: notebookId, userId });
  if (!notebook) {
    throw new Error('Notebook not found or you do not have permission to access it.');
  }

  // 2. Fetch or create conversation
  let conversation;
  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    conversation = await Conversation.findOne({ _id: conversationId, userId, notebookId });
  }

  if (!conversation) {
    const autoTitle = question.length > 40 ? `${question.slice(0, 40).trim()}...` : question;
    conversation = await Conversation.create({
      userId,
      notebookId,
      title: autoTitle,
    });
  }

  // 3. Check if notebook has any ready documents
  const readyDocuments = await Document.find({
    notebookId,
    userId,
    status: 'ready',
  });

  // If no documents exist or are ready yet, return a polite guidance response
  if (readyDocuments.length === 0) {
    const userMsg = await Message.create({
      conversationId: conversation._id,
      userId,
      role: 'user',
      content: question,
    });

    const assistantMsg = await Message.create({
      conversationId: conversation._id,
      userId,
      role: 'assistant',
      content:
        'You have not uploaded any ready study documents to this notebook yet.\n\nPlease upload your lecture notes or textbook chapters in the **Documents** tab so I can answer questions grounded directly in your study materials.',
      citations: [],
    });

    return {
      conversationId: conversation._id,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations: [],
    };
  }

  // 4. Generate query embedding through Cloudflare Workers AI
  let queryVector;
  try {
    const embeddingModel = createEmbeddingModel();
    queryVector = await embeddingModel.embedQuery(question);
  } catch (error) {
    throw formatCloudflareError(error);
  }

  // 5. Search Qdrant vector database with user and notebook filters (top-4)
  let rawHits = [];
  try {
    rawHits = await searchVectors({
      queryVector,
      userId,
      notebookId,
      limit: 4,
    });
  } catch (qdrantErr) {
    console.error('[RAG Qdrant Search Error]:', qdrantErr.message);
    throw new Error(
      `Vector database unavailable: ${qdrantErr.message}. Ensure Qdrant is running ('npm run qdrant:up').`
    );
  }

  // 6. Enrich retrieved points with document filenames from MongoDB
  const docMap = {};
  readyDocuments.forEach((d) => {
    docMap[d._id.toString()] = d.originalFilename;
  });

  const retrievedChunks = rawHits.map((hit) => ({
    documentId: hit.documentId,
    filename: docMap[hit.documentId] || 'Uploaded Document',
    pageNumber: hit.pageNumber || 1,
    chunkIndex: hit.chunkIndex || 0,
    text: hit.text || '',
    score: hit.score,
  }));

  // 7. Load recent conversation history (last 6 messages)
  const pastMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .limit(6);

  // 8. Build prompt messages with context, conversation history, and current question
  const messages = buildRAGMessages({
    question,
    retrievedChunks,
    chatHistory: pastMessages,
  });

  // 9. Generate answer using Cloudflare Workers AI (Llama 3.2 3B Instruct)
  let assistantContent;
  try {
    const chatModel = createChatModel({ temperature: 0.2, maxTokens: 800 });
    const response = await chatModel.invoke(messages);
    assistantContent = response.content.trim();
  } catch (llmError) {
    throw formatCloudflareError(llmError);
  }

  // 10. Construct structured citations from retrieved chunks
  const citations = retrievedChunks.map((chunk) => ({
    documentId: chunk.documentId,
    filename: chunk.filename,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
    excerpt: chunk.text.length > 300 ? `${chunk.text.slice(0, 300)}...` : chunk.text,
    score: typeof chunk.score === 'number' ? parseFloat(chunk.score.toFixed(4)) : null,
  }));

  // 11. Persist user and assistant messages in MongoDB
  const userMsg = await Message.create({
    conversationId: conversation._id,
    userId,
    role: 'user',
    content: question,
  });

  const assistantMsg = await Message.create({
    conversationId: conversation._id,
    userId,
    role: 'assistant',
    content: assistantContent,
    citations,
  });

  // Update conversation timestamp
  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    conversationId: conversation._id,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    citations,
  };
};

