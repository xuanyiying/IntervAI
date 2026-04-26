import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 500,
  className = '',
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div
        className={`glass-modal glass-card ${className}`}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="glass-modal-header">
            <h3 className="glass-modal-title">{title}</h3>
            <button className="glass-modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className="glass-modal-body">{children}</div>
        {footer && <div className="glass-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;