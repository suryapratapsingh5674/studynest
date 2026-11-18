import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireMcpAuth } from '../middleware/mcpAuth.js';
import {
  createKey,
  listKeys,
  revokeKey,
  mcpListNotebooks,
  mcpListDocuments,
  mcpSearchNotebook,
  mcpGetDocumentExcerpt,
  mcpGetSummary,
} from '../controllers/mcp.controller.js';

const router = Router();

// ==========================================
// User Key Management (JWT-Protected)
// ==========================================
router.post('/keys', requireAuth, createKey);
router.get('/keys', requireAuth, listKeys);
router.delete('/keys/:id', requireAuth, revokeKey);

// ==========================================
// MCP Protocol Endpoints (API Key or JWT)
// ==========================================
router.get('/notebooks', requireMcpAuth, mcpListNotebooks);
router.get('/notebooks/:notebookId/documents', requireMcpAuth, mcpListDocuments);
router.post('/notebooks/:notebookId/search', requireMcpAuth, mcpSearchNotebook);
router.get('/documents/:documentId/excerpt', requireMcpAuth, mcpGetDocumentExcerpt);
router.get('/documents/:documentId/summary', requireMcpAuth, mcpGetSummary);

export default router;

