import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotebooks,
  getNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
} from '../services/notebooks.api';

export const useNotebooks = () => {
  return useQuery({
    queryKey: ['notebooks'],
    queryFn: getNotebooks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useNotebook = (id) => {
  return useQuery({
    queryKey: ['notebook', id],
    queryFn: () => getNotebookById(id),
    enabled: Boolean(id),
  });
};

export const useCreateNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

export const useUpdateNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateNotebook(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notebook', variables.id] });
    },
  });
};

export const useDeleteNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotebook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });
};

