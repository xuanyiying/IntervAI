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

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

const IconSparkles: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
  </svg>
);

const IconTrendingUp: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconUserCheck: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <polyline points="17 11 19 13 23 9"/>
  </svg>
);

const IconGrid: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconPaperclip: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
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

  const welcomeActions = [
    {
      icon: <IconSparkles />,
      label: '简历优化',
      key: 'resume_optimization',
      tip: '上传简历，获取个性化优化建议',
    },
    {
      icon: <IconTrendingUp />,
      label: '面试押题',
      key: 'interview_prediction',
      tip: 'AI 分析岗位 JD，预测高频面试题',
    },
    {
      icon: <IconUserCheck />,
      label: '模拟面试',
      key: 'mock_interview',
      tip: '真实场景模拟面试，实时反馈表现',
    },
    {
      icon: <IconGrid />,
      label: '发现',
      key: 'discover',
      tip: '探索更多 AI 能力和使用技巧',
    },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Hi，{getGreeting()}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {user?.username || '用户'}，今天想做什么？
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="primary">免费额度可用</Badge>
            <div
              className="w-10 h-10 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-[var(--primary-color)] font-semibold"
              style={{ width: 40, height: 40 }}
            >
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="modern-sender-wrapper">
          <GlassCard
            padding="sm"
            className={`modern-sender ${focused ? 'modern-sender-focused' : ''}`}
            style={{
              background: 'var(--glass-bg)',
              border: focused ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
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
                placeholder="向助手提问，或拖拽简历上传..."
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
                发送
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="quick-launch-grid">
          {welcomeActions.map((action) => (
            <div
              key={action.key}
              className="quick-launch-item"
              onClick={() => onActionClick(action.key, action.label)}
              title={action.tip}
            >
              <div className="quick-launch-icon">{action.icon}</div>
              <span className="quick-launch-label">{action.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard padding="md" variant="indigo" hoverable className="cursor-pointer" onClick={() => onActionClick('resume_upload', '上传简历')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-color)]/20 flex items-center justify-center">
                <IconSparkles size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">上传简历</h3>
                <p className="text-sm text-[var(--text-secondary)]">开始 AI 求职之旅</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="md" variant="purple" hoverable className="cursor-pointer" onClick={() => onActionClick('mock_interview', '模拟面试')}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <IconUserCheck size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">AI 模拟面试</h3>
                <p className="text-sm text-[var(--text-secondary)]">真人模拟面试体验</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};