import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotebookConversations,
  getConversationMessages,
  sendChatMessage,
  deleteConversation,
} from '../services/chat.api';

export const useConversations = (notebookId) => {
  return useQuery({
    queryKey: ['conversations', notebookId],
    queryFn: () => getNotebookConversations(notebookId),
    enabled: Boolean(notebookId),
  });
};

export const useMessages = (conversationId) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getConversationMessages(conversationId),
    enabled: Boolean(conversationId),
  });
};

export const useSendMessage = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => sendChatMessage(notebookId, data),
    onSuccess: (res) => {
      // Invalidate conversation list to reflect new title or updated timestamp
      queryClient.invalidateQueries({ queryKey: ['conversations', notebookId] });
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ queryKey: ['messages', res.conversationId] });
    },
  });
};

export const useDeleteConversation = (notebookId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', notebookId] });
    },
  });
};

