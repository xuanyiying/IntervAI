import React, { useState, useEffect } from 'react';
import { PitchPerfectCard } from '../../components/PitchPerfectCard';
import { useResumeStore } from '@/stores';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '../../types';
import { Alert, Button, Space } from 'antd';
import { FileTextOutlined, HighlightOutlined } from '@ant-design/icons';
import '@/styles/common.css';
import '@/styles/agents.css';

export const PitchPerfectPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentResume, fetchResumes } = useResumeStore();
  const [jobDescription, setJobDescription] = useState('');
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!currentResume) {
      fetchResumes();
    }
  }, [currentResume, fetchResumes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentResume?.parsedData && jobDescription.trim()) {
      setShowForm(false);
    }
  };

  const resumeData = currentResume?.parsedData;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-icon-wrapper">
          <HighlightOutlined className="header-icon" />
        </div>
        <h1>{t('pitchPerfect.title', '履历点睛')}</h1>
        <p>
          {t(
            'pitchPerfect.description',
            '生成一段黄金自我介绍，让您在众多候选人中脱颖而出。'
          )}
        </p>
      </div>

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('pitchPerfect.current_resume', '当前活跃简历')}:</label>
              {currentResume ? (
                <div className="active-resume-card">
                  <Space>
                    <FileTextOutlined className="resume-icon" />
                    <div className="resume-info">
                      <div className="resume-title">
                        {currentResume.title || currentResume.originalFilename}
                      </div>
                      <div className="resume-meta">
                        v{currentResume.version} ·{' '}
                        {t('resume.parsed', '已解析')}
                      </div>
                    </div>
                  </Space>
                  <Button
                    type="link"
                    className="change-btn"
                    onClick={() => (window.location.href = '/resumes')}
                  >
                    {t('pitchPerfect.change', '更换')}
                  </Button>
                </div>
              ) : (
                <Alert
                  message={t('pitchPerfect.no_resume_title', '未找到活跃简历')}
                  description={t(
                    'pitchPerfect.no_resume_desc',
                    "请先前往'我的简历'模块上传并解析简历。"
                  )}
                  type="warning"
                  showIcon
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => (window.location.href = '/resumes')}
                    >
                      {t('pitchPerfect.go_upload', '去上传')}
                    </Button>
                  }
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="jd">
                {t('pitchPerfect.job_description', '职位描述')}:
              </label>
              <textarea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t(
                  'pitchPerfect.job_description_placeholder',
                  '粘贴职位描述内容'
                )}
                className="form-textarea"
                rows={10}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !currentResume || currentResume.parseStatus !== 'COMPLETED'
                }
              >
                {t('pitchPerfect.start_optimize', '开始优化')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="content-container">
          {resumeData && jobDescription && currentResume && (
            <PitchPerfectCard
              resumeId={currentResume.id}
              resumeData={resumeData as any as ParsedResumeData}
              jobDescription={jobDescription}
              onBack={() => setShowForm(true)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PitchPerfectPage;
