import React from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Resume, ParseStatus } from '../../types';
import { ResumeDetailHeader } from './ResumeDetailHeader';
import { ResumePersonalInfo } from './ResumePersonalInfo';
import { ResumeSummary } from './ResumeSummary';
import { ResumeEducation } from './ResumeEducation';
import { ResumeExperience } from './ResumeExperience';
import { ResumeProjects } from './ResumeProjects';
import { ResumeSkills } from './ResumeSkills';
import { ResumeLanguages } from './ResumeLanguages';
import { ResumeCertifications } from './ResumeCertifications';

const { Paragraph } = Typography;

interface ResumeDetailProps {
  resume: Resume;
  onPreview: () => void;
  onHistory: () => void;
  onAnalyze: () => void;
  onOptimize: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}

export const ResumeDetail: React.FC<ResumeDetailProps> = ({
  resume,
  onPreview,
  onHistory,
  onAnalyze,
  onOptimize,
  onSetPrimary,
  onDelete,
}) => {
  const { t } = useTranslation();

  const renderContent = () => {
    if (resume.parseStatus === ParseStatus.COMPLETED && resume.parsedData) {
      return (
        <div className="animate-fade-in">
          <ResumePersonalInfo data={resume.parsedData.personalInfo} />
          <ResumeSummary summary={resume.parsedData.summary} />
          <ResumeEducation education={resume.parsedData.education} />
          <ResumeExperience experience={resume.parsedData.experience} />
          <ResumeProjects projects={resume.parsedData.projects} />
          <ResumeSkills skills={resume.parsedData.skills} />
          
          <div className="info-grid mt-8">
            <ResumeLanguages languages={resume.parsedData.languages} />
            <ResumeCertifications certifications={resume.parsedData.certifications} />
          </div>
        </div>
      );
    }

    return (
      <div className="empty-state">
        <div className="empty-icon-wrapper">
          {resume.parseStatus === ParseStatus.PROCESSING ? (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          ) : (
            <InfoCircleOutlined />
          )}
        </div>
        <div className="text-2xl font-bold mb-3">
          {resume.parseStatus === ParseStatus.PROCESSING
            ? t('resume.parsing_in_progress', '简历正在解析中...')
            : t('resume.no_parsed_data', '暂无结构化数据')}
        </div>
        <Paragraph className="text-secondary max-w-md">
          {resume.parseStatus === ParseStatus.PROCESSING
            ? '我们正在使用 AI 深度分析您的简历内容，提取关键信息并生成结构化视图。这通常需要几秒钟时间，请稍候。'
            : '未能成功提取结构化信息。请尝试重新上传清晰的 PDF 或 Word 文档。'}
        </Paragraph>
      </div>
    );
  };

  return (
    <div className="resume-content">
      <ResumeDetailHeader
        resume={resume}
        onPreview={onPreview}
        onHistory={onHistory}
        onAnalyze={onAnalyze}
        onOptimize={onOptimize}
        onSetPrimary={onSetPrimary}
        onDelete={onDelete}
      />
      <div className="resume-detail-body">{renderContent()}</div>
    </div>
  );
};
