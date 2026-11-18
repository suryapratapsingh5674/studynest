import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocumentSummary,
  getNotebookFlashcards,
  getFlashcardSetById,
  generateFlashcards,
  deleteFlashcardSet,
  getNotebookQuizzes,
  getQuizById,
  generateQuiz,
  deleteQuiz,
} from '../services/studyTools.api';

// Summaries
export const useSummary = (documentId) => {
  return useQuery({
    queryKey: ['summary', documentId],
    queryFn: () => getDocumentSummary(documentId),
    enabled: Boolean(documentId),
  });
};

// Flashcards
export const useFlashcardSets = (notebookId) => {
  return useQuery({
    queryKey: ['flashcards', notebookId],
    queryFn: () => getNotebookFlashcards(notebookId),
    enabled: Boolean(notebookId),
  });
};

export const useGenerateFlashcards = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => generateFlashcards(notebookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', notebookId] });
    },
  });
};

export const useDeleteFlashcardSet = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteFlashcardSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', notebookId] });
    },
  });
};

// Quizzes
export const useQuizzes = (notebookId) => {
  return useQuery({
    queryKey: ['quizzes', notebookId],
    queryFn: () => getNotebookQuizzes(notebookId),
    enabled: Boolean(notebookId),
  });
};

export const useGenerateQuiz = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => generateQuiz(notebookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', notebookId] });
    },
  });
};

export const useDeleteQuiz = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', notebookId] });
    },
  });
};

