import mongoose from 'mongoose';
import Summary from '../models/Summary.js';
import FlashcardSet from '../models/FlashcardSet.js';
import Quiz from '../models/Quiz.js';
import Notebook from '../models/Notebook.js';
import Document from '../models/Document.js';
import { getOrGenerateSummary } from '../services/study-tools/summary.service.js';
import { generateFlashcardSet } from '../services/study-tools/flashcard.service.js';
import { generateQuiz } from '../services/study-tools/quiz.service.js';

// ==========================================
// 1. Summaries
// ==========================================

export const getDocumentSummary = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const forceRegenerate = req.method === 'POST' && req.body.forceRegenerate === true;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ success: false, message: 'Invalid document identifier.' });
    }

    const summary = await getOrGenerateSummary({
      documentId,
      userId: req.user._id,
      forceRegenerate,
    });

    return res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('[Summary Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate document summary.',
    });
  }
};

// ==========================================
// 2. Flashcards
// ==========================================

export const createFlashcards = async (req, res) => {
  try {
    const { id: notebookId } = req.params;
    const { count, documentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebook identifier.' });
    }

    const flashcardSet = await generateFlashcardSet({
      notebookId,
      userId: req.user._id,
      documentId,
      count,
    });

    return res.status(201).json({
      success: true,
      message: 'Flashcards generated successfully',
      data: { flashcardSet },
    });
  } catch (error) {
    console.error('[Flashcard Create Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate flashcard set.',
    });
  }
};

export const getNotebookFlashcards = async (req, res) => {
  try {
    const { id: notebookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebook identifier.' });
    }

    const flashcardSets = await FlashcardSet.find({
      notebookId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { flashcardSets },
    });
  } catch (error) {
    console.error('[Get Flashcards Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve flashcard sets.',
    });
  }
};

export const getFlashcardSetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid flashcard identifier.' });
    }

    const set = await FlashcardSet.findOne({ _id: id, userId: req.user._id });
    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found.' });
    }

    return res.status(200).json({
      success: true,
      data: { flashcardSet: set },
    });
  } catch (error) {
    console.error('[Get Flashcard By ID Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load flashcard set.' });
  }
};

export const deleteFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid flashcard identifier.' });
    }

    const set = await FlashcardSet.findOne({ _id: id, userId: req.user._id });
    if (!set) {
      return res.status(404).json({ success: false, message: 'Flashcard set not found.' });
    }

    await set.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Flashcard set deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Flashcard Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete flashcard set.' });
  }
};

// ==========================================
// 3. Quizzes
// ==========================================

export const createQuiz = async (req, res) => {
  try {
    const { id: notebookId } = req.params;
    const { count, documentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebook identifier.' });
    }

    const quiz = await generateQuiz({
      notebookId,
      userId: req.user._id,
      documentId,
      count,
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      data: { quiz },
    });
  } catch (error) {
    console.error('[Quiz Create Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate quiz.',
    });
  }
};

export const getNotebookQuizzes = async (req, res) => {
  try {
    const { id: notebookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notebookId)) {
      return res.status(400).json({ success: false, message: 'Invalid notebook identifier.' });
    }

    const quizzes = await Quiz.find({
      notebookId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { quizzes },
    });
  } catch (error) {
    console.error('[Get Quizzes Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes.',
    });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz identifier.' });
    }

    const quiz = await Quiz.findOne({ _id: id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    return res.status(200).json({
      success: true,
      data: { quiz },
    });
  } catch (error) {
    console.error('[Get Quiz By ID Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load quiz.' });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz identifier.' });
    }

    const quiz = await Quiz.findOne({ _id: id, userId: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    await quiz.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Quiz Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete quiz.' });
  }
};

