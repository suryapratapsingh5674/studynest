import Document from '../../models/Document.js';
import Summary from '../../models/Summary.js';
import { extractDocumentText } from '../documents/extractor.service.js';
import { createChatModel, formatCloudflareError } from '../ai/cloudflare.service.js';

/**
 * Generates or retrieves an existing summary for a specific document.
 * Adheres to quota-conservation rule: caches and reuses existing summaries.
 *
 * @param {Object} params
 * @param {string} params.documentId
 * @param {string} params.userId
 * @param {boolean} [params.forceRegenerate=false]
 * @returns {Promise<Object>}
 */
export const getOrGenerateSummary = async ({ documentId, userId, forceRegenerate = false }) => {
  // 1. Verify document ownership
  const document = await Document.findOne({ _id: documentId, userId });
  if (!document) {
    throw new Error('Document not found or you do not have permission to access it.');
  }

  // 2. Check for existing cached summary in MongoDB
  if (!forceRegenerate) {
    const existing = await Summary.findOne({ documentId: document._id, userId });
    if (existing) {
      return existing;
    }
  }

  // 3. Extract text from the document
  const { pages } = await extractDocumentText(document.storagePath, document.mimeType);
  const fullText = pages.map((p) => p.text).join('\n\n');

  if (!fullText || fullText.trim().length === 0) {
    throw new Error('Cannot generate summary: Document has no readable text.');
  }

  // 4. Summarization prompt with structured sections
  // Truncate to reasonable context boundary (approx 6,000 characters) to avoid Cloudflare token limits
  const contextText = fullText.length > 6000 ? `${fullText.slice(0, 6000)}...\n[Truncated for length]` : fullText;

  const prompt = `You are an expert academic tutor. Summarize the following educational material from "${document.originalFilename}".

Provide:
1. A concise, easy-to-understand executive overview (2-3 paragraphs).
2. A numbered or bulleted list of 4 to 6 fundamental key takeaways.

DOCUMENT TEXT:
${contextText}

Generate a clear, beautifully structured Markdown response.`;

  try {
    const chatModel = createChatModel({ temperature: 0.2, maxTokens: 750 });
    const response = await chatModel.invoke(prompt);
    const content = response.content.trim();

    // Extract bullet points from content if present
    const bulletLines = content
      .split('\n')
      .filter((line) => line.trim().startsWith('* ') || line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim()))
      .map((line) => line.replace(/^[\*\-\d\.]+\s*/, '').trim())
      .filter((line) => line.length > 10)
      .slice(0, 6);

    // 5. Upsert summary in MongoDB
    const summary = await Summary.findOneAndUpdate(
      { documentId: document._id, userId },
      {
        userId,
        notebookId: document.notebookId,
        documentId: document._id,
        title: `Summary of ${document.originalFilename}`,
        content,
        keyPoints: bulletLines,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return summary;
  } catch (error) {
    throw formatCloudflareError(error);
  }
};

