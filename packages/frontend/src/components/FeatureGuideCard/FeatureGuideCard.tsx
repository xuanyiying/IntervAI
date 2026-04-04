import React from 'react';
import './FeatureGuideCard.css';

interface FeatureGuideCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export const FeatureGuideCard: React.FC<FeatureGuideCardProps> = ({
  icon,
  title,
  description,
  className,
}) => {
  return (
    <div
      className={`feature-guide-card flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[var(--glass-bg-hover)] ${className || ''}`}
    >
      <div className="feature-guide-icon flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="feature-guide-title text-sm font-semibold text-[var(--text-primary)] mb-1">
          {title}
        </div>
        <div className="feature-guide-desc text-xs text-[var(--text-tertiary)] leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};

export default FeatureGuideCard;
