import Document from '../../models/Document.js';
import config from '../../config/env.js';
import { extractDocumentText } from './extractor.service.js';
import { chunkDocumentPages } from '../rag/splitter.service.js';
import { createEmbeddingModel } from '../ai/cloudflare.service.js';
import { upsertPoints, deleteDocumentVectors } from '../rag/qdrant.service.js';

/**
 * Executes the complete document ingestion pipeline.
 *
 * Extract Pages -> Split Chunks -> Batch Embed with Cloudflare -> Upsert to Qdrant -> Update Status
 *
 * @param {string} documentId - MongoDB Document ObjectId
 * @returns {Promise<Object>} updated Document
 */
export const processDocumentIngestion = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error(`Document ${documentId} not found`);
  }

  try {
    // 1. Mark status as processing
    document.status = 'processing';
    document.processingError = null;
    await document.save();

    console.log(`[Ingestion] Starting ingestion for: "${document.originalFilename}" (${document._id})`);

    // 2. Extract text with per-page metadata
    console.log(`[Ingestion] Extracting text from ${document.mimeType}...`);
    const { pages, pageCount } = await extractDocumentText(document.storagePath, document.mimeType);
    document.pageCount = pageCount;
    console.log(`[Ingestion] Extracted ${pages.length} readable page(s) out of ${pageCount} total.`);

    // 3. Chunk text recursively with 800-char window and 120-char overlap
    console.log('[Ingestion] Chunking document pages...');
    const chunks = await chunkDocumentPages(pages);
    document.chunkCount = chunks.length;
    console.log(`[Ingestion] Generated ${chunks.length} semantic chunk(s).`);

    if (chunks.length === 0) {
      throw new Error('Document produced 0 readable text chunks after extraction.');
    }

    // 4. Generate embeddings in controlled batches (5 chunks per batch)
    // to strictly preserve Cloudflare request size and inference quota
    console.log('[Ingestion] Generating Cloudflare BGE embeddings in batches...');
    const embeddingModel = createEmbeddingModel();
    const BATCH_SIZE = 5;
    const points = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchTexts = batch.map((c) => c.text);

      console.log(`[Ingestion] Embedding chunk batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);
      const vectors = await embeddingModel.embedDocuments(batchTexts);

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const vector = vectors[j];

        points.push({
          vector,
          payload: {
            documentId: document._id.toString(),
            notebookId: document.notebookId.toString(),
            userId: document.userId.toString(),
            pageNumber: chunk.pageNumber,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            embeddingModel: config.cloudflare.embeddingModel,
          },
        });
      }
    }

    // 5. Store vector points in Qdrant
    console.log(`[Ingestion] Upserting ${points.length} vector points to Qdrant...`);
    await upsertPoints(points);

    // 6. Finalize status in MongoDB
    document.status = 'ready';
    document.processingError = null;
    await document.save();

    console.log(`[Ingestion] Successfully ingested "${document.originalFilename}" (${points.length} vectors stored).`);
    return document;
  } catch (error) {
    console.error(`[Ingestion Error] Failed to ingest document "${document.originalFilename}":`, error.message);

    // Cleanup: Remove any partial vectors from Qdrant to avoid orphaned records
    try {
      await deleteDocumentVectors(document._id, document.userId);
    } catch (cleanupErr) {
      console.warn('[Ingestion Cleanup Warning]:', cleanupErr.message);
    }

    document.status = 'failed';
    document.processingError = error.message;
    await document.save();

    throw error;
  }
};

