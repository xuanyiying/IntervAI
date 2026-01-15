import React from 'react';
import { Avatar, Tag } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeCertificationsProps {
  certifications?: ParsedResumeData['certifications'];
}

export const ResumeCertifications: React.FC<ResumeCertificationsProps> = ({
  certifications,
}) => {
  const { t } = useTranslation();

  if (!certifications || certifications.length === 0) return null;

  return (
    <section className="data-section mb-0">
      <div className="section-title">
        <Avatar
          icon={<SafetyCertificateOutlined />}
          className="section-avatar bg-orange-400"
        />
        {t('resume.certifications', '资格证书')}
      </div>
      <div className="flex flex-wrap gap-3">
        {certifications.map((cert, idx: number) => (
          <Tag
            key={idx}
            className="m-0 border-none bg-orange-400/10 text-orange-500 rounded-lg px-3 py-1 font-medium"
          >
            {typeof cert === 'string' ? cert : cert.name}
          </Tag>
        ))}
      </div>
    </section>
  );
};
