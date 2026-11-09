import React from 'react';
import './DashboardCard.css';

interface DashboardCardProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'indigo' | 'purple' | 'warm';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  className,
  variant = 'default',
  header,
  footer,
  onClick,
  hoverable = true,
}) => {
  const variantStyles: Record<string, string> = {
    default: '',
    indigo: 'dashboard-card-indigo',
    purple: 'dashboard-card-purple',
    warm: 'dashboard-card-warm',
  };

  return (
    <div
      className={`
        glass-card dashboard-card ${variantStyles[variant] || ''} 
        ${hoverable ? 'dashboard-card-hoverable' : ''} 
        ${onClick ? 'cursor-pointer' : ''}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {header && <div className="dashboard-card-header">{header}</div>}
      <div className="dashboard-card-body">{children}</div>
      {footer && <div className="dashboard-card-footer">{footer}</div>}
    </div>
  );
};

export default DashboardCard;
