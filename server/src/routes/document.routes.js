import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import {
  uploadDocument,
  getDocumentsByNotebook,
  getDocumentStatus,
  deleteDocument,
  retryDocumentIngestion,
} from '../controllers/document.controller.js';

const router = Router();

// Notebook-scoped document routes
router.post('/notebooks/:id/documents', requireAuth, upload.single('file'), uploadDocument);
router.get('/notebooks/:id/documents', requireAuth, getDocumentsByNotebook);

// Standalone document management routes
router.get('/documents/:id/status', requireAuth, getDocumentStatus);
router.delete('/documents/:id', requireAuth, deleteDocument);
router.post('/documents/:id/retry', requireAuth, retryDocumentIngestion);

export default router;
