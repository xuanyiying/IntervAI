import React, { useRef } from 'react';
import { Button, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  MAX_FILE_SIZE_MB,
  RESUME_ACCEPT,
  RESUME_ALLOWED_TYPES,
  validateFile,
} from '../services/upload-service';
import './ResumeUploadButton.css';

interface ResumeUploadButtonProps {
  onFileSelect: (file: File) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * 简历上传按钮组件
 * 仅负责触发文件选择，上传逻辑由父组件处理
 */
const ResumeUploadButton: React.FC<ResumeUploadButtonProps> = ({
  onFileSelect,
  className,
  disabled,
  children,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
    if (!validation.valid) {
      message.error(
        validation.error === 'type'
          ? t('resume.upload_type_error', '只能上传 PDF 或 Word 文档！')
          : t('resume.upload_size_error', '文件大小不能超过 10MB！')
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onFileSelect(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={RESUME_ACCEPT}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <Button
        type="text"
        icon={!children && <CloudUploadOutlined />}
        onClick={triggerFileSelect}
        className={className}
        disabled={disabled}
        style={{ border: 'none', boxShadow: 'none' }}
      >
        {children ?? t('resume.upload', '上传简历')}
      </Button>
    </>
  );
};

export default ResumeUploadButton;
