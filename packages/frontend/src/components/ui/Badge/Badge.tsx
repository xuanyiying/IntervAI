import React from 'react';
import './Badge.css';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  return (
    <span className={`glass-badge glass-badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;