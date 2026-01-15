import React from 'react';
import { Avatar, Tag } from 'antd';
import { ProjectOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';

interface ResumeProjectsProps {
  projects?: ParsedResumeData['projects'];
}

export const ResumeProjects: React.FC<ResumeProjectsProps> = ({ projects }) => {
  const { t } = useTranslation();

  if (!projects || projects.length === 0) return null;

  return (
    <section className="data-section">
      <div className="section-title">
        <Avatar
          icon={<ProjectOutlined />}
          className="section-avatar bg-indigo-500"
        />
        {t('resume.projects', '项目经验')}
      </div>
      <div className="project-list">
        {projects.map((project, idx) => (
          <div key={idx} className="project-item mb-8 last:mb-0">
            <div className="flex justify-between items-start mb-2">
              <div className="text-lg font-bold text-primary">
                {project.name}
              </div>
              <div className="text-tertiary text-sm">
                {project.startDate} -{' '}
                {project.endDate || t('common.present', '至今')}
              </div>
            </div>
            <div className="text-secondary mb-3 leading-relaxed">
              {project.description}
            </div>
            {project.highlights && project.highlights.length > 0 && (
              <ul className="experience-description">
                {project.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            )}
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.technologies.map((tech, i) => (
                  <Tag
                    key={i}
                    className="m-0 border-none bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs"
                  >
                    {tech}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
