import React, { useState } from 'react';
import {
  Card,
  Tag,
  Space,
  Collapse,
  Button,
  Empty,
  Divider,
  message as antMessage,
  Spin,
} from 'antd';
import { DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import { type InterviewQuestion, QuestionType, Difficulty } from '../types';
import { interviewService } from '../services/interview-service';
import { useTranslation } from 'react-i18next';

interface InterviewQuestionsCardProps {
  questions: InterviewQuestion[];
  optimizationId: string;
  onExportSuccess?: () => void;
}

const InterviewQuestionsCard: React.FC<InterviewQuestionsCardProps> = ({
  questions,
  optimizationId,
  onExportSuccess,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const getQuestionTypeLabel = (type: QuestionType) => {
    const typeMap: Record<QuestionType, string> = {
      [QuestionType.BEHAVIORAL]: t('interviewQuestions.type_behavioral'),
      [QuestionType.TECHNICAL]: t('interviewQuestions.type_technical'),
      [QuestionType.SITUATIONAL]: t('interviewQuestions.type_situational'),
      [QuestionType.RESUME_BASED]: t('interviewQuestions.type_resume_based'),
    };
    return typeMap[type] || type;
  };

  const getQuestionTypeColor = (type: QuestionType): string => {
    const colorMap: Record<QuestionType, string> = {
      [QuestionType.BEHAVIORAL]: 'blue',
      [QuestionType.TECHNICAL]: 'purple',
      [QuestionType.SITUATIONAL]: 'orange',
      [QuestionType.RESUME_BASED]: 'green',
    };
    return colorMap[type] || 'default';
  };

  const getDifficultyInfo = (difficulty: Difficulty) => {
    const difficultyMap: Record<Difficulty, { label: string; color: string }> =
      {
        [Difficulty.EASY]: { label: t('interviewQuestions.diff_easy'), color: 'green' },
        [Difficulty.MEDIUM]: { label: t('interviewQuestions.diff_medium'), color: 'orange' },
        [Difficulty.HARD]: { label: t('interviewQuestions.diff_hard'), color: 'red' },
      };
    return difficultyMap[difficulty] || { label: difficulty, color: 'default' };
  };

  const countByType = (type: QuestionType) => {
    return questions.filter((q) => q.questionType === type).length;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await interviewService.exportInterviewPrep(optimizationId);
      antMessage.success(t('interviewQuestions.export_success'));
      onExportSuccess?.();
    } catch (error) {
      console.error('Failed to export interview prep:', error);
      antMessage.error(t('interviewQuestions.export_failed'));
    } finally {
      setExporting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Card
        style={{
          marginTop: '16px',
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorder}`,
        }}
        title={`🎤 ${t('interviewQuestions.title')}`}
      >
        <Empty description={t('interviewQuestions.empty')} />
      </Card>
    );
  }

  const groupedQuestions = {
    behavioral: questions.filter(
      (q) => q.questionType === QuestionType.BEHAVIORAL
    ),
    technical: questions.filter(
      (q) => q.questionType === QuestionType.TECHNICAL
    ),
    situational: questions.filter(
      (q) => q.questionType === QuestionType.SITUATIONAL
    ),
    resume_based: questions.filter(
      (q) => q.questionType === QuestionType.RESUME_BASED
    ),
  };

  const collapseItems = Object.entries(groupedQuestions)
    .filter(([, items]) => items.length > 0)
    .map(([type, items]) => {
      const typeKey = type as keyof typeof groupedQuestions;
      return {
        key: type,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{getQuestionTypeLabel(typeKey as any)}</span>
            <Tag color={getQuestionTypeColor(typeKey as any)}>
              {items.length} 题
            </Tag>
          </div>
        ),
        children: (
          <Space direction="vertical" style={{ width: '100%' }}>
            {items.map((question, index) => {
              const difficulty = getDifficultyInfo(question.difficulty);
              return (
                <div
                  key={question.id}
                  style={{
                    padding: '12px',
                    background: token.colorBgElevated,
                    border: `1px solid ${token.colorBorder}`,
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          marginBottom: '8px',
                        }}
                      >
                        {index + 1}. {question.question}
                      </div>
                    </div>
                    <Tag color={difficulty.color} style={{ marginLeft: '8px' }}>
                      {difficulty.label}
                    </Tag>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: token.colorTextSecondary,
                        marginBottom: '8px',
                      }}
                    >
                      📝 参考答案框架
                    </div>
                    <div
                      style={{
                        padding: '8px 12px',
                        background: token.colorBgContainer,
                        borderLeft: `3px solid ${token.colorPrimary}`,
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: token.colorText,
                      }}
                    >
                      {question.suggestedAnswer}
                    </div>
                  </div>

                  {question.tips && question.tips.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: token.colorTextSecondary,
                          marginBottom: '8px',
                        }}
                      >
                        💡 回答要点
                      </div>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {question.tips.map((tip, tipIndex) => (
                          <div
                            key={tipIndex}
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'flex-start',
                              fontSize: '13px',
                            }}
                          >
                            <CheckCircleOutlined
                              style={{
                                color: token.colorSuccess,
                                marginTop: '2px',
                                flexShrink: 0,
                              }}
                            />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              );
            })}
          </Space>
        ),
      };
    });

  return (
    <Card
      style={{
        marginTop: '16px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🎤 {t('interviewQuestions.title')}</span>
          <Tag>{questions.length} 题</Tag>
        </div>
      }
      extra={
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          导出 PDF
        </Button>
      }
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {countByType(QuestionType.BEHAVIORAL) > 0 && (
          <Tag color={getQuestionTypeColor(QuestionType.BEHAVIORAL)}>
            {getQuestionTypeLabel(QuestionType.BEHAVIORAL)}:{' '}
            {countByType(QuestionType.BEHAVIORAL)} 题
          </Tag>
        )}
        {countByType(QuestionType.TECHNICAL) > 0 && (
          <Tag color={getQuestionTypeColor(QuestionType.TECHNICAL)}>
            {getQuestionTypeLabel(QuestionType.TECHNICAL)}:{' '}
            {countByType(QuestionType.TECHNICAL)} 题
          </Tag>
        )}
        {countByType(QuestionType.SITUATIONAL) > 0 && (
          <Tag color={getQuestionTypeColor(QuestionType.SITUATIONAL)}>
            {getQuestionTypeLabel(QuestionType.SITUATIONAL)}:{' '}
            {countByType(QuestionType.SITUATIONAL)} 题
          </Tag>
        )}
        {countByType(QuestionType.RESUME_BASED) > 0 && (
          <Tag color={getQuestionTypeColor(QuestionType.RESUME_BASED)}>
            {getQuestionTypeLabel(QuestionType.RESUME_BASED)}:{' '}
            {countByType(QuestionType.RESUME_BASED)} 题
          </Tag>
        )}
      </div>

      <Divider />

      <Spin spinning={exporting}>
        <Collapse
          items={collapseItems}
          defaultActiveKey={Object.keys(groupedQuestions).filter(
            (key) =>
              groupedQuestions[key as keyof typeof groupedQuestions].length > 0
          )}
        />
      </Spin>

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fffbe6',
          border: `1px solid #ffe58f`,
          borderRadius: '4px',
          fontSize: '12px',
          color: token.colorTextSecondary,
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <strong>💡 面试准备建议：</strong>
        </div>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          <li>使用 STAR 法则（情境、任务、行动、结果）组织答案</li>
          <li>准备具体的例子和数据来支持你的答案</li>
          <li>练习清晰、简洁地表达你的想法</li>
          <li>提前准备可能的追问和深入问题</li>
        </ul>
      </div>
    </Card>
  );
};

export default InterviewQuestionsCard;
