import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { testConfig } from '@/config/test.config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiHelper {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || `${testConfig.apiBaseUrl}/api/v1`,
      timeout: testConfig.timeout.default,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  async uploadFile(url: string, file: Buffer, filename: string, fieldName = 'file'): Promise<AxiosResponse> {
    const formData = new FormData();
    const blob = new Blob([file]);
    formData.append(fieldName, blob, filename);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: testConfig.timeout.upload,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async waitForService(maxAttempts = 10, delay = 2000): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const isHealthy = await this.healthCheck();
      if (isHealthy) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  }
}

export const api = new ApiHelper();
