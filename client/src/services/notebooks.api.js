import api from './api';

export const getNotebooks = async () => {
  const response = await api.get('/notebooks');
  return response.data.data.notebooks;
};

export const getNotebookById = async (id) => {
  const response = await api.get(`/notebooks/${id}`);
  return response.data.data.notebook;
};

export const createNotebook = async (data) => {
  const response = await api.post('/notebooks', data);
  return response.data.data.notebook;
};

export const updateNotebook = async (id, data) => {
  const response = await api.patch(`/notebooks/${id}`, data);
  return response.data.data.notebook;
};

export const deleteNotebook = async (id) => {
  const response = await api.delete(`/notebooks/${id}`);
  return response.data;
};

