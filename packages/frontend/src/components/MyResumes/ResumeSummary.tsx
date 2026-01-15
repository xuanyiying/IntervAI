import React from 'react';
import { Avatar, Typography } from 'antd';
import { ProfileOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Paragraph } = Typography;

interface ResumeSummaryProps {
  summary?: string;
}

export const ResumeSummary: React.FC<ResumeSummaryProps> = ({ summary }) => {
  const { t } = useTranslation();

  if (!summary) return null;

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<ProfileOutlined />}
          className="section-avatar bg-blue-500"
        />
        {t('resume.summary', '专业总结')}
      </div>
      <div className="summary-content">
        <Paragraph className="text-secondary leading-relaxed italic">
          "{summary}"
        </Paragraph>
      </div>
    </section>
  );
};
