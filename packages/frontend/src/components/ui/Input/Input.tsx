import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`glass-input-wrapper ${className}`}>
      {label && <label className="glass-input-label">{label}</label>}
      <div className="glass-input-container">
        {icon && <span className="glass-input-icon">{icon}</span>}
        <input
          className={`glass-input ${error ? 'glass-input-error' : ''} ${icon ? 'glass-input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="glass-input-error-text">{error}</span>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`glass-input-wrapper ${className}`}>
      {label && <label className="glass-input-label">{label}</label>}
      <textarea
        className={`glass-textarea ${error ? 'glass-input-error' : ''}`}
        {...props}
      />
      {error && <span className="glass-input-error-text">{error}</span>}
    </div>
  );
};

export default Input;