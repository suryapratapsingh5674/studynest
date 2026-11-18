import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiInferenceLimiter } from '../middleware/rateLimiter.js';
import {
  sendChatMessage,
  getNotebookConversations,
  getConversationMessages,
  deleteConversation,
} from '../controllers/chat.controller.js';

const router = Router();

// Notebook chat endpoints
router.post('/notebooks/:id/chat', requireAuth, aiInferenceLimiter, sendChatMessage);
router.get('/notebooks/:id/conversations', requireAuth, getNotebookConversations);

// Conversation management endpoints
router.get('/conversations/:id/messages', requireAuth, getConversationMessages);
router.delete('/conversations/:id', requireAuth, deleteConversation);

export default router;
