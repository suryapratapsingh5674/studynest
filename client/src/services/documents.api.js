import api from './api';

export const getDocumentsByNotebook = async (notebookId) => {
  const response = await api.get(`/notebooks/${notebookId}/documents`);
  return response.data.data.documents;
};

export const uploadDocument = async (notebookId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/notebooks/${notebookId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data.document;
};

export const getDocumentStatus = async (documentId) => {
  const response = await api.get(`/documents/${documentId}/status`);
  return response.data.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

export const retryDocumentIngestion = async (documentId) => {
  const response = await api.post(`/documents/${documentId}/retry`);
  return response.data.data;
};

