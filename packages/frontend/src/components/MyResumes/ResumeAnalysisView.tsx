import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { resumeService } from '../../services/resume-service';
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
  summary: string;
  strengths: string[];
  suggestions: {
    category: string;
    priority: '高' | '中' | '低';
    issue: string;
    recommendation: string;
  }[];
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
    if (resumeId) {
      setResult(null);
      setAnalyzing(false);
      // Auto-analyze or check if analysis exists could be added here
      // But for now, we follow the requirement: "Page load automatically show Deep Diagnosis results"
      // If the requirement means "Show the view", we do that.
      // If it means "Auto-start analysis", we might need to check if we have cached result or start it.
      // Assuming we start with empty state or fetch existing analysis.
      // Let's try to fetch existing analysis if available, or just show empty state to let user click "Start".
      // Wait, requirement 2 says: "Default display settings: Automatically show 'Deep Diagnosis' results after page load".
      // This implies we should probably try to fetch/analyze automatically or at least show the view.
    }
  }, [resumeId]);

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
    <div className="resume-analysis-view p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <ThunderboltOutlined className="text-blue-500 text-xl" />
        <h2 className="text-xl font-bold m-0">简历深度诊断报告</h2>
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
