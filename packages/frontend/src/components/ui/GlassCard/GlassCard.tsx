import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'indigo' | 'purple' | 'warm';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}) => {
  const paddingClass = {
    none: '',
    sm: 'glass-card-padding-sm',
    md: 'glass-card-padding-md',
    lg: 'glass-card-padding-lg',
  };

  return (
    <div
      className={`
        glass-card
        glass-card-variant-${variant}
        ${paddingClass[padding]}
        ${hoverable ? 'glass-card-hoverable' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;