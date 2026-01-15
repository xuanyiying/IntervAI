import React, { useState, useEffect } from 'react';
import { StrategistCard } from '../components/StrategistCard';
import { useResumeStore } from '../stores';
import { Space, Input, Button, Alert, Tooltip } from 'antd';
import {
  RocketOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import './agents.css';

const { TextArea } = Input;

export const StrategistPage: React.FC = () => {
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
          <RocketOutlined className="header-icon" />
        </div>
        <h1>面试预测</h1>
        <p>基于您的背景和目标职位，智能预测面试问题并提供对策</p>
      </div>

      {showForm ? (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>当前活跃简历:</label>
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
                  message="未找到活跃简历"
                  description="请先前往'我的简历'模块上传并解析简历。"
                  type="warning"
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
              <label htmlFor="jd">职位描述 (JD):</label>
              <TextArea
                id="jd"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="请粘贴您要申请的职位描述..."
                autoSize={{ minRows: 10, maxRows: 15 }}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={
                  !currentResume ||
                  currentResume.parseStatus !== 'COMPLETED' ||
                  !jobDescription.trim()
                }
                className="btn-primary"
              >
                生成面试策略方案
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="content-container">
          {resumeData && (
            <StrategistCard
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

export default StrategistPage;
