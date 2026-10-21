import React from 'react';
import { Button, Typography } from 'antd';
import { RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

interface ResumeAnalysisEmptyStateProps {
  onAnalyze: () => void;
}

export const ResumeAnalysisEmptyState: React.FC<
  ResumeAnalysisEmptyStateProps
> = ({ onAnalyze }) => {
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <ThunderboltOutlined
        style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }}
      />
      <Title level={3}>{t('resume.analysis.empty_title')}</Title>
      <Paragraph
        type="secondary"
        style={{ maxWidth: 600, margin: '0 auto 32px' }}
      >
        {t('resume.analysis.empty_desc')}
      </Paragraph>
      <Button
        type="primary"
        size="large"
        icon={<RocketOutlined />}
        onClick={onAnalyze}
        style={{ height: 48, padding: '0 48px', fontSize: 18 }}
      >
        {t('resume.analysis.start')}
      </Button>
    </div>
  );
};
