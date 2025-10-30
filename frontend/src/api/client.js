import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Loans
export const getLoans = () => apiClient.get('/loans');
export const getLoan = (loanId) => apiClient.get(`/loans/${loanId}`);
export const getLoanDocuments = (loanId) => apiClient.get(`/loans/${loanId}/documents`);
export const getLoanConditions = (loanId) => apiClient.get(`/loans/${loanId}/conditions`);
export const getLoanScorecard = (loanId) => apiClient.get(`/loans/${loanId}/scorecard`);

// Documents
export const uploadDocument = (formData) => {
  return apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getDocument = (documentId) => apiClient.get(`/documents/${documentId}`);
export const getDocumentTypes = () => apiClient.get('/document-types');

// Rules
export const getRules = () => apiClient.get('/rules');
export const updateRules = (rules) => apiClient.put('/rules', rules);

// Conditions
export const clearCondition = (conditionId, notes) =>
  apiClient.put(`/conditions/${conditionId}/clear`, { notes });
export const requestDocument = (conditionId, documentType, notes) =>
  apiClient.post(`/conditions/${conditionId}/request-document`, { documentType, notes });

// Agent Dispositions
export const getLoanDispositions = (loanId) => apiClient.get(`/loans/${loanId}/dispositions`);
export const updateDisposition = (dispositionId, actionId, notes) =>
  apiClient.put(`/dispositions/${dispositionId}`, { actionId, notes });

export default apiClient;
