import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to inject JWT Bearer token into all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for standard error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional auto-logout on expired session if needed
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/api/auth/login", credentials),
  register: (userData) => api.post("/api/auth/register", userData),
  getMe: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

export const datasetAPI = {
  list: () => api.get("/api/datasets"),
  upload: (formData) => api.post("/api/datasets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  getDetails: (id) => api.get(`/api/datasets/${id}`),
  validate: (id) => api.post(`/api/datasets/${id}/validate`),
  clean: (id) => api.post(`/api/datasets/${id}/clean`),
  getCleanedDownloadUrl: (id) => `${API_BASE_URL}/api/datasets/${id}/download-cleaned`,
};

export const edaAPI = {
  getSummary: (datasetId) => api.get(`/api/eda/summary${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  analyze: (formData) => api.post("/api/eda/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  clean: (datasetId) => api.post(`/api/eda/clean?dataset_id=${datasetId}`),
};

export const analyticsAPI = {
  getDashboard: (datasetId) => api.get(`/api/analytics/dashboard${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  getPerformance: (datasetId) => api.get(`/api/analytics/performance${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  getProductivity: (datasetId) => api.get(`/api/analytics/productivity${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  getSegmentation: (datasetId) => api.get(`/api/analytics/segmentation${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  getInsights: (datasetId) => api.get(`/api/analytics/insights${datasetId ? `?dataset_id=${datasetId}` : ""}`),
};

export const predictionsAPI = {
  runAll: (datasetId) => api.post(`/api/predictions/run-all${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  predictAttrition: (datasetId) => api.post(`/api/predictions/attrition${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  predictPromotion: (datasetId) => api.post(`/api/predictions/promotion${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  predictPerformance: (datasetId) => api.post(`/api/predictions/performance${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  predictProductivity: (datasetId) => api.post(`/api/predictions/productivity${datasetId ? `?dataset_id=${datasetId}` : ""}`),
  predictSegmentation: (datasetId) => api.post(`/api/predictions/segmentation${datasetId ? `?dataset_id=${datasetId}` : ""}`),
};

export const skillsAPI = {
  getSkillGaps: (datasetId) => api.get(`/api/skills/analyze${datasetId ? `?dataset_id=${datasetId}` : ""}`),
};

export const trainingAPI = {
  getRecommendations: (datasetId) => api.get(`/api/training/recommend${datasetId ? `?dataset_id=${datasetId}` : ""}`),
};

export const employeeAPI = {
  list: (params = {}) => api.get("/api/employees", { params }),
  getMe: () => api.get("/api/employees/me"),
  getDetail: (id) => api.get(`/api/employees/${id}`),
};

export const reportsAPI = {
  getReportUrl: (format, reportType) => `${API_BASE_URL}/api/reports/${format}?report_type=${reportType}`,
};

export default api;