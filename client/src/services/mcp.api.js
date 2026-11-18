import api from './api';

export const createApiKey = async (name) => {
  const response = await api.post('/mcp/keys', { name });
  return response.data.data;
};

export const listApiKeys = async () => {
  const response = await api.get('/mcp/keys');
  return response.data.data.keys;
};

export const revokeApiKey = async (id) => {
  const response = await api.delete(`/mcp/keys/${id}`);
  return response.data;
};

