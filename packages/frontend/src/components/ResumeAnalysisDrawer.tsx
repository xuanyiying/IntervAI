import React, { useState, useEffect } from 'react';
import { Drawer, Button, message } from 'antd';
import { ThunderboltOutlined, CloseOutlined } from '@ant-design/icons';
import { resumeService } from '../services/resume-service';
import { ResumeAnalysisEmptyState } from './MyResumes/ResumeAnalysisEmptyState';
import { ResumeAnalysisLoading } from './MyResumes/ResumeAnalysisLoading';
import { ResumeAnalysisResult } from './MyResumes/ResumeAnalysisResult';

interface AnalysisResult {
  overallScore: number;
  scoreDetail: {
    projectScore: number;
    skillMatchScore: number;
    contentScore: number;
    structureScore: number;
    expressionScore: number;
  };
  summary: string;
  strengths: string[];
  suggestions: {
    category: string;
    priority: '高' | '中' | '低';
    issue: string;
    recommendation: string;
  }[];
}

interface ResumeAnalysisDrawerProps {
  visible: boolean;
  resumeId: string | null;
  onClose: () => void;
}

export const ResumeAnalysisDrawer: React.FC<ResumeAnalysisDrawerProps> = ({
  visible,
  resumeId,
  onClose,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (visible && resumeId) {
      setResult(null);
      setAnalyzing(false);
    }
  }, [visible, resumeId]);

  const handleAnalyze = async () => {
    if (!resumeId) return;
    try {
      setAnalyzing(true);
      const data = await resumeService.analyzeResume(resumeId);
      if (data.error) {
        message.error('Analysis failed: ' + data.error);
      } else {
        setResult(data);
        message.success('Analysis completed');
      }
    } catch (error) {
      message.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <span>简历深度诊断报告</span>
        </div>
      }
      placement="right"
      width="85%"
      onClose={onClose}
      open={visible}
      extra={
        <Button onClick={onClose} icon={<CloseOutlined />}>
          关闭
        </Button>
      }
    >
      <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
        {!result && !analyzing && (
          <ResumeAnalysisEmptyState onAnalyze={handleAnalyze} />
        )}

        {analyzing && !result && <ResumeAnalysisLoading />}

        {result && <ResumeAnalysisResult result={result} />}
      </div>
    </Drawer>
  );
};
