import React from 'react';
import { Button, Upload, Typography } from 'antd';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Paragraph } = Typography;

interface ResumeEmptyStateProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export const ResumeEmptyState: React.FC<ResumeEmptyStateProps> = ({
  onUpload,
  uploading,
}) => {
  const { t } = useTranslation();

  return (
    <div className="empty-state min-h-[600px]">
      <div className="empty-icon-wrapper">
        <FileTextOutlined />
      </div>
      <div className="text-2xl font-bold mb-3">请选择或上传简历</div>
      <Paragraph className="text-secondary max-w-xs">
        选择左侧简历版本查看解析后的结构化详情，或点击上方加号按钮上传您的最新简历。
      </Paragraph>
      <Upload
        beforeUpload={(file) => {
          onUpload(file);
          return false;
        }}
        showUploadList={false}
        accept=".pdf,.doc,.docx"
      >
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          loading={uploading}
          className="mt-6 px-8 h-12 rounded-xl shadow-lg shadow-primary/20"
        >
          上传新简历
        </Button>
      </Upload>
    </div>
  );
};
