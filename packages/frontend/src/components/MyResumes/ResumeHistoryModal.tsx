import React from 'react';
import { Modal, Empty, Tag, Button, Space } from 'antd';
import { HistoryOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../i18n';
import { Optimization } from '../../types';

interface ResumeHistoryModalProps {
  visible: boolean;
  optimizations: Optimization[];
  onClose: () => void;
  onSelectOptimization: (id: string) => void;
}

export const ResumeHistoryModal: React.FC<ResumeHistoryModalProps> = ({
  visible,
  optimizations,
  onClose,
  onSelectOptimization,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined className="text-primary" />
          <span>{t('resume.optimization_history', '优化历史')}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      className="history-modal"
    >
      <div className="py-2">
        {!optimizations || optimizations.length === 0 ? (
          <Empty description={t('resume.no_history', '暂无优化记录')} />
        ) : (
          <div className="history-list max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {optimizations.map((opt) => (
              <div
                key={opt.id}
                className="history-item p-4 mb-4 rounded-xl border border-solid hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-primary mb-1 flex items-center gap-2">
                      <RocketOutlined className="text-primary text-xs" />
                      {opt.job?.title || 'Target Position'}
                    </div>
                    <div className="text-xs text-secondary">
                      {formatDateTime(opt.createdAt)}
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
    </Modal>
  );
};
