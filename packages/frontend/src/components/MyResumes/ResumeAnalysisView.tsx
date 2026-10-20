import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { resumeService } from '../../services/resume-service';
import { formatDateTime } from '../../i18n';
import { ResumeAnalysisEmptyState } from './ResumeAnalysisEmptyState';
import { ResumeAnalysisLoading } from './ResumeAnalysisLoading';
import { ResumeAnalysisResult } from './ResumeAnalysisResult';

interface AnalysisResult {
  overallScore: number;
  scoreDetail: {
    projectScore: number;
    skillMatchScore: number;
    contentScore: number;
    structureScore: number;
    expressionScore: number;
  };
  language?: 'zh' | 'en';
  summary: string;
  strengths: string[];
  suggestions: {
    category: string;
    priority: string;
    issue: string;
    recommendation: string;
  }[];
  analyzedAt?: string;
}

interface ResumeAnalysisViewProps {
  resumeId: string | null;
}

export const ResumeAnalysisView: React.FC<ResumeAnalysisViewProps> = ({
  resumeId,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    setResult(null);
    setAnalyzing(false);
    if (resumeId) {
      // Auto-load the persisted diagnosis (if any) on mount
      fetchAnalysis(resumeId, false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const fetchAnalysis = async (
    id: string,
    force: boolean,
    silent: boolean = false
  ) => {
    try {
      setAnalyzing(true);
      const data = await resumeService.analyzeResume(id, 12, 5000, force);
      if (data.error) {
        if (!silent) {
          message.error('诊断失败: ' + data.error);
        }
      } else {
        setResult(data);
        if (!silent) {
          message.success(force ? '重新诊断完成' : '诊断完成');
        }
      }
    } catch (error) {
      if (!silent) {
        message.error('诊断失败，请稍后重试');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (resumeId) {
      fetchAnalysis(resumeId, false);
    }
  };

  const handleRediagnose = () => {
    if (resumeId) {
      fetchAnalysis(resumeId, true);
    }
  };

  return (
    <div className="resume-analysis-view p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ThunderboltOutlined className="text-blue-500 text-xl" />
          <h2 className="text-xl font-bold m-0">简历深度诊断报告</h2>
          {result?.analyzedAt && (
            <span className="text-secondary text-sm">
              （诊断于 {formatDateTime(result.analyzedAt)}）
            </span>
          )}
        </div>
        {result && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRediagnose}
            loading={analyzing}
          >
            重新诊断
          </Button>
        )}
      </div>

      <div className="">
        {!result && !analyzing && (
          <ResumeAnalysisEmptyState onAnalyze={handleAnalyze} />
        )}

        {analyzing && !result && <ResumeAnalysisLoading />}

        {result && <ResumeAnalysisResult result={result} />}
      </div>
    </div>
  );
};
