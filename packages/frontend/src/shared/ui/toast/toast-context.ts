import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastContextValue {
  toast: (type: ToastType, content: string) => void;
  success: (content: string) => void;
  error: (content: string) => void;
  warning: (content: string) => void;
  info: (content: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
