import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sender } from '@ant-design/x';
import { PaperClipOutlined } from '@ant-design/icons';
import ResumeUploadButton from '../../../components/ResumeUploadButton';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  onFileSelect: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  loading,
  onFileSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative z-20 pb-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <Sender
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          loading={loading}
          placeholder={t('chat.placeholder')}
          prefix={
            <ResumeUploadButton
              onFileSelect={onFileSelect}
              className="!border-none !bg-transparent !text-gray-400 hover:!text-primary !p-0 !flex !items-center !justify-center"
            >
              <PaperClipOutlined style={{ fontSize: '20px' }} />
            </ResumeUploadButton>
          }
          className="modern-sender shadow-2xl"
        />

        <div className="text-center mt-3 text-gray-500 text-xs tracking-wide">
          {t('chat.ai_disclaimer')}
        </div>
      </div>
    </div>
  );
};
