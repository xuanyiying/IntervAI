import React from 'react';
import { Avatar } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeExperienceProps {
  experience?: ParsedResumeData['experience'];
}

export const ResumeExperience: React.FC<ResumeExperienceProps> = ({ experience }) => {
  const { t } = useTranslation();

  if (!experience || experience.length === 0) return null;

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<HistoryOutlined />}
          className="section-avatar bg-amber-500"
        />
        {t('resume.experience', '工作经验')}
      </div>
      <div className="experience-timeline">
        {experience.map((exp, idx) => (
          <div key={idx} className="experience-item">
            <div className="experience-header">
              <div>
                <div className="experience-company font-bold">
                  {exp.company}
                </div>
                <div className="text-primary font-medium">
                  {exp.position}
                </div>
              </div>
              <div className="experience-date">
                {exp.startDate} - {exp.endDate || t('common.present', '至今')}
              </div>
            </div>
            <ul className="experience-description">
              {exp.description?.map((desc: string, i: number) => (
                <li key={i}>{desc}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
