/**
 * System prompt instructions for StudyNest RAG generation.
 * Grounding rules: strict context usage, honest refusal when missing, beginner-friendly explanations.
 */
export const RAG_SYSTEM_PROMPT = `You are StudyNest, an encouraging, rigorous AI study companion and academic mentor.
Your primary role is to help students learn complex educational topics grounded strictly in their uploaded course materials.

CORE OPERATIONAL RULES:
1. Grounding: Answer the student's question using ONLY the provided educational document excerpts.
2. Honesty & No Hallucinations: If the provided excerpts do not contain enough information to answer the question, state clearly and politely: "I cannot find this information in your uploaded materials." Never invent facts or hallucinate citations.
3. Beginner-Friendly Explanations: Explain challenging academic ideas simply and intuitively, using clear analogies or concrete examples where helpful.
4. Conversation Continuity: Use recent conversation history to understand follow-up questions (e.g. "What did you mean by that?"), but verify document facts solely against the document excerpts.
5. Organization: Keep answers readable, structured, and pleasant to study. Use clear Markdown headers, bullet points, and bold terms for important concepts.`;

/**
 * Formats an array of retrieved Qdrant chunk payloads into a structured context string.
 *
 * @param {Array<{ filename: string, pageNumber: number, chunkIndex: number, text: string }>} chunks
 * @returns {string}
 */
export const formatRetrievedContext = (chunks) => {
  if (!chunks || chunks.length === 0) {
    return 'NO RELEVANT DOCUMENT EXCERPTS AVAILABLE.';
  }

  return chunks
    .map((chunk, idx) => {
      const sourceNum = idx + 1;
      const file = chunk.filename || 'Uploaded Document';
      const page = chunk.pageNumber || 1;
      return `--- DOCUMENT SOURCE [${sourceNum}] (File: "${file}", Page: ${page}) ---\n${chunk.text}\n`;
    })
    .join('\n');
};

/**
 * Constructs the final prompt string or array of messages for LangChain ChatOpenAI.
 *
 * @param {Object} params
 * @param {string} params.question - Current user question
 * @param {Array<Object>} params.retrievedChunks - Top-K chunks from Qdrant
 * @param {Array<{ role: string, content: string }>} params.chatHistory - Sliding window of recent messages
 * @returns {Array<{ role: string, content: string }>} messages array
 */
export const buildRAGMessages = ({ question, retrievedChunks, chatHistory = [] }) => {
  const contextString = formatRetrievedContext(retrievedChunks);

  const messages = [
    {
      role: 'system',
      content: `${RAG_SYSTEM_PROMPT}

AVAILABLE DOCUMENT EXCERPTS:
${contextString}`,
    },
  ];

  // Include recent conversation history (last 6 messages max)
  const recentHistory = chatHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Add the current user question
  messages.push({
    role: 'user',
    content: question,
  });

  return messages;
};

