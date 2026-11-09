import { useContext } from 'react';
import { ToastContext } from './toast-context';

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
