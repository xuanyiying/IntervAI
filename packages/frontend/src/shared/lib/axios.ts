import axios from 'axios';
import { message } from 'antd';
import { HTTP_TIMEOUT_MS } from '@/shared/config/app';
import { generateTraceparent } from '@/shared/utils/trace';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: HTTP_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For cases where we need the absolute base URL for direct non-axios uploads (like AntD Upload)
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '/api/v1';
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | undefined;

/** Auth feature registers how the app reacts to a 401, keeping shared free of feature imports. */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

// Request interceptor to add auth token and handle FormData
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach W3C traceparent for backend OTel correlation
    if (!config.headers['traceparent']) {
      config.headers['traceparent'] = generateTraceparent();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle TransformInterceptor wrapper: { data: ..., timestamp: ... }
    const rawData = response.data;
    if (
      rawData &&
      typeof rawData === 'object' &&
      'data' in rawData &&
      'timestamp' in rawData
    ) {
      // Always unwrap - handles both object and array responses
      response.data = rawData.data;
    }

    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and auth state
          // Let React Router handle the redirect via ProtectedRoute
          localStorage.removeItem('auth_token');
          unauthorizedHandler?.();
          break;
        // 403 error handling re-enabled for production
        case 403:
          // Forbidden - quota exceeded or insufficient permissions
          console.error('Access forbidden:', error.response.data);
          message.error(
            error.response.data?.error?.message ||
              error.response.data?.message ||
              'Access denied or quota exceeded. Please upgrade your plan.'
          );
          window.dispatchEvent(new CustomEvent('app:quota_exceeded'));
          break;
        case 429:
          // Rate limit exceeded
          console.error('Rate limit exceeded:', error.response.data);
          message.error('Too many requests. Please try again later.');
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
