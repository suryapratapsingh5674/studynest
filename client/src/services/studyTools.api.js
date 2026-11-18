import api from './api';

// Summaries
export const getDocumentSummary = async (documentId, forceRegenerate = false) => {
  if (forceRegenerate) {
    const res = await api.post(`/documents/${documentId}/summary`, { forceRegenerate: true });
    return res.data.data.summary;
  }
  const res = await api.get(`/documents/${documentId}/summary`);
  return res.data.data.summary;
};

// Flashcards
export const generateFlashcards = async (notebookId, data) => {
  const res = await api.post(`/notebooks/${notebookId}/flashcards`, data);
  return res.data.data.flashcardSet;
};

export const getNotebookFlashcards = async (notebookId) => {
  const res = await api.get(`/notebooks/${notebookId}/flashcards`);
  return res.data.data.flashcardSets;
};

export const getFlashcardSetById = async (id) => {
  const res = await api.get(`/flashcards/${id}`);
  return res.data.data.flashcardSet;
};

export const deleteFlashcardSet = async (id) => {
  const res = await api.delete(`/flashcards/${id}`);
  return res.data;
};

// Quizzes
export const generateQuiz = async (notebookId, data) => {
  const res = await api.post(`/notebooks/${notebookId}/quiz`, data);
  return res.data.data.quiz;
};

export const getNotebookQuizzes = async (notebookId) => {
  const res = await api.get(`/notebooks/${notebookId}/quizzes`);
  return res.data.data.quizzes;
};

export const getQuizById = async (id) => {
  const res = await api.get(`/quizzes/${id}`);
  return res.data.data.quiz;
};

export const deleteQuiz = async (id) => {
  const res = await api.delete(`/quizzes/${id}`);
  return res.data;
};

