import React from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { FileTextOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Resume } from '../../types';
import { FilePreview } from './FilePreview';

const { Text } = Typography;

interface ResumePreviewModalProps {
  visible: boolean;
  resume: Resume | null;
  onClose: () => void;
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  visible,
  resume,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>{resume?.originalFilename}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="download"
          icon={<CloudDownloadOutlined />}
          href={resume?.fileUrl || '#'}
          target="_blank"
          type="primary"
          disabled={!resume?.fileUrl}
          className="rounded-lg"
        >
          {t('common.download', '下载原文')}
        </Button>,
        <Button key="close" onClick={onClose} className="rounded-lg">
          {t('common.close', '关闭')}
        </Button>,
      ]}
      width="95vw"
      centered
      styles={{
        body: { padding: 0, height: '88vh' },
        mask: { backdropFilter: 'blur(8px)' },
      }}
      className="full-screen-modal"
    >
      <div className="bg-[#F5F5F5] dark:bg-gray-800 h-full overflow-hidden">
        {resume ? (
          <FilePreview
            resumeId={resume.id}
            fileUrl={resume.fileUrl}
            fileType={resume.fileType}
            originalFilename={resume.originalFilename}
          />
        ) : (
          <div className="h-[50vh] flex items-center justify-center">
            <Text type="secondary" className="!text-gray-500">
              {t('resume.preview_unavailable', '预览不可用')}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};
