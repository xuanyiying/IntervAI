import React from 'react';
import { Avatar } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeSkillsProps {
  skills?: ParsedResumeData['skills'];
}

export const ResumeSkills: React.FC<ResumeSkillsProps> = ({ skills }) => {
  const { t } = useTranslation();

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<CheckCircleOutlined />}
          className="section-avatar bg-emerald-500"
        />
        {t('resume.skills', '技能清单')}
      </div>
      <div className="skills-container">
        {skills?.map((skill, idx: number) => {
          if (typeof skill === 'string') {
            return (
              <div key={idx} className="skill-tag">
                {skill}
              </div>
            );
          }
          return (
            <div key={idx} className="skill-category-group">
              {skill.category && (
                <div className="skill-category-name">{skill.category}</div>
              )}
              <div className="skill-category-items">
                {skill.items.map((item: string, i: number) => (
                  <div key={i} className="skill-tag">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
