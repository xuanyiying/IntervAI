import React from 'react';
import { Empty, Tag, Button, Space } from 'antd';
import { HistoryOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Optimization } from '../../types';

interface ResumeHistoryViewProps {
  optimizations: Optimization[];
  onSelectOptimization: (id: string) => void;
}

export const ResumeHistoryView: React.FC<ResumeHistoryViewProps> = ({
  optimizations,
  onSelectOptimization,
}) => {
  const { t } = useTranslation();

  return (
    <div className="resume-history-view p-6">
      <div className="mb-6">
        <Space>
          <HistoryOutlined className="text-primary text-xl" />
          <h2 className="text-xl font-bold m-0">{t('resume.optimization_history', '优化历史')}</h2>
        </Space>
      </div>

      <div className="py-2">
        {!optimizations || optimizations.length === 0 ? (
          <Empty description={t('resume.no_history', '暂无优化记录')} />
        ) : (
          <div className="history-list">
            {optimizations.map((opt) => (
              <div
                key={opt.id}
                className="history-item p-4 mb-4 rounded-xl border border-solid hover:border-primary/30 transition-all group bg-white/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-primary mb-1 flex items-center gap-2">
                      <RocketOutlined className="text-primary text-xs" />
                      {opt.job?.title || 'Target Position'}
                    </div>
                    <div className="text-xs text-secondary">
                      {new Date(opt.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Tag
                    color={
                      opt.status === 'COMPLETED' ? 'success' : 'processing'
                    }
                  >
                    {opt.status === 'COMPLETED'
                      ? t('common.completed')
                      : t('common.processing')}
                  </Tag>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-tertiary">
                    {opt.suggestions?.length || 0}{' '}
                    {t('resume.suggestions_count', '个优化建议')}
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onSelectOptimization(opt.id)}
                  >
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
