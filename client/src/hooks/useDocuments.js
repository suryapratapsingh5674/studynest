import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocumentsByNotebook,
  uploadDocument,
  deleteDocument,
  retryDocumentIngestion,
} from '../services/documents.api';

export const useDocuments = (notebookId) => {
  return useQuery({
    queryKey: ['documents', notebookId],
    queryFn: () => getDocumentsByNotebook(notebookId),
    enabled: Boolean(notebookId),
    // Auto-poll every 3 seconds if any document is actively processing
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs || !Array.isArray(docs)) return false;
      const isStillProcessing = docs.some(
        (d) => d.status === 'processing' || d.status === 'uploaded'
      );
      return isStillProcessing ? 3000 : false;
    },
  });
};

export const useUploadDocument = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => uploadDocument(notebookId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

export const useDeleteDocument = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

export const useRetryDocument = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId) => retryDocumentIngestion(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', notebookId] });
    },
  });
};

