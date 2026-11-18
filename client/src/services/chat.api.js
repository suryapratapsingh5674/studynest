import api from './api';

export const sendChatMessage = async (notebookId, data) => {
  const response = await api.post(`/notebooks/${notebookId}/chat`, data);
  return response.data.data;
};

export const getNotebookConversations = async (notebookId) => {
  const response = await api.get(`/notebooks/${notebookId}/conversations`);
  return response.data.data.conversations;
};

export const getConversationMessages = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}/messages`);
  return response.data.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await api.delete(`/conversations/${conversationId}`);
  return response.data;
};

