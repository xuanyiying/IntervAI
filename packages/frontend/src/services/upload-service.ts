import type { UploadFile } from 'antd/es/upload/interface';
import axiosInstance from '../config/axios';

export const MAX_FILE_SIZE_MB = 10;

export const RESUME_ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const KB_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const RESUME_ACCEPT = '.pdf,.doc,.docx';
export const KB_ACCEPT = '.pdf,.docx,.txt';

export type FileValidationError = 'type' | 'size';

export const validateFile = (
  file: File,
  options: {
    allowedTypes: string[];
    maxSizeMB?: number;
  }
): { valid: boolean; error?: FileValidationError } => {
  if (!options.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'type' };
  }

  const maxSizeMB = options.maxSizeMB ?? MAX_FILE_SIZE_MB;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: 'size' };
  }

  return { valid: true };
};

export const resolveUploadFile = (file: File | UploadFile): File | null => {
  if (file instanceof File) {
    return file;
  }
  if (file.originFileObj instanceof File) {
    return file.originFileObj;
  }
  return null;
};

export type UploadProgress = {
  loaded: number;
  total: number;
};

export type UploadOptions = {
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  onUploadProgress?: (progress: UploadProgress) => void;
};

export const upload = async <T>(
  path: string,
  formData: FormData,
  options: UploadOptions = {}
): Promise<T> => {
  try {
    const response = await axiosInstance({
      method: options.method || 'POST',
      url: path,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options.headers || {}),
      },
      onUploadProgress: (progressEvent) => {
        if (options.onUploadProgress && progressEvent.total) {
          options.onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
          });
        }
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message ||
          error.response.data.error?.message ||
          '上传失败'
      );
    }
    throw new Error(error.message || '上传失败');
  }
};
