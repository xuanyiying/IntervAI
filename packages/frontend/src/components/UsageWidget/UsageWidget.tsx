import React, { useState } from 'react';
import { useAuthStore } from '@/stores';
import { Logo } from '@/components/Logo';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './UsageWidget.css';

export const UsageWidget: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [usage] = useState<any>(null);

  if (!user) return null;

  return (
    <div
      className={`usage-widget fixed bottom-4 left-4 z-40 glass-card rounded-2xl transition-all duration-300 ${expanded ? 'usage-widget-expanded' : 'usage-widget-collapsed'}`}
    >
      <div
        className="usage-widget-header flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-6 h-6">
          <Logo width={24} height={24} />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {t('widget.usage', '使用量')}
        </span>
        <span className="text-xs font-bold success-color ml-auto">
          {usage?.quota?.tier === 'PRO'
            ? t('widget.pro', '专业版')
            : t('widget.free', '免费版')}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div className="usage-widget-content px-3 pb-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">模拟面试</span>
            <span className="font-medium text-[var(--text-primary)]">
              {usage?.quota?.optimizationsLimit === -1
                ? '∞'
                : `${Math.max(0, (usage?.quota?.optimizationsLimit || 0) - (usage?.quota?.optimizationsUsed || 0))}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">面试精灵</span>
            <span className="font-medium text-[var(--text-primary)]">--</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageWidget;
