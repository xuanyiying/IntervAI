import React, { useEffect, useState } from 'react';
import {
  Card,
  Progress,
  Tag,
  Typography,
  Space,
  List,
  Alert,
  Spin,
  Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from '../config/axios';

const { Title, Text, Paragraph } = Typography;

interface MatchAnalysisResult {
  overallScore: number;
  skillMatch: {
    matched: Array<{ skill: string; relevance: number }>;
    missing: Array<{ skill: string; importance: number }>;
    additional: Array<{ skill: string; value: number }>;
  };
  experienceMatch: {
    score: number;
    gaps: string[];
    highlights: string[];
  };
  educationMatch: {
    score: number;
    meets: boolean;
    notes: string;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    impact: string;
  }>;
  learningPath?: Array<{
    skill: string;
    resources: string[];
    estimatedTime: string;
  }>;
}

interface MatchAnalysisReportProps {
  resumeId: string;
  jobId: string;
}

export const MatchAnalysisReport: React.FC<MatchAnalysisReportProps> = ({
  resumeId,
  jobId,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [resumeId, jobId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<MatchAnalysisResult>(
        `/match-analysis/${resumeId}/${jobId}`
      );
      setAnalysis(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('match_analysis.error', '分析失败')}
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!analysis) {
    return <Empty description={t('match_analysis.no_data', '暂无分析数据')} />;
  }

  return (
    <div className="match-analysis-report space-y-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={3}>
            {t('match_analysis.overall_match', '整体匹配度')}
          </Title>
          <Progress
            type="circle"
            percent={analysis.overallScore}
            strokeColor={getScoreColor(analysis.overallScore)}
            format={(percent) => (
              <span className="text-3xl font-bold">{percent}%</span>
            )}
            size={180}
          />
          <Paragraph className="mt-4 text-gray-600">
            {analysis.overallScore >= 80
              ? t('match_analysis.excellent_match', '优秀匹配！你有很大机会获得面试机会')
              : analysis.overallScore >= 60
                ? t('match_analysis.good_match', '良好匹配，建议针对差距进行优化')
                : t('match_analysis.needs_improvement', '需要改进，建议加强相关技能')}
          </Paragraph>
        </div>
      </Card>

      <Card title={t('match_analysis.skill_match', '技能匹配分析')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Title level={5} className="mb-3">
              <CheckCircleOutlined className="text-green-500 mr-2" />
              {t('match_analysis.matched_skills', '已匹配技能')} ({analysis.skillMatch.matched.length})
            </Title>
            <Space wrap>
              {analysis.skillMatch.matched.map((item, index) => (
                <Tag key={index} color="success">
                  {item.skill}
                </Tag>
              ))}
            </Space>
          </div>

          <div>
            <Title level={5} className="mb-3">
              <CloseCircleOutlined className="text-red-500 mr-2" />
              {t('match_analysis.missing_skills', '缺失技能')} ({analysis.skillMatch.missing.length})
            </Title>
            <Space wrap>
              {analysis.skillMatch.missing.map((item, index) => (
                <Tag key={index} color="error">
                  {item.skill}
                </Tag>
              ))}
            </Space>
          </div>

          <div>
            <Title level={5} className="mb-3">
              <ExclamationCircleOutlined className="text-blue-500 mr-2" />
              {t('match_analysis.additional_skills', '额外技能')} ({analysis.skillMatch.additional.length})
            </Title>
            <Space wrap>
              {analysis.skillMatch.additional.map((item, index) => (
                <Tag key={index} color="processing">
                  {item.skill}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('match_analysis.experience_match', '经验匹配')}>
          <div className="text-center mb-4">
            <Progress
              percent={analysis.experienceMatch.score}
              strokeColor={getScoreColor(analysis.experienceMatch.score)}
            />
          </div>
          {analysis.experienceMatch.highlights.length > 0 && (
            <div className="mb-3">
              <Text strong className="text-green-600">
                {t('match_analysis.highlights', '亮点')}
              </Text>
              <ul className="mt-2">
                {analysis.experienceMatch.highlights.map((item, index) => (
                  <li key={index}>
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.experienceMatch.gaps.length > 0 && (
            <div>
              <Text strong className="text-red-600">
                {t('match_analysis.gaps', '差距')}
              </Text>
              <ul className="mt-2">
                {analysis.experienceMatch.gaps.map((item, index) => (
                  <li key={index}>
                    <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title={t('match_analysis.education_match', '教育匹配')}>
          <div className="text-center mb-4">
            <Progress
              percent={analysis.educationMatch.score}
              strokeColor={getScoreColor(analysis.educationMatch.score)}
            />
          </div>
          <Alert
            message={
              analysis.educationMatch.meets
                ? t('match_analysis.requirement_met', '符合要求')
                : t('match_analysis.requirement_not_met', '未完全符合要求')
            }
            description={analysis.educationMatch.notes}
            type={analysis.educationMatch.meets ? 'success' : 'warning'}
            showIcon
          />
        </Card>
      </div>

      <Card title={t('match_analysis.recommendations', '优化建议')}>
        <List
          itemLayout="vertical"
          dataSource={analysis.recommendations}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" className="w-full">
                <div className="flex items-center justify-between">
                  <Text strong>{item.category}</Text>
                  <Tag color={getPriorityColor(item.priority)}>
                    {item.priority === 'high'
                      ? t('match_analysis.high_priority', '高优先级')
                      : item.priority === 'medium'
                        ? t('match_analysis.medium_priority', '中优先级')
                        : t('match_analysis.low_priority', '低优先级')}
                  </Tag>
                </div>
                <Paragraph className="mb-2">{item.suggestion}</Paragraph>
                <Text type="secondary" className="text-sm">
                  <BulbOutlined className="mr-1" />
                  {item.impact}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      {analysis.learningPath && analysis.learningPath.length > 0 && (
        <Card title={t('match_analysis.learning_path', '学习路径')}>
          <List
            itemLayout="vertical"
            dataSource={analysis.learningPath}
            renderItem={(item) => (
              <List.Item>
                <Title level={5}>{item.skill}</Title>
                <Text type="secondary" className="block mb-2">
                  {t('match_analysis.estimated_time', '预计时间')}: {item.estimatedTime}
                </Text>
                <div>
                  <Text strong>{t('match_analysis.resources', '推荐资源')}:</Text>
                  <ul className="mt-2">
                    {item.resources.map((resource, idx) => (
                      <li key={idx}>{resource}</li>
                    ))}
                  </ul>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};
