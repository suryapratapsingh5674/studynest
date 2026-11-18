import mongoose from 'mongoose';
import MCPApiKey from '../models/MCPApiKey.js';
import Notebook from '../models/Notebook.js';
import Document from '../models/Document.js';
import Summary from '../models/Summary.js';
import { generateApiKey } from '../utils/apiKey.js';
import { createEmbeddingModel } from '../services/ai/cloudflare.service.js';
import { searchVectors } from '../services/rag/qdrant.service.js';
import { extractDocumentText } from '../services/documents/extractor.service.js';

// ==========================================
// 1. API Key Management (User Settings)
// ==========================================

export const createKey = async (req, res) => {
  try {
    const { name } = req.body;
    const keyName = name && name.trim() ? name.trim() : 'External AI Client';

    const { key, keyHash, prefix } = generateApiKey();

    const apiKeyDoc = await MCPApiKey.create({
      userId: req.user._id,
      keyHash,
      prefix,
      name: keyName,
      scopes: ['read'],
    });

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Save this key now; it will not be displayed again.',
      data: {
        id: apiKeyDoc._id,
        name: apiKeyDoc.name,
        prefix: apiKeyDoc.prefix,
        scopes: apiKeyDoc.scopes,
        createdAt: apiKeyDoc.createdAt,
        key, // Plain text key returned only once
      },
    });
  } catch (error) {
    console.error('[Create API Key Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate API Key.' });
  }
};

export const listKeys = async (req, res) => {
  try {
    const keys = await MCPApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const formatted = keys.map((k) => ({
      id: k._id,
      name: k.name,
      prefix: k.prefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      createdAt: k.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: { keys: formatted },
    });
  } catch (error) {
    console.error('[List API Keys Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve API Keys.' });
  }
};

export const revokeKey = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid API Key identifier.' });
    }

    const keyDoc = await MCPApiKey.findOne({ _id: id, userId: req.user._id });
    if (!keyDoc) {
      return res.status(404).json({ success: false, message: 'API Key not found.' });
    }

    keyDoc.revokedAt = new Date();
    await keyDoc.save();

    return res.status(200).json({
      success: true,
      message: 'API Key revoked successfully.',
    });
  } catch (error) {
    console.error('[Revoke API Key Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke API Key.' });
  }
};

// ==========================================
// 2. MCP Server Protocol Tools Endpoints
// ==========================================

/**
 * MCP Tool: list_notebooks
 * GET /api/mcp/notebooks
 */
export const mcpListNotebooks = async (req, res) => {
  try {
    const notebooks = await Notebook.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    const formatted = notebooks.map((nb) => ({
      id: nb._id.toString(),
      title: nb.title,
      description: nb.description,
      createdAt: nb.createdAt,
      updatedAt: nb.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: { notebooks: formatted },
    });
  } catch (error) {
    console.error('[MCP list_notebooks Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * MCP Tool: list_documents
 * GET /api/mcp/notebooks/:notebookId/documents
 */
export const mcpListDocuments = async (req, res) => {
  try {
    const { notebookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebookId.' });
    }

    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({ success: false, message: 'Notebook not found.' });
    }

    const documents = await Document.find({ notebookId: notebook._id, userId: req.user._id })
      .select('originalFilename fileSize mimeType status pageCount chunkCount createdAt')
      .sort({ createdAt: -1 });

    const formatted = documents.map((doc) => ({
      id: doc._id.toString(),
      filename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status,
      pageCount: doc.pageCount,
      chunkCount: doc.chunkCount,
      createdAt: doc.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: { documents: formatted },
    });
  } catch (error) {
    console.error('[MCP list_documents Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * MCP Tool: search_notebook
 * POST /api/mcp/notebooks/:notebookId/search
 * Body: { query, limit }
 */
export const mcpSearchNotebook = async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { query, limit = 5 } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebookId.' });
    }

    const notebook = await Notebook.findOne({ _id: notebookId, userId: req.user._id });
    if (!notebook) {
      return res.status(404).json({ success: false, message: 'Notebook not found.' });
    }

    // Embed query with Cloudflare BGE-base
    const embeddingModel = createEmbeddingModel();
    const queryVector = await embeddingModel.embedQuery(query.trim());

    // Search Qdrant
    const rawHits = await searchVectors({
      queryVector,
      userId: req.user._id,
      notebookId: notebook._id,
      limit: Math.min(parseInt(limit, 10) || 5, 10),
    });

    // Populate filenames
    const docIds = [...new Set(rawHits.map((h) => h.documentId))];
    const docs = await Document.find({ _id: { $in: docIds } }).select('originalFilename');
    const docMap = {};
    docs.forEach((d) => {
      docMap[d._id.toString()] = d.originalFilename;
    });

    const results = rawHits.map((hit) => ({
      documentId: hit.documentId,
      filename: docMap[hit.documentId] || 'Document',
      pageNumber: hit.pageNumber || 1,
      chunkIndex: hit.chunkIndex,
      text: hit.text,
      score: hit.score,
    }));

    return res.status(200).json({
      success: true,
      data: {
        query,
        count: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('[MCP search_notebook Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * MCP Tool: get_document_excerpt
 * GET /api/mcp/documents/:documentId/excerpt?page=1
 */
export const mcpGetDocumentExcerpt = async (req, res) => {
  try {
    const { documentId } = req.params;
    const targetPage = parseInt(req.query.page, 10) || 1;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid documentId.' });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const { pages, pageCount } = await extractDocumentText(document.storagePath, document.mimeType);
    const matchedPage = pages.find((p) => p.pageNumber === targetPage) || pages[0];

    return res.status(200).json({
      success: true,
      data: {
        documentId: document._id.toString(),
        filename: document.originalFilename,
        pageNumber: matchedPage ? matchedPage.pageNumber : 1,
        totalLength: matchedPage ? matchedPage.text.length : 0,
        excerpt: matchedPage ? matchedPage.text.slice(0, 1500) : 'No content available.',
      },
    });
  } catch (error) {
    console.error('[MCP get_document_excerpt Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * MCP Tool: get_notebook_summary
 * GET /api/mcp/documents/:documentId/summary
 */
export const mcpGetSummary = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid documentId.' });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const summary = await Summary.findOne({ documentId: document._id, userId: req.user._id });
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'No summary has been generated for this document yet. Generate it in StudyNest first.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        documentId: document._id.toString(),
        filename: document.originalFilename,
        title: summary.title,
        content: summary.content,
        keyPoints: summary.keyPoints,
        updatedAt: summary.updatedAt,
      },
    });
  } catch (error) {
    console.error('[MCP get_notebook_summary Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

