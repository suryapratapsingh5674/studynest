import axios from 'axios';

// Helper to ensure baseURL always targets the /api endpoints
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

// Base Axios client configured for StudyNest API
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studynest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token if not already on login/register
      const isAuthRoute = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (!isAuthRoute && localStorage.getItem('studynest_token')) {
        localStorage.removeItem('studynest_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
