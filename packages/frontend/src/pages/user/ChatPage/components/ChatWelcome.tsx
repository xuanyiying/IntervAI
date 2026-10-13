import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard, Button, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores';
import ResumeUploadButton from '../../../../components/ResumeUploadButton';

interface ChatWelcomeProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  onFileSelect: (file: File) => void;
  onActionClick: (key: string, label: string) => void;
}

const IconSparkles: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </svg>
);

const IconTrendingUp: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconUserCheck: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const IconGrid: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconPaperclip: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  onFileSelect,
  onActionClick,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Top feature cards (single row, no duplicates with quick-launch-grid)
  const featureCards = [
    {
      key: 'resume_optimization',
      icon: <IconSparkles size={24} />,
      titleKey: 'chat.actions.resume_optimization',
      descKey: 'chat.actions.tips.resume_optimization',
      variant: 'indigo' as const,
      labelFallback: '简历优化',
    },
    {
      key: 'interview_prediction',
      icon: <IconTrendingUp size={24} />,
      titleKey: 'chat.actions.interview_prediction',
      descKey: 'chat.actions.tips.interview_prediction',
      variant: 'purple' as const,
      labelFallback: '面试押题',
    },
    {
      key: 'mock_interview',
      icon: <IconUserCheck size={24} />,
      titleKey: 'chat.actions.mock_interview',
      descKey: 'chat.actions.tips.mock_interview',
      variant: 'purple' as const,
      labelFallback: '模拟面试',
    },
    {
      key: 'discover',
      icon: <IconGrid size={24} />,
      titleKey: 'chat.actions.discover',
      descKey: 'chat.actions.tips.discover',
      variant: 'warm' as const,
      labelFallback: '发现',
    },
  ];

  const greetingKey = ((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'chat.greeting_morning';
    if (hour < 18) return 'chat.greeting_afternoon';
    return 'chat.greeting_evening';
  })();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) {
        onSubmit(value);
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="welcome-container dashboard-welcome">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting + quota badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t('chat.greeting_hi')}
              {t(greetingKey)}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {user
                ? t('chat.welcome_subtitle', {
                    username: user.username || t('chat.default_user_label'),
                  })
                : t('chat.welcome_subtitle_guest')}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user && <Badge variant="primary">{t('chat.free_quota_badge')}</Badge>}
            {user && (
              <div
                className="w-10 h-10 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-[var(--primary-color)] font-semibold"
                style={{ width: 40, height: 40 }}
              >
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="modern-sender-wrapper">
          <GlassCard
            padding="sm"
            className={`modern-sender ${focused ? 'modern-sender-focused' : ''}`}
            style={{
              background: 'var(--glass-bg)',
              border: focused
                ? '1px solid var(--primary-color)'
                : '1px solid var(--glass-border)',
            }}
          >
            <div className="flex items-end gap-2">
              <ResumeUploadButton
                onFileSelect={onFileSelect}
                className="!border-none !bg-transparent !text-gray-400 hover:!text-primary !p-0 !flex !items-center !justify-center"
              >
                <IconPaperclip size={20} />
              </ResumeUploadButton>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={t('chat.placeholder_enhanced')}
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[var(--text-primary)] placeholder:text-gray-400 min-h-[24px]"
                style={{ minHeight: 24, maxHeight: 120 }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSubmit(value)}
                disabled={!value.trim() || loading}
                loading={loading}
              >
                {t('chat.send')}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Feature cards (4-up grid; replaces the previous 4-icon + 2-card duplicate layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featureCards.map((card) => (
            <GlassCard
              key={card.key}
              padding="md"
              variant={card.variant}
              hoverable
              className="cursor-pointer"
              onClick={() =>
                onActionClick(card.key, t(card.titleKey, card.labelFallback))
              }
            >
              <div className="flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-color)]/20 flex items-center justify-center text-[var(--primary-color)]">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-base">
                    {t(card.titleKey, card.labelFallback)}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {t(card.descKey, card.labelFallback)}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};