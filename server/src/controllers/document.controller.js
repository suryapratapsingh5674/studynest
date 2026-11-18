import fs from 'fs/promises';
import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Notebook from '../models/Notebook.js';
import { calculateFileHash } from '../utils/fileHash.js';
import { processDocumentIngestion } from '../services/documents/ingest.service.js';
import { deleteDocumentVectors } from '../services/rag/qdrant.service.js';

/**
 * Upload a document (PDF or TXT) to a notebook and begin ingestion.
 * POST /api/notebooks/:id/documents
 */
export const uploadDocument = async (req, res) => {
  let file = req.file;

  try {
    const { id: notebookId } = req.params;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded. Please upload a PDF (.pdf) or Plain Text (.txt) file.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    // Verify notebook ownership
    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user._id });
    if (!notebook) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        message: 'Notebook not found or you do not have permission to add documents to it.',
      });
    }

    // Calculate SHA-256 hash for deduplication
    const fileHash = await calculateFileHash(file.path);

    // Check for duplicate file in the same notebook
    const existingDoc = await Document.findOne({
      userId: req.user._id,
      notebookId: notebook._id,
      fileHash,
    });

    if (existingDoc) {
      // Remove newly uploaded duplicate file from disk
      await fs.unlink(file.path).catch(() => {});

      if (existingDoc.status === 'ready') {
        return res.status(409).json({
          success: false,
          message: `This exact document ("${existingDoc.originalFilename}") has already been processed in this notebook.`,
          data: { document: existingDoc },
        });
      } else if (existingDoc.status === 'processing') {
        return res.status(409).json({
          success: false,
          message: 'This document is currently being processed. Please wait a moment.',
          data: { document: existingDoc },
        });
      }
    }

    // Create Document record in MongoDB with 'uploaded' status
    const document = await Document.create({
      userId: req.user._id,
      notebookId: notebook._id,
      originalFilename: file.originalname,
      storedFilename: file.filename,
      storagePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
      status: 'uploaded',
    });

    // Begin background processing asynchronously
    processDocumentIngestion(document._id).catch((err) => {
      console.error(`[Background Ingestion Error] Document ${document._id}:`, err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully. Processing started.',
      data: {
        document: {
          id: document._id,
          originalFilename: document.originalFilename,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          status: document.status,
          pageCount: 0,
          chunkCount: 0,
          createdAt: document.createdAt,
        },
      },
    });
  } catch (error) {
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }
    console.error('[Upload Document Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document.',
    });
  }
};

/**
 * Get all documents inside a notebook.
 * GET /api/notebooks/:id/documents
 */
export const getDocumentsByNotebook = async (req, res) => {
  try {
    const { id: notebookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notebook identifier.',
      });
    }

    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({
        success: false,
        message: 'Notebook not found.',
      });
    }

    const documents = await Document.find({
      notebookId: notebook._id,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    const formatted = documents.map((doc) => ({
      id: doc._id,
      originalFilename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      pageCount: doc.pageCount,
      chunkCount: doc.chunkCount,
      processingError: doc.processingError,
      createdAt: doc.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: { documents: formatted },
    });
  } catch (error) {
    console.error('[Get Documents Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load documents.',
    });
  }
};

/**
 * Get single document details & processing status.
 * GET /api/documents/:id/status
 */
export const getDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document identifier.',
      });
    }

    const doc = await Document.findOne({ _id: id, userId: req.user._id });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: doc._id,
        status: doc.status,
        pageCount: doc.pageCount,
        chunkCount: doc.chunkCount,
        processingError: doc.processingError,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Get Document Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check document status.',
    });
  }
};

/**
 * Delete a document, its stored file, and its Qdrant vectors.
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document identifier.',
      });
    }

    const doc = await Document.findOne({ _id: id, userId: req.user._id });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or you do not have permission to delete it.',
      });
    }

    // 1. Delete associated vectors from Qdrant
    await deleteDocumentVectors(doc._id, req.user._id);

    // 2. Delete stored file from local disk
    if (doc.storagePath) {
      await fs.unlink(doc.storagePath).catch((err) => {
        console.warn(`[Delete File Warning] Could not delete ${doc.storagePath}:`, err.message);
      });
    }

    // 3. Remove Document record from MongoDB
    await doc.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Document and indexed vectors deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Document Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document.',
    });
  }
};

/**
 * Retry ingestion for a failed document.
 * POST /api/documents/:id/retry
 */
export const retryDocumentIngestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document identifier.',
      });
    }

    const doc = await Document.findOne({ _id: id, userId: req.user._id });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Trigger ingestion
    processDocumentIngestion(doc._id).catch((err) => {
      console.error(`[Retry Ingestion Error] Document ${doc._id}:`, err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Document ingestion re-triggered.',
      data: {
        id: doc._id,
        status: 'processing',
      },
    });
  } catch (error) {
    console.error('[Retry Ingestion Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retry document ingestion.',
    });
  }
};

