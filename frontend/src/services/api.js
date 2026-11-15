import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please check the backend connection.';
    return Promise.reject(new Error(message));
  }
);

export const BooksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const LoansAPI = {
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`),
  issue: (data) => api.post('/loans/issue', data),
  returnBook: (id, data) => api.post(`/loans/${id}/return`, data || {}),
};

export const AnalyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getCategories: () => api.get('/analytics/categories'),
  getMonthly: (params) => api.get('/analytics/monthly', { params }),
  getDuration: () => api.get('/analytics/duration'),
  getInsights: () => api.get('/analytics/insights'),
  getOverdue: (params) => api.get('/overdue', { params }),
  getReturnedLate: (params) => api.get('/overdue/returned-late', { params }),
};

export const ImportAPI = {
  preview: (formData) => api.post('/import/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  confirm: (data) => api.post('/import/confirm', data),
};

export const ValidationAPI = {
  getReport: () => api.get('/validation'),
  runCheck: () => api.post('/validation/check'),
};

export const SettingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  resetData: () => api.post('/settings/reset-data'),
};

export const ReportsAPI = {
  getPrintableData: () => api.get('/reports/printable'),
  exportLoansCSVUrl: '/api/export/loans/csv',
  exportSummaryJSONUrl: '/api/export/summary/json',
  exportOverdueCSVUrl: '/api/export/overdue/csv',
  exportValidationCSVUrl: '/api/export/validation/csv',
};

export default api;
