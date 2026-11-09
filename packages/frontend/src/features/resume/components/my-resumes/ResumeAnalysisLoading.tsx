import React from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

export const ResumeAnalysisLoading: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <Spin size="large" tip={t('resume.analysis.loading_tip')} />
      <div style={{ marginTop: 24, color: '#8c8c8c' }}>
        {t('resume.analysis.loading_desc')}
      </div>
    </div>
  );
};
