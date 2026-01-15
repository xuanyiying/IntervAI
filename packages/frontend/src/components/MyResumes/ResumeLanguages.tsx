import React from 'react';
import { Avatar, Tag } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeLanguagesProps {
  languages?: ParsedResumeData['languages'];
}

export const ResumeLanguages: React.FC<ResumeLanguagesProps> = ({ languages }) => {
  const { t } = useTranslation();

  if (!languages || languages.length === 0) return null;

  return (
    <section className="data-section mb-0">
      <div className="section-title">
        <Avatar
          icon={<GlobalOutlined />}
          className="section-avatar bg-blue-400"
        />
        {t('resume.languages', '语言能力')}
      </div>
      <div className="flex flex-wrap gap-3">
        {languages.map((lang, idx) => (
          <Tag
            key={idx}
            className="m-0 border-none bg-blue-400/10 text-blue-500 rounded-lg px-3 py-1 font-medium"
          >
            {lang.name} {lang.proficiency && `· ${lang.proficiency}`}
          </Tag>
        ))}
      </div>
    </section>
  );
};
