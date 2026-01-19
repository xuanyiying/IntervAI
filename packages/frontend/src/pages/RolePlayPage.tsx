import React, { useState, useEffect } from 'react';
import { RolePlayCard } from '../components/RolePlayCard';
import { useResumeStore } from '../stores';
import { Alert, Button, Space } from 'antd';
import { FileTextOutlined, CommentOutlined } from '@ant-design/icons';
import './agents.css';

export const RolePlayPage: React.FC = () => {
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
    if (jobDescription.trim()) {
      setShowForm(false);
    }
  };

  const resumeData = currentResume?.parsedData;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-icon-wrapper">
          <CommentOutlined className="header-icon" />
        </div>
        <h1>模拟面试</h1>
        <p>AI 面试官实时互动，模拟真实面试场景并提供即时反馈</p>
      </div>

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>当前活跃简历 (用于背景分析):</label>
              {currentResume ? (
                <div className="active-resume-card">
                  <Space>
                    <FileTextOutlined className="resume-icon" />
                    <div className="resume-info">
                      <div className="resume-title">
                        {currentResume.title || currentResume.originalFilename}
                      </div>
                      <div className="resume-meta">
                        v{currentResume.version} · 已解析
                      </div>
                    </div>
                  </Space>
                  <Button
                    type="link"
                    className="change-btn"
                    onClick={() => (window.location.href = '/resumes')}
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <Alert
                  message="未选择简历"
                  description="虽然可以不带简历面试，但建议先在'我的简历'模块上传，以便 AI 提供针对性问题。"
                  type="info"
                  showIcon
                  action={
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => (window.location.href = '/resumes')}
                    >
                      去上传
                    </Button>
                  }
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="jd">职位描述:</label>
              <textarea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="粘贴职位描述内容"
                rows={10}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                进入面试间
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="content-container">
          {jobDescription && (
            <RolePlayCard
              resumeData={resumeData as any}
              jobDescription={jobDescription}
              onBack={() => setShowForm(true)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RolePlayPage;
