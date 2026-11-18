import Document from '../../models/Document.js';
import Notebook from '../../models/Notebook.js';
import FlashcardSet from '../../models/FlashcardSet.js';
import { extractDocumentText } from '../documents/extractor.service.js';
import { createChatModel, formatCloudflareError } from '../ai/cloudflare.service.js';
import { extractJSONFromLLMResponse } from '../../utils/jsonParser.js';

/**
 * Generates an active-recall flashcard deck grounded in notebook materials.
 *
 * @param {Object} params
 * @param {string} params.notebookId
 * @param {string} params.userId
 * @param {string} [params.documentId] - Optional: scope to single document
 * @param {number} [params.count=6] - Number of cards (capped at 10 to conserve quota)
 * @returns {Promise<Object>} saved FlashcardSet document
 */
export const generateFlashcardSet = async ({ notebookId, userId, documentId, count = 6 }) => {
  // 1. Verify notebook
  const notebook = await Notebook.findOne({ _id: notebookId, userId });
  if (!notebook) {
    throw new Error('Notebook not found.');
  }

  // 2. Fetch document context
  const docQuery = { notebookId, userId, status: 'ready' };
  if (documentId) {
    docQuery._id = documentId;
  }

  const documents = await Document.find(docQuery).limit(3);
  if (documents.length === 0) {
    throw new Error('No ready documents found in this notebook. Please upload a document first.');
  }

  // Aggregate document text (up to 5,000 characters)
  let aggregatedText = '';
  for (const doc of documents) {
    try {
      const { pages } = await extractDocumentText(doc.storagePath, doc.mimeType);
      const docText = pages.map((p) => p.text).join('\n');
      aggregatedText += `\n[From ${doc.originalFilename}]:\n${docText.slice(0, 2000)}\n`;
      if (aggregatedText.length >= 5000) break;
    } catch (e) {
      console.warn(`[Flashcards] Could not extract from doc ${doc._id}:`, e.message);
    }
  }

  if (!aggregatedText.trim()) {
    throw new Error('No readable text available to generate flashcards.');
  }

  const targetCount = Math.min(Math.max(parseInt(count, 10) || 6, 3), 10);

  // 3. Prompt engineering for strict JSON flashcard format
  const prompt = `You are an educational study deck creator. Generate exactly ${targetCount} active recall flashcards from the study text below.

RULES:
- Focus on fundamental concepts, key definitions, trade-offs, and critical mechanisms.
- Keep questions crisp and targeted.
- Keep answers concise, direct, and easy to memorize (1 to 3 sentences).
- Return ONLY a valid JSON array of objects with "question" and "answer" properties.
- Do NOT include any conversational preamble or markdown code fences outside the JSON.

STUDY TEXT:
${aggregatedText}

JSON FORMAT EXAMPLE:
[
  {
    "question": "What is the primary role of an operating system kernel?",
    "answer": "The kernel is the core component that manages hardware resources (CPU, memory, devices) and facilitates communication between hardware and software."
  }
]`;

  try {
    const chatModel = createChatModel({ temperature: 0.3, maxTokens: 1400 });
    const response = await chatModel.invoke(prompt);
    const rawContent = response.content.trim();

    // 4. Extract and validate JSON
    const parsed = extractJSONFromLLMResponse(rawContent);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Model did not return a valid JSON array of flashcards.');
    }

    // Sanitize and validate card structures
    const validCards = parsed
      .filter((card) => card && typeof card.question === 'string' && typeof card.answer === 'string')
      .map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
      }))
      .filter((card) => card.question.length > 3 && card.answer.length > 3);

    if (validCards.length === 0) {
      throw new Error('Model generated malformed card objects missing question or answer fields.');
    }

    // 5. Persist FlashcardSet in MongoDB
    const sourceTitle = documentId && documents[0] ? documents[0].originalFilename : notebook.title;
    const title = `${sourceTitle} - Flashcard Deck (${validCards.length} cards)`;

    const flashcardSet = await FlashcardSet.create({
      userId,
      notebookId,
      documentId: documentId || null,
      title,
      cards: validCards,
    });

    return flashcardSet;
  } catch (error) {
    throw formatCloudflareError(error);
  }
};

