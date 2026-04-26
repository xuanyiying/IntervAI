import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  content: string;
}

interface ToastContextValue {
  toast: (type: ToastType, content: string) => void;
  success: (content: string) => void;
  error: (content: string) => void;
  warning: (content: string) => void;
  info: (content: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (content: string) => console.log('[Toast Success]', content),
      error: (content: string) => console.log('[Toast Error]', content),
      warning: (content: string) => console.log('[Toast Warning]', content),
      info: (content: string) => console.log('[Toast Info]', content),
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, content: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, content }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (content) => addToast('success', content),
    error: (content) => addToast('error', content),
    warning: (content) => addToast('warning', content),
    info: (content) => addToast('info', content),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-content">{toast.content}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;