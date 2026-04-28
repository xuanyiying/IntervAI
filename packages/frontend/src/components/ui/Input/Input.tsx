import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  allowClear?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  allowClear,
  className = '',
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div 
      className={`glass-input-wrapper ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label && <label className="glass-input-label">{label}</label>}
      <div className="glass-input-container">
        {icon && <span className="glass-input-icon">{icon}</span>}
        <input
          className={`glass-input ${error ? 'glass-input-error' : ''} ${icon ? 'glass-input-with-icon' : ''}`}
          {...props}
        />
        {allowClear && props.value && (props.value as string) && isHovered && (
          <button 
            className="glass-input-clear"
            onClick={(e) => {
              e.stopPropagation();
              if (props.onChange) {
                const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
                props.onChange(event);
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
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