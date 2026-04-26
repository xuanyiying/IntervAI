import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        glass-button
        glass-button-${variant}
        glass-button-${size}
        ${loading ? 'glass-button-loading' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="glass-button-spinner" />
      ) : icon ? (
        <span className="glass-button-icon">{icon}</span>
      ) : null}
      {children && <span className="glass-button-text">{children}</span>}
    </button>
  );
};

export default Button;