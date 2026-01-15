import React from 'react';
import { Avatar } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeEducationProps {
  education?: ParsedResumeData['education'];
}

export const ResumeEducation: React.FC<ResumeEducationProps> = ({
  education,
}) => {
  const { t } = useTranslation();

  if (!education || education.length === 0) return null;

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<ReadOutlined />}
          className="section-avatar bg-purple-500"
        />
        {t('resume.education', '教育背景')}
      </div>
      <div className="education-list">
        {education.map((edu, idx) => (
          <div key={idx} className="education-item mb-6 last:mb-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-lg font-bold text-primary">
                  {edu.institution}
                </div>
                <div className="text-secondary font-medium">
                  {edu.degree} · {edu.field}
                </div>
              </div>
              <div className="text-tertiary text-sm">
                {edu.startDate} - {edu.endDate || t('common.present', '至今')}
              </div>
            </div>
            {edu.achievements && edu.achievements.length > 0 && (
              <ul className="achievement-list mt-2">
                {edu.achievements.map((ach, i) => (
                  <li key={i} className="text-secondary text-sm mb-1">
                    {ach}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
