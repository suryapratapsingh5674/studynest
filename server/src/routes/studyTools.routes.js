import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiInferenceLimiter } from '../middleware/rateLimiter.js';
import {
  getDocumentSummary,
  createFlashcards,
  getNotebookFlashcards,
  getFlashcardSetById,
  deleteFlashcardSet,
  createQuiz,
  getNotebookQuizzes,
  getQuizById,
  deleteQuiz,
} from '../controllers/studyTools.controller.js';

const router = Router();

// Summary routes
router.post('/documents/:id/summary', requireAuth, aiInferenceLimiter, getDocumentSummary);
router.get('/documents/:id/summary', requireAuth, getDocumentSummary);

// Flashcard routes
router.post('/notebooks/:id/flashcards', requireAuth, aiInferenceLimiter, createFlashcards);
router.get('/notebooks/:id/flashcards', requireAuth, getNotebookFlashcards);
router.get('/flashcards/:id', requireAuth, getFlashcardSetById);
router.delete('/flashcards/:id', requireAuth, deleteFlashcardSet);

// Quiz routes
router.post('/notebooks/:id/quiz', requireAuth, aiInferenceLimiter, createQuiz);
router.get('/notebooks/:id/quizzes', requireAuth, getNotebookQuizzes);
router.get('/quizzes/:id', requireAuth, getQuizById);
router.delete('/quizzes/:id', requireAuth, deleteQuiz);

export default router;
