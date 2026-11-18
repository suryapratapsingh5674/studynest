import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Default chunking configuration for educational study materials.
 * 800 characters (~150-200 tokens) with 120 character overlap preserves
 * sentence boundaries without exceeding BGE-base embedding window limits.
 */
export const DEFAULT_CHUNKER_OPTIONS = {
  chunkSize: 800,
  chunkOverlap: 120,
  separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '],
};

/**
 * Splits extracted document pages into semantic chunks while preserving
 * strict page number and ordering metadata for downstream citations.
 *
 * @param {Array<{ pageNumber: number, text: string }>} pages
 * @param {Object} [customOptions]
 * @returns {Promise<Array<{ text: string, pageNumber: number, chunkIndex: number, charCount: number }>>}
 */
export const chunkDocumentPages = async (pages, customOptions = {}) => {
  const options = { ...DEFAULT_CHUNKER_OPTIONS, ...customOptions };
  const splitter = new RecursiveCharacterTextSplitter(options);

  const chunks = [];
  let chunkIndex = 0;

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) continue;

    const pageChunks = await splitter.splitText(page.text);

    for (const text of pageChunks) {
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        chunks.push({
          text: trimmed,
          pageNumber: page.pageNumber,
          chunkIndex,
          charCount: trimmed.length,
        });
        chunkIndex++;
      }
    }
  }

  return chunks;
};

