import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';

/**
 * Extracts plain text from a text or markdown file.
 * Wraps content with page metadata (page 1).
 *
 * @param {string} filePath
 * @returns {Promise<{ pages: Array<{ pageNumber: number, text: string }>, pageCount: number }>}
 */
export const extractTextFromFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf-8');
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error('The uploaded text file is empty.');
  }

  return {
    pages: [
      {
        pageNumber: 1,
        text: cleanContent,
      },
    ],
    pageCount: 1,
  };
};

/**
 * Extracts text from a PDF file preserving per-page metadata.
 * Uses pdf-parse's modern TypeScript/ESM parser.
 *
 * @param {string} filePath
 * @returns {Promise<{ pages: Array<{ pageNumber: number, text: string }>, pageCount: number }>}
 */
export const extractTextFromPdf = async (filePath) => {
  const dataBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const parsed = await parser.getText();
    const rawPages = parsed.pages || [];

    // Map pages to structured 1-based page metadata
    const validPages = rawPages
      .map((p) => ({
        pageNumber: p.num || 1,
        text: (p.text || '').trim(),
      }))
      .filter((p) => p.text.length > 0);

    if (validPages.length === 0) {
      throw new Error(
        'No readable text could be extracted from this PDF. It may be scanned or image-only without selectable text.'
      );
    }

    return {
      pages: validPages,
      pageCount: parsed.total || validPages.length,
    };
  } catch (error) {
    console.error('[PDF Extraction Error]:', error.message);
    throw new Error(`Failed to parse PDF document: ${error.message}`);
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignore parser cleanup errors
    }
  }
};

/**
 * Unified document extractor dispatching by file extension/mimetype.
 *
 * @param {string} filePath
 * @param {string} mimeType
 * @returns {Promise<{ pages: Array<{ pageNumber: number, text: string }>, pageCount: number }>}
 */
export const extractDocumentText = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return extractTextFromPdf(filePath);
  } else if (mimeType === 'text/plain' || ext === '.txt') {
    return extractTextFromFile(filePath);
  } else {
    throw new Error(`Unsupported document type: ${mimeType || ext}`);
  }
};
