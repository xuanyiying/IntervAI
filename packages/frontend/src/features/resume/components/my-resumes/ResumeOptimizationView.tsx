import React, { useEffect, useRef, useState } from 'react';
import {
  Input,
  Button,
  List,
  Typography,
  Space,
  Tag,
  message,
  Divider,
  Tooltip,
  Empty,
  Spin,
  Tabs,
  Alert,
} from 'antd';
import {
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  SaveOutlined,
  BulbOutlined,
  StarOutlined,
  FileSearchOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '@/shared/lib/i18n';
import { optimizationService } from '@/features/resume/api/optimization-service';
import { jobService } from '@/features/resume/api/job-service';
import { interviewService } from '@/features/interview/api/interview-service';
import { Optimization, Suggestion, SuggestionStatus } from '@/shared/types';
import StreamingMarkdownBubble from '@/features/interview/components/StreamingMarkdownBubble';
import InlineDiffViewer from '@/features/resume/components/optimization/InlineDiffViewer';
import '@/features/resume/components/optimization/ResumeOptimizationDialog.css'; // Reuse styles

const { TextArea } = Input;
const { Text, Paragraph, Title } = Typography;

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 60; // ~3 minutes

interface ResumeOptimizationViewProps {
  resumeId: string;
  initialOptimizationId?: string;
  onSuccess?: () => void;
}

export const ResumeOptimizationView: React.FC<ResumeOptimizationViewProps> = ({
  resumeId,
  initialOptimizationId,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('job-match');
  const currentLanguage = normalizeLanguage(
    i18n.resolvedLanguage || i18n.language
  );

  // Job Match State
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<Optimization | null>(null);
  const [step, setStep] = useState<'input' | 'generating' | 'review'>('input');
  const [genError, setGenError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const lastJobIdRef = useRef<string | undefined>(undefined);
  const pollStateRef = useRef<{ cancelled: boolean } | null>(null);

  // STAR Polisher State
  const [starExperienceText, setStarExperienceText] = useState('');
  const [starLoading, setStarLoading] = useState(false);
  const [starResult, setStarResult] = useState<string | null>(null);

  const cancelPolling = () => {
    if (pollStateRef.current) {
      pollStateRef.current.cancelled = true;
      pollStateRef.current = null;
    }
  };

  useEffect(() => {
    return cancelPolling;
  }, []);

  const pollOptimization = async (id: string) => {
    cancelPolling();
    const pollState = { cancelled: false };
    pollStateRef.current = pollState;

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (pollState.cancelled) return;

      let opt: Optimization;
      try {
        opt = await optimizationService.getOptimization(id);
      } catch {
        continue; // transient network error — keep polling
      }

      if (pollState.cancelled) return;

      if (opt.status === 'COMPLETED') {
        setOptimization(opt);
        setStep('review');
        return;
      }
      if (opt.status === 'FAILED') {
        setGenError(opt.errorMessage || t('resume.optimization_failed'));
        setStep('input');
        return;
      }
    }

    if (!pollState.cancelled) {
      setGenError(t('resume.optimization_timeout'));
      setStep('input');
    }
  };

  const fetchOptimization = async (id: string) => {
    try {
      setLoading(true);
      setGenError(null);
      const opt = await optimizationService.getOptimization(id);
      if (opt.status === 'COMPLETED') {
        setOptimization(opt);
        setStep('review');
      } else if (opt.status === 'FAILED') {
        setGenError(opt.errorMessage || t('resume.optimization_failed'));
        setStep('input');
      } else {
        setOptimization(null);
        setStep('generating');
        await pollOptimization(id);
      }
    } catch (error) {
      console.error('Failed to fetch optimization:', error);
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOptimizationId) {
      fetchOptimization(initialOptimizationId);
    } else {
      cancelPolling();
      setStep('input');
      setOptimization(null);
      setJdText('');
      setGenError(null);
    }
  }, [initialOptimizationId]);

  const startOptimization = async (jobId?: string) => {
    try {
      setLoading(true);
      setGenError(null);
      lastJobIdRef.current = jobId;
      const result = await optimizationService.createOptimization(
        resumeId,
        jobId
      );
      setOptimization(null);
      setStep('generating');
      await pollOptimization(result.id);
    } catch (error) {
      console.error('Optimization failed:', error);
      setGenError(t('resume.optimization_failed'));
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOptimization = async () => {
    if (!jdText.trim()) {
      message.warning(t('resume.jd_input_placeholder'));
      return;
    }

    try {
      const job = await jobService.createJob({
        title: t('resume.target_position_default'),
        company: t('resume.target_company_default'),
        jobDescription: jdText,
        requirements: jdText, // Also use as requirements for backend logic
      });
      await startOptimization(job.id);
    } catch (error) {
      console.error('Job creation failed:', error);
      message.error(t('common.error'));
    }
  };

  const handleOptimizeWithoutJd = () => startOptimization(undefined);

  const handleRetry = () => startOptimization(lastJobIdRef.current);

  const handleStarPolish = async () => {
    if (!starExperienceText.trim()) {
      message.warning(t('resume.star.input_required'));
      return;
    }

    try {
      setStarLoading(true);
      const response = await interviewService.getPreparationGuide({
        type: 'star',
        question: starExperienceText,
        language: currentLanguage,
      });
      setStarResult(response.content);
    } catch (error) {
      console.error('STAR polish failed:', error);
      message.error(t('resume.star.polish_failed'));
    } finally {
      setStarLoading(false);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    if (!optimization) return;
    try {
      await optimizationService.acceptSuggestion(optimization.id, suggestionId);
      setOptimization((prev) =>
        prev
          ? {
              ...prev,
              suggestions: (prev.suggestions || []).map((s) =>
                s.id === suggestionId
                  ? { ...s, status: SuggestionStatus.ACCEPTED }
                  : s
              ),
            }
          : prev
      );
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (!optimization) return;
    try {
      await optimizationService.rejectSuggestion(optimization.id, suggestionId);
      setOptimization((prev) =>
        prev
          ? {
              ...prev,
              suggestions: (prev.suggestions || []).map((s) =>
                s.id === suggestionId
                  ? { ...s, status: SuggestionStatus.REJECTED }
                  : s
              ),
            }
          : prev
      );
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleAcceptAll = async () => {
    if (!optimization) return;

    try {
      await optimizationService.acceptAllSuggestions(optimization.id);
      setOptimization((prev) =>
        prev
          ? {
              ...prev,
              suggestions: (prev.suggestions || []).map((s) =>
                s.status === SuggestionStatus.PENDING
                  ? { ...s, status: SuggestionStatus.ACCEPTED }
                  : s
              ),
            }
          : prev
      );
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleApply = async () => {
    if (!optimization) return;

    const acceptedCount = (optimization.suggestions || []).filter(
      (s) => s.status === SuggestionStatus.ACCEPTED
    ).length;

    if (!acceptedCount) {
      message.warning(t('resume.no_accepted_suggestions'));
      return;
    }

    try {
      setApplying(true);
      const result = await optimizationService.applyChanges(optimization.id);
      if (result.failedCount > 0) {
        message.warning(
          t('resume.apply_partial', {
            applied: result.appliedCount,
            failed: result.failedCount,
          })
        );
      } else {
        message.success(
          t('resume.apply_success', { applied: result.appliedCount })
        );
      }
      onSuccess?.();
    } catch (error) {
      console.error('Apply changes failed:', error);
      message.error(t('resume.apply_failed'));
    } finally {
      setApplying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t('resume.copy_content') + ' ' + t('common.success'));
  };

  const renderDiff = (suggestion: Suggestion) => {
    return (
      <div className="diff-container">
        <InlineDiffViewer
          original={suggestion.original}
          optimized={suggestion.optimized}
          splitView
        />
        {suggestion.reason && (
          <div className="suggestion-reason-box">
            <BulbOutlined className="text-amber-500 mt-1" />
            <div className="suggestion-reason-text">{suggestion.reason}</div>
          </div>
        )}
      </div>
    );
  };

  const renderReviewContent = () => {
    const suggestions = optimization?.suggestions || [];
    const acceptedCount = suggestions.filter(
      (s) => s.status === SuggestionStatus.ACCEPTED
    ).length;

    return (
      <div className="optimization-content custom-scrollbar">
        <div className="sticky-header mb-4 flex justify-between items-center">
          <div>
            <Text strong className="text-lg">
              {t('resume.optimization_suggestions')} ({suggestions.length})
            </Text>
            <Text className="ml-3 text-secondary">
              {t('resume.accepted_count', {
                accepted: acceptedCount,
                total: suggestions.length,
              })}
            </Text>
          </div>
          <Space>
            <Button size="small" onClick={handleAcceptAll}>
              {t('resume.accept_all')}
            </Button>
          </Space>
        </div>

        {!suggestions.length ? (
          <Empty description={t('resume.no_suggestions')} />
        ) : (
          <List
            dataSource={suggestions}
            renderItem={(suggestion) => (
              <List.Item className="optimization-list-item block mb-4">
                <div className="flex justify-between items-start mb-3">
                  <Space split={<Divider type="vertical" />}>
                    <Tag className="tag-section">{suggestion.section}</Tag>
                    {suggestion.status === SuggestionStatus.ACCEPTED ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        {t('resume.suggestion_status.accepted')}
                      </Tag>
                    ) : suggestion.status === SuggestionStatus.REJECTED ? (
                      <Tag icon={<CloseCircleOutlined />} color="error">
                        {t('resume.suggestion_status.rejected')}
                      </Tag>
                    ) : (
                      <Tag color="warning">
                        {t('resume.suggestion_status.pending')}
                      </Tag>
                    )}
                  </Space>
                  <Space>
                    {suggestion.status === SuggestionStatus.PENDING && (
                      <>
                        <Tooltip title={t('resume.accept_suggestion')}>
                          <Button
                            type="text"
                            icon={
                              <CheckCircleOutlined className="text-green-500" />
                            }
                            onClick={() =>
                              handleAcceptSuggestion(suggestion.id)
                            }
                          />
                        </Tooltip>
                        <Tooltip title={t('resume.reject_suggestion')}>
                          <Button
                            type="text"
                            icon={
                              <CloseCircleOutlined className="text-red-400" />
                            }
                            onClick={() =>
                              handleRejectSuggestion(suggestion.id)
                            }
                          />
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title={t('resume.copy_content')}>
                      <Button
                        type="text"
                        icon={<CopyOutlined className="text-gray-400" />}
                        onClick={() => handleCopy(suggestion.optimized)}
                      />
                    </Tooltip>
                  </Space>
                </div>
                {renderDiff(suggestion)}
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };

  const renderGenerating = () => (
    <div className="py-20 text-center">
      <Spin tip={t('resume.optimization_generating')} size="large" />
      <Paragraph className="text-secondary mt-6">
        {t('resume.optimization_generating_hint')}
      </Paragraph>
    </div>
  );

  const renderInputWithError = () => (
    <div className="py-4 max-w-4xl mx-auto">
      {genError && (
        <Alert
          type="error"
          showIcon
          message={t('resume.optimization_failed')}
          description={genError}
          action={
            <Button size="small" danger onClick={handleRetry}>
              {t('resume.retry')}
            </Button>
          }
          className="mb-6"
        />
      )}
      <Paragraph className="text-secondary mb-6">
        {t('resume.optimization_desc')}
      </Paragraph>
      <TextArea
        rows={12}
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder={t('resume.jd_input_placeholder')}
        className="jd-textarea mb-6"
      />
      <Space direction="vertical" className="w-full" size="middle">
        <Button
          type="primary"
          icon={<RocketOutlined />}
          loading={loading}
          onClick={handleStartOptimization}
          block
          size="large"
        >
          {t('common.submit')}
        </Button>
        <Button
          icon={<GlobalOutlined />}
          loading={loading}
          onClick={handleOptimizeWithoutJd}
          block
        >
          {t('resume.optimize_without_jd')}
        </Button>
      </Space>
    </div>
  );

  const renderJobMatchContent = () => {
    if (step === 'generating') {
      return renderGenerating();
    }
    return step === 'input' ? renderInputWithError() : renderReviewContent();
  };

  const renderStarPolisherContent = () => {
    return (
      <div className="py-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <Title level={4}>{t('resume.star.title')}</Title>
          <Paragraph className="text-secondary">
            {t('resume.star.description')}
          </Paragraph>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="flex flex-col h-full">
            <div className="mb-2 font-medium">
              {t('resume.star.input_label')}
            </div>
            <TextArea
              rows={15}
              value={starExperienceText}
              onChange={(e) => setStarExperienceText(e.target.value)}
              placeholder={t('resume.star.input_placeholder')}
              className="mb-4 flex-grow"
              style={{ minHeight: '300px' }}
            />
            <Button
              type="primary"
              icon={<StarOutlined />}
              loading={starLoading}
              onClick={handleStarPolish}
              block
              size="large"
            >
              {t('resume.star.submit')}
            </Button>
          </div>

          {/* Output Column */}
          <div className="flex flex-col h-full">
            <div className="mb-2 font-medium flex justify-between items-center">
              <span>{t('resume.star.result')}</span>
              {starResult && (
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(starResult)}
                >
                  {t('common.copy')}
                </Button>
              )}
            </div>
            <div
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex-grow custom-scrollbar overflow-y-auto"
              style={{ minHeight: '300px', maxHeight: '500px' }}
            >
              {starLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spin tip={t('resume.star.loading')} />
                </div>
              ) : starResult ? (
                <div className="markdown-body">
                  <StreamingMarkdownBubble
                    content={starResult}
                    isStreaming={false}
                  />
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-gray-400">
                  <StarOutlined
                    style={{ fontSize: '2rem', marginBottom: '1rem' }}
                  />
                  <div>{t('resume.star.empty')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="resume-optimization-view p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Space>
          <RocketOutlined className="text-primary text-xl" />
          <h2 className="text-xl font-bold m-0">
            {t('resume.optimization_title')}
          </h2>
        </Space>
        {step === 'review' && activeTab === 'job-match' && (
          <Space>
            <Button onClick={() => setStep('input')}>{t('common.back')}</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={applying}
              onClick={handleApply}
            >
              {t('resume.apply_changes')}
            </Button>
          </Space>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'job-match',
            label: (
              <span>
                <FileSearchOutlined />
                {t('resume.tabs.job_match')}
              </span>
            ),
            children: renderJobMatchContent(),
          },
          {
            key: 'star-polish',
            label: (
              <span>
                <StarOutlined />
                {t('resume.tabs.star_polish')}
              </span>
            ),
            children: renderStarPolisherContent(),
          },
        ]}
      />
    </div>
  );
};
