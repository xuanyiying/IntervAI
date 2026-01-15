import React from 'react';
import { Button, Upload, Empty, Tag } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Resume, ParseStatus } from '../../types';

interface ResumeSidebarProps {
  resumes: Resume[];
  currentResume: Resume | null;
  onSelect: (resume: Resume) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}

export const ResumeSidebar: React.FC<ResumeSidebarProps> = ({
  resumes,
  currentResume,
  onSelect,
  onUpload,
  uploading,
}) => {
  const { t } = useTranslation();

  const getStatusTag = (status: ParseStatus) => {
    switch (status) {
      case ParseStatus.COMPLETED:
        return <Tag color="success">{t('resume.status_completed', '已解析')}</Tag>;
      case ParseStatus.PROCESSING:
        return <Tag color="processing">{t('resume.status_processing', '解析中')}</Tag>;
      case ParseStatus.FAILED:
        return <Tag color="error">{t('resume.status_failed', '解析失败')}</Tag>;
      default:
        return <Tag color="default">{t('resume.status_pending', '待处理')}</Tag>;
    }
  };

  return (
    <aside className="resume-sidebar">
      <div className="resume-list-card">
        <div className="resume-list-header">
          <span className="font-medium">{t('resume.list_title', '简历记录')}</span>
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
              shape="circle"
              icon={<PlusOutlined />}
              loading={uploading}
              className="shadow-lg shadow-primary/20"
            />
          </Upload>
        </div>

        <div className="py-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          {!resumes || resumes.length === 0 ? (
            <div className="px-6 py-10 text-center opacity-40">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('resume.no_resumes', '暂无简历')}
              />
            </div>
          ) : (
            resumes.map((item: Resume) => (
              <div
                key={item.id}
                className={`resume-item ${item.id === currentResume?.id ? 'active' : ''}`}
                onClick={() => onSelect(item)}
              >
                <div className="resume-item-icon">
                  <FileTextOutlined />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium truncate pr-2">
                      {item.title || item.originalFilename}
                    </span>
                    {item.isPrimary && (
                      <div
                        className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        title="Active"
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      v{item.version} ·{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {getStatusTag(item.parseStatus)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
