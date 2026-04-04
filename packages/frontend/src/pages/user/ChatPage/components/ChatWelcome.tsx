import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sender } from '@ant-design/x';
import { PaperClipOutlined } from '@ant-design/icons';
import { Sparkles, TrendingUp, UserCheck, LayoutGrid } from 'lucide-react';
import { Avatar, Tag, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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

const getGreeting = (t: ReturnType<typeof useTranslation>['t']): string => {
  const hour = new Date().getHours();
  if (hour < 12) return t('greeting.morning', '早上好');
  if (hour < 18) return t('greeting.afternoon', '下午好');
  return t('greeting.evening', '晚上好');
};

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

  const welcomeActions = [
    {
      icon: <Sparkles size={18} />,
      label: t('chat.actions.resume_optimization', '简历优化'),
      key: 'resume_optimization',
      tip: t(
        'features.resume_optimization_tip',
        '上传简历，获取个性化优化建议'
      ),
    },
    {
      icon: <TrendingUp size={18} />,
      label: t('chat.actions.interview_prediction', '面试押题'),
      key: 'interview_prediction',
      tip: t(
        'features.interview_prediction_tip',
        'AI 分析岗位 JD，预测高频面试题'
      ),
    },
    {
      icon: <UserCheck size={18} />,
      label: t('chat.actions.mock_interview', '模拟面试'),
      key: 'mock_interview',
      tip: t('features.mock_interview_tip', '真实场景模拟面试，实时反馈表现'),
    },
    {
      icon: <LayoutGrid size={18} />,
      label: t('chat.actions.discover', '发现'),
      key: 'discover',
      tip: t('features.discover_tip', '探索更多 AI 能力和使用技巧'),
    },
  ];

  return (
    <div className="welcome-container dashboard-welcome">
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Hi，{getGreeting(t)}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t('chat.welcome_subtitle', '{username}，今天想做什么？', {
                username: user?.username || '用户',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tag
              color="processing"
              className="!rounded-full !px-3 !py-0.5 !text-xs !border-primary-color/30 !bg-primary-color/10 !text-primary-color"
            >
              {t('quota.free_available', '免费额度可用')}
            </Tag>
            <Avatar
              size={40}
              src={user?.avatar}
              icon={<UserOutlined />}
              className="!bg-[var(--primary-color)]/20 !text-[var(--primary-color)]"
            />
          </div>
        </div>

        <div className="modern-sender-wrapper">
          <Sender
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            loading={loading}
            placeholder={t(
              'chat.placeholder_enhanced',
              '向助手提问，或拖拽简历上传...'
            )}
            prefix={
              <ResumeUploadButton
                onFileSelect={onFileSelect}
                className="!border-none !bg-transparent !text-gray-400 hover:!text-primary !p-0 !flex !items-center !justify-center"
              >
                <PaperClipOutlined style={{ fontSize: '20px' }} />
              </ResumeUploadButton>
            }
            className="modern-sender"
          />
        </div>

        <div className="quick-launch-grid">
          {welcomeActions.map((action) => (
            <Tooltip title={action.tip} placement="bottom" key={action.key}>
              <div
                className="quick-launch-item"
                onClick={() => onActionClick(action.key, action.label)}
              >
                <div className="quick-launch-icon">{action.icon}</div>
                <span className="quick-launch-label">{action.label}</span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};
