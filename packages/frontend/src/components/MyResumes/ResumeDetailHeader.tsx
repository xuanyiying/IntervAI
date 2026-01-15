import React from 'react';
import { Button, Tag, Space, Typography } from 'antd';
import {
  EyeOutlined,
  HistoryOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Resume, ParseStatus } from '../../types';

interface ResumeDetailHeaderProps {
  resume: Resume;
  onPreview: () => void;
  onHistory: () => void;
  onAnalyze: () => void;
  onOptimize: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}

export const ResumeDetailHeader: React.FC<ResumeDetailHeaderProps> = ({
  resume,
  onPreview,
  onHistory,
  onAnalyze,
  onOptimize,
  onSetPrimary,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="resume-detail-header">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold m-0">
              {resume.title || resume.originalFilename}
            </h2>
            <Tag className="glass-tag text-secondary">v{resume.version}</Tag>
          </div>
          <Space className="text-secondary">
            <HistoryOutlined />
            <span>
              上次更新: {new Date(resume.createdAt).toLocaleString()}
            </span>
          </Space>
        </div>
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={onPreview}
            className="glass-button"
          >
            预览原文
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={onHistory}
            className="glass-button"
          >
            {t('resume.optimization_history', '优化历史')}
          </Button>
          {resume.parseStatus === ParseStatus.COMPLETED && (
            <>
              <Button
                icon={<ThunderboltOutlined />}
                onClick={onAnalyze}
                className="glass-button border-purple-500/30 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
              >
                深度诊断
              </Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={onOptimize}
                className="bg-gradient-to-r from-primary to-blue-600 border-none shadow-lg shadow-primary/20"
              >
                {t('resume.optimize', '优化简历')}
              </Button>
            </>
          )}
          {!resume.isPrimary && (
            <Button
              type="primary"
              onClick={onSetPrimary}
              className="shadow-lg shadow-primary/20"
            >
              {t('resume.set_as_active', '设为当前活跃')}
            </Button>
          )}
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            className="glass-button !border-red-500/30 !text-red-500 hover:!bg-red-500/10"
          >
            {t('common.delete', '删除')}
          </Button>
        </Space>
      </div>
    </div>
  );
};
