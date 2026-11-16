import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PitchPerfectCard } from '@/features/pitch-perfect/components/PitchPerfectCard';
import { useResumeStore } from '@/features/resume';
import { useTranslation } from 'react-i18next';
import { ParsedResumeData } from '@/shared/types';
import { Alert, Button, Space, Input } from 'antd';
import { FileTextOutlined, HighlightOutlined } from '@ant-design/icons';
import '@/shared/styles/common.css';
import '@/features/pitch-perfect/styles/agents.css';

const JD_MAX_LENGTH = 30000;

export const PitchPerfectPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    if (currentResume?.parsedData) {
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
        <h1>{t('pitchPerfect.title', '自我介绍')}</h1>
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
                    onClick={() => navigate('/resumes')}
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
                      onClick={() => navigate('/resumes')}
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
              <Input.TextArea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t(
                  'pitchPerfect.job_description_placeholder',
                  '粘贴职位描述内容（可选，留空则生成通用自我介绍）'
                )}
                className="form-textarea"
                rows={10}
                maxLength={JD_MAX_LENGTH}
                showCount={{
                  formatter: ({ count }) =>
                    t('pitchPerfect.jd_count', '{{count}} / 30000', {
                      count,
                    }),
                }}
              />
              <p className="jd-tip">
                {t(
                  'pitchPerfect.jd_tip',
                  '职位描述为可选项：填写后 AI 会针对性匹配岗位亮点；留空则基于简历生成通用自我介绍。'
                )}
              </p>
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
          {resumeData && currentResume && (
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
