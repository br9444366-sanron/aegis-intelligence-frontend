/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Backend API Client
 * ============================================================
 * A pre-configured Axios instance that:
 *  - Points to the backend API base URL (from .env)
 *  - Automatically attaches Firebase ID tokens to every request
 *  - Handles 401 (token expired) by refreshing and retrying
 *  - Provides consistent error objects to all callers
 *
 * Usage:
 *   import api from '@/api/apiClient';
 *   const { data } = await api.get('/goals');
 *   await api.post('/goals', { title: 'Study Physics', ... });
 * ============================================================
 */

import axios from 'axios';
import { getAuth } from 'firebase/auth';

// ── Create Axios instance ────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach auth token ───────────────────
// Runs before every request. Gets the current user's ID token
// from Firebase Auth and attaches it as a Bearer token.
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        // forceRefresh=false: uses cached token unless it expires in < 5 min
        const token = await user.getIdToken(false);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[ApiClient] Could not get auth token:', error.message);
      // Don't block the request — let the server return 401 if auth is needed
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle token expiry ────────────────
// If the server returns 401 (token expired), force-refresh the
// Firebase token and retry the original request once.
let isRefreshing = false;
let failedQueue = []; // Queue of requests waiting for token refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response, // Pass successful responses through

  async (error) => {
    const originalRequest = error.config;

    // Only retry on 401 (Unauthorized) and only once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) throw new Error('No authenticated user');

        // Force refresh the ID token
        const newToken = await user.getIdToken(true);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Token refresh failed — user needs to sign in again
        // The AuthContext will detect this and redirect to /auth
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Normalize error format ────────────────────────────────
    // All API errors will have a consistent shape: { message, status, data }
    const normalizedError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      status:  error.response?.status,
      data:    error.response?.data,
      isAxiosError: true,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
