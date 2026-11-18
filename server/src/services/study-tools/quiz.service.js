import Document from '../../models/Document.js';
import Notebook from '../../models/Notebook.js';
import Quiz from '../../models/Quiz.js';
import { extractDocumentText } from '../documents/extractor.service.js';
import { createChatModel, formatCloudflareError } from '../ai/cloudflare.service.js';
import { extractJSONFromLLMResponse } from '../../utils/jsonParser.js';

/**
 * Generates a multiple-choice quiz grounded in notebook materials.
 *
 * @param {Object} params
 * @param {string} params.notebookId
 * @param {string} params.userId
 * @param {string} [params.documentId]
 * @param {number} [params.count=5]
 * @returns {Promise<Object>} saved Quiz document
 */
export const generateQuiz = async ({ notebookId, userId, documentId, count = 5 }) => {
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

  // Aggregate document text
  let aggregatedText = '';
  for (const doc of documents) {
    try {
      const { pages } = await extractDocumentText(doc.storagePath, doc.mimeType);
      const docText = pages.map((p) => p.text).join('\n');
      aggregatedText += `\n[From ${doc.originalFilename}]:\n${docText.slice(0, 2000)}\n`;
      if (aggregatedText.length >= 5000) break;
    } catch (e) {
      console.warn(`[Quiz] Could not extract from doc ${doc._id}:`, e.message);
    }
  }

  if (!aggregatedText.trim()) {
    throw new Error('No readable text available to generate a quiz.');
  }

  const targetCount = Math.min(Math.max(parseInt(count, 10) || 5, 3), 8);

  // 3. Prompt engineering for strict JSON MCQ quiz format
  const prompt = `You are an academic exam creator. Generate exactly ${targetCount} multiple choice questions (MCQs) grounded in the study text below.

RULES FOR EACH QUESTION:
1. Provide a clear, thoughtful question.
2. Provide an array of EXACTLY 4 plausible options.
3. Provide the "correctAnswer" which must be an exact string match to one of the 4 options.
4. Provide a helpful 1-2 sentence "explanation" of why this answer is correct.
5. Provide a "sourceReference" naming the concept or topic.
6. Return ONLY a valid JSON array of objects. Do not write introductory text.

STUDY TEXT:
${aggregatedText}

JSON FORMAT EXAMPLE:
[
  {
    "question": "Which CPU scheduling algorithm gives priority to the process with the shortest burst time?",
    "options": [
      "First-Come, First-Served (FCFS)",
      "Shortest-Job-First (SJF)",
      "Round-Robin (RR)",
      "Priority Inversion"
    ],
    "correctAnswer": "Shortest-Job-First (SJF)",
    "explanation": "Shortest-Job-First (SJF) scheduling associates with each process the length of its next CPU burst, scheduling the shortest first to minimize average waiting time.",
    "sourceReference": "CPU Scheduling Algorithms"
  }
]`;

  try {
    const chatModel = createChatModel({ temperature: 0.2, maxTokens: 1800 });
    const response = await chatModel.invoke(prompt);
    const rawContent = response.content.trim();

    // 4. Extract and validate JSON
    const parsed = extractJSONFromLLMResponse(rawContent);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Model did not return a valid JSON array of questions.');
    }

    // Validate structure of each question
    const validQuestions = [];
    for (const q of parsed) {
      if (
        !q ||
        typeof q.question !== 'string' ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswer !== 'string' ||
        typeof q.explanation !== 'string'
      ) {
        continue;
      }

      const options = q.options.map((opt) => String(opt).trim());
      const correctAnswer = q.correctAnswer.trim();

      // Ensure the correct answer is present in the options list
      const matchesOption = options.some(
        (opt) => opt.toLowerCase() === correctAnswer.toLowerCase()
      );

      if (matchesOption) {
        // Normalize exact case of correctAnswer to match option
        const matchedOption = options.find(
          (opt) => opt.toLowerCase() === correctAnswer.toLowerCase()
        );

        validQuestions.push({
          question: q.question.trim(),
          options,
          correctAnswer: matchedOption || correctAnswer,
          explanation: q.explanation.trim(),
          sourceReference: q.sourceReference ? String(q.sourceReference).trim() : 'Document Notes',
        });
      }
    }

    if (validQuestions.length === 0) {
      throw new Error('Model generated invalid question objects. Could not validate 4 options with matching answer.');
    }

    // 5. Persist Quiz in MongoDB
    const sourceTitle = documentId && documents[0] ? documents[0].originalFilename : notebook.title;
    const title = `${sourceTitle} - Knowledge Quiz (${validQuestions.length} Questions)`;

    const quiz = await Quiz.create({
      userId,
      notebookId,
      documentId: documentId || null,
      title,
      questions: validQuestions,
    });

    return quiz;
  } catch (error) {
    throw formatCloudflareError(error);
  }
};

