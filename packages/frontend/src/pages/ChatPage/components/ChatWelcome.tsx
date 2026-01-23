import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sender } from '@ant-design/x';
import { PaperClipOutlined } from '@ant-design/icons';
import {
  Sparkles,
  TrendingUp,
  UserCheck,
  Briefcase,
  LayoutGrid,
} from 'lucide-react';
import ResumeUploadButton from '../../../components/ResumeUploadButton';

interface ChatWelcomeProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  onFileSelect: (file: File) => void;
  onActionClick: (key: string, label: string) => void;
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  onFileSelect,
  onActionClick,
}) => {
  const { t } = useTranslation();

  const welcomeActions = [
    {
      icon: <Sparkles size={20} />,
      label: t('chat.actions.resume_optimization', '简历优化'),
      key: 'resume_optimization',
    },
    {
      icon: <TrendingUp size={20} />,
      label: t('chat.actions.interview_prediction', '面试预测'),
      key: 'interview_prediction',
    },
    {
      icon: <UserCheck size={20} />,
      label: t('chat.actions.mock_interview', '模拟面试'),
      key: 'mock_interview',
    },
    {
      icon: <LayoutGrid size={20} />,
      label: t('chat.actions.discover', '发现'),
      key: 'discover',
    },
  ];

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">
        {t('chat.welcome_title', '你好，我是你的求职面试AI助手')}
      </h1>

      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="modern-sender-wrapper">
          <Sender
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            loading={loading}
            placeholder={t('chat.placeholder', '向助手提问...')}
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
            <div
              key={action.key}
              className="quick-launch-item"
              onClick={() => onActionClick(action.key, action.label)}
            >
              <div className="quick-launch-icon">{action.icon}</div>
              <span className="quick-launch-label">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
