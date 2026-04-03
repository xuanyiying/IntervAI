import axios from '../config/axios';
import { User } from '@/types';

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  phone?: string;
  agreement?: boolean;
  invitationCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  user: User;
  token?: string;
  accessToken?: string;
}

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/auth/register', data);
    const result = response.data;
    if (result.accessToken && !result.token) {
      result.token = result.accessToken;
    }
    return result;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/auth/login', data);
    const result = response.data;
    if (result.accessToken && !result.token) {
      result.token = result.accessToken;
    }
    return result;
  },

  logout: async (): Promise<void> => {
    await axios.post('/auth/logout');
  },

  getCurrentUser: async () => {
    const response = await axios.get('/auth/me');
    return response.data;
  },

  verifyEmail: async (code: string): Promise<void> => {
    await axios.post('/auth/verify-email', { code });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await axios.post('/auth/forgot-password', { email });
  },

  resetPassword: async (code: string, newPassword: string): Promise<void> => {
    await axios.post('/auth/reset-password', { code, newPassword });
  },

  verifyToken: async (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const response = await axios.get('/auth/me');
      return response.data;
    } finally {
      delete axios.defaults.headers.common['Authorization'];
    }
  },
};
