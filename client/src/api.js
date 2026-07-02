import axios from 'axios';

const axiosInstance = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api', });

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) localStorage.removeItem('token');
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => axiosInstance.post('/auth/login', { email, password }),
  register: (email, password, name) => axiosInstance.post('/auth/register', { email, password, name }),
  me: () => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.put('/auth/profile', data),
  logout: () => axiosInstance.post('/auth/logout')
};

export const jobsAPI = {
  getJobs: (params) => axiosInstance.get('/jobs', { params }),
  search: (q) => axiosInstance.get('/jobs/search', { params: { q } }),
  getById: (id) => axiosInstance.get(`/jobs/${id}`),
  getSourceCounts: () => axiosInstance.get('/jobs/sources/counts'),
  create: (data) => axiosInstance.post('/jobs', data)
};

export const savedAPI = {
  getSaved: () => axiosInstance.get('/saved'),
  save: (data) => axiosInstance.post('/saved', data),
  move: (id, column) => axiosInstance.patch(`/saved/${id}/move`, { column }),
  remove: (id) => axiosInstance.delete(`/saved/${id}`)
};

export const applicationsAPI = {
  getApplications: () => axiosInstance.get('/applications'),
  create: (data) => axiosInstance.post('/applications', data),
  autoApply: (jobId) => axiosInstance.post('/applications/auto-apply', { jobId }),
  update: (id, data) => axiosInstance.patch(`/applications/${id}`, data),
  remove: (id) => axiosInstance.delete(`/applications/${id}`)
};

export const insightsAPI = {
  getInsights: () => axiosInstance.get('/insights')
};

export const adminAPI = {
  getStats: () => axiosInstance.get('/admin/stats'),
  getRuns: () => axiosInstance.get('/admin/runs'),
  getSourceRuns: (source) => axiosInstance.get(`/admin/runs/${source}`),
  triggerScrape: () => axiosInstance.post('/admin/scrape'),
  triggerSourceScrape: (source) => axiosInstance.post(`/admin/scrape/${source}`)
};

export const jobAlertsAPI = {
  getAlerts: () => axiosInstance.get('/job-alerts'),
  create: (data) => axiosInstance.post('/job-alerts', data),
  update: (id, data) => axiosInstance.patch(`/job-alerts/${id}`, data),
  toggle: (id) => axiosInstance.patch(`/job-alerts/${id}/toggle`),
  test: (id) => axiosInstance.post(`/job-alerts/${id}/test`),
  remove: (id) => axiosInstance.delete(`/job-alerts/${id}`)
};

export const profileAPI = {
  get: () => axiosInstance.get('/profile'),
  update: (data) => axiosInstance.put('/profile', data),
  getJobs: () => axiosInstance.get('/profile/jobs')
};

export const linkedinAPI = {
  getStatus: () => axiosInstance.get('/linkedin/status'),
  sync: () => axiosInstance.post('/linkedin/sync')
};

export const feedbackAPI = {
  submit: (jobId, vote, reason) => axiosInstance.post('/feedback', { jobId, vote, reason }),
  getHistory: () => axiosInstance.get('/feedback'),
  getStats: () => axiosInstance.get('/feedback/stats'),
  getRecommendations: () => axiosInstance.get('/feedback/recommendations')
};

export const scraperRunsAPI = {
  getRuns: (params) => axiosInstance.get('/scraper-runs', { params }),
  getLatest: () => axiosInstance.get('/scraper-runs/latest')
};

export default axiosInstance;
