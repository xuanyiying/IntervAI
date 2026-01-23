import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../../i18n';
import { optimizationService } from '../../services/optimization-service';
import { jobService } from '../../services/job-service';
import { interviewService } from '../../services/interview-service';
import { Optimization, Suggestion, SuggestionStatus } from '../../types';
import StreamingMarkdownBubble from '../StreamingMarkdownBubble';
import '../ResumeOptimizationDialog.css'; // Reuse styles

const { TextArea } = Input;
const { Text, Paragraph, Title } = Typography;

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
  const [step, setStep] = useState<'input' | 'review'>('input');

  // STAR Polisher State
  const [starExperienceText, setStarExperienceText] = useState('');
  const [starLoading, setStarLoading] = useState(false);
  const [starResult, setStarResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialOptimizationId) {
      fetchOptimization(initialOptimizationId);
    } else {
      // Reset state if no ID provided (new optimization)
      setStep('input');
      setOptimization(null);
      setJdText('');
    }
  }, [initialOptimizationId]);

  const fetchOptimization = async (id: string) => {
    try {
      setLoading(true);
      const result = await optimizationService.getOptimization(id);
      setOptimization(result);
      setStep('review');
    } catch (error) {
      console.error('Failed to fetch optimization:', error);
      message.error(t('common.error'));
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
      setLoading(true);
      // 1. Create job from JD
      const job = await jobService.createJob({
        title: t('resume.target_position_default'),
        company: t('resume.target_company_default'),
        jobDescription: jdText,
        requirements: jdText, // Also use as requirements for backend logic
      });

      // 2. Start optimization
      const result = await optimizationService.createOptimization(
        resumeId,
        job.id
      );
      setOptimization(result);
      setStep('review');
    } catch (error) {
      console.error('Optimization failed:', error);
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

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
      const updated = await optimizationService.acceptSuggestion(
        optimization.id,
        suggestionId
      );
      setOptimization(updated);
      message.success(t('common.operation_success'));
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (!optimization) return;
    try {
      const updated = await optimizationService.rejectSuggestion(
        optimization.id,
        suggestionId
      );
      setOptimization(updated);
      message.success(t('common.operation_success'));
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleAcceptAll = async () => {
    if (!optimization) return;
    const pendingIds = optimization.suggestions
      .filter((s) => s.status === SuggestionStatus.PENDING)
      .map((s) => s.id);

    if (pendingIds.length === 0) return;

    try {
      const updated = await optimizationService.acceptBatchSuggestions(
        optimization.id,
        pendingIds
      );
      setOptimization(updated);
      message.success(t('common.operation_success'));
    } catch (error) {
      message.error(t('common.error'));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t('resume.copy_content') + ' ' + t('common.success'));
  };

  const handleCopyOptimized = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success(t('common.copy_success'));
  };

  const renderDiff = (suggestion: Suggestion) => {
    return (
      <div className="diff-container">
        <div className="diff-section">
          <span className="diff-label">{t('resume.diff_original')}</span>
          <div className="diff-content diff-original">
            {suggestion.original}
          </div>
        </div>
        <div className="diff-section">
          <span className="diff-label">{t('resume.diff_optimized')}</span>
          <div className="diff-content diff-optimized group/opt">
            {suggestion.optimized}
            <Tooltip title={t('common.copy')}>
              <Button
                size="small"
                icon={<CopyOutlined />}
                className="absolute top-2 right-2 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                onClick={() => handleCopyOptimized(suggestion.optimized)}
              />
            </Tooltip>
          </div>
        </div>
        {suggestion.reason && (
          <div className="suggestion-reason-box">
            <BulbOutlined className="text-amber-500 mt-1" />
            <div className="suggestion-reason-text">{suggestion.reason}</div>
          </div>
        )}
      </div>
    );
  };

  const renderJobMatchContent = () => {
    return step === 'input' ? (
      <div className="py-4 max-w-4xl mx-auto">
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
      </div>
    ) : (
      <div className="optimization-content custom-scrollbar">
        <div className="sticky-header mb-4 flex justify-between items-center">
          <div>
            <Text strong className="text-lg">
              {t('resume.optimization_suggestions')} (
              {optimization?.suggestions.length || 0})
            </Text>
          </div>
          <Space>
            <Button size="small" onClick={handleAcceptAll}>
              {t('resume.accept_all')}
            </Button>
          </Space>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Spin tip={t('resume.optimizing')} />
          </div>
        ) : !optimization?.suggestions.length ? (
          <Empty description={t('resume.no_suggestions')} />
        ) : (
          <List
            dataSource={optimization.suggestions}
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
            <Button type="primary" icon={<SaveOutlined />} onClick={onSuccess}>
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
