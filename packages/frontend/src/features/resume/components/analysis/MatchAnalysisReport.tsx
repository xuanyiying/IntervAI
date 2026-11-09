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
  ExclamationCircleOutlined,
  BulbOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  matchAnalysisService,
  type MatchAnalysisResult,
  type MatchGap,
  type RadarEntry,
} from '@/features/resume/api/match-analysis-service';

const { Title, Text, Paragraph } = Typography;

interface MatchAnalysisReportProps {
  resumeId: string;
  jobId: string;
}

/** Hand-drawn hexagon radar chart (no chart library dependency). */
const RadarChart: React.FC<{ entries: RadarEntry[] }> = ({ entries }) => {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = 92;
  const levels = [0.25, 0.5, 0.75, 1];
  const count = Math.max(entries.length, 1);

  const angleFor = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2;

  const pointAt = (i: number, ratio: number): [number, number] => {
    const angle = angleFor(i);
    return [
      cx + radius * ratio * Math.cos(angle),
      cy + radius * ratio * Math.sin(angle),
    ];
  };

  const toPoints = (values: number[]) =>
    values.map((v, i) => pointAt(i, v).join(',')).join(' ');

  const dataPolygon = toPoints(
    entries.map((entry) => Math.min(Math.max(entry.score, 0), 100) / 100)
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{
        width: '100%',
        maxWidth: 340,
        display: 'block',
        margin: '0 auto',
      }}
      role="img"
      aria-label="六维匹配雷达图"
    >
      {/* grid rings */}
      {levels.map((level) => (
        <polygon
          key={level}
          points={toPoints(entries.map(() => level))}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      {/* axes */}
      {entries.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}
      {/* data polygon */}
      <polygon
        points={dataPolygon}
        fill="rgba(22, 119, 255, 0.18)"
        stroke="#1677ff"
        strokeWidth={2}
      />
      {/* data points */}
      {entries.map((entry, i) => {
        const [x, y] = pointAt(
          i,
          Math.min(Math.max(entry.score, 0), 100) / 100
        );
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#1677ff" />;
      })}
      {/* labels */}
      {entries.map((entry, i) => {
        const [x, y] = pointAt(i, 1.24);
        const anchor =
          Math.abs(x - cx) < 12 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <text
            key={i}
            x={x}
            y={y + 4}
            textAnchor={anchor}
            fontSize={12}
            fill="#4b5563"
          >
            {entry.label} {entry.score}
          </text>
        );
      })}
    </svg>
  );
};

const DimensionTagGroup: React.FC<{
  label: string;
  items: string[];
  color: string;
}> = ({ label, items, color }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <Text type="secondary" className="text-xs block mb-1">
        {label}
      </Text>
      <Space wrap size={[4, 4]}>
        {items.map((item, idx) => (
          <Tag key={idx} color={color} style={{ margin: 0 }}>
            {item}
          </Tag>
        ))}
      </Space>
    </div>
  );
};

const SEVERITY_META: Record<
  MatchGap['severity'],
  { color: string; label: string }
> = {
  high: { color: 'red', label: '高' },
  medium: { color: 'orange', label: '中' },
  low: { color: 'green', label: '低' },
};

const DIMENSION_TITLES: Record<string, string> = {
  skills: '技能匹配',
  experience: '经验匹配',
  education: '教育背景',
  softSkills: '软素质',
  hiddenRequirements: '潜在要求',
  development: '发展潜力',
};

export const MatchAnalysisReport: React.FC<MatchAnalysisReportProps> = ({
  resumeId,
  jobId,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();  }, [resumeId, jobId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await matchAnalysisService.getMatchAnalysis(resumeId, jobId);
      setAnalysis(data);
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

  const { breakdown } = analysis;

  return (
    <div className="match-analysis-report space-y-6">
      {/* Overall */}
      <Card>
        <div className="text-center mb-4">
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
          <div className="mt-3">
            <Tag color="geekblue">置信度：{analysis.confidence}</Tag>
          </div>
          {analysis.analysis && (
            <Paragraph className="mt-4 text-gray-600 text-left">
              {analysis.analysis}
            </Paragraph>
          )}
          <Paragraph className="text-gray-600">
            {analysis.overallScore >= 80
              ? t(
                  'match_analysis.excellent_match',
                  '优秀匹配！你有很大机会获得面试机会'
                )
              : analysis.overallScore >= 60
                ? t(
                    'match_analysis.good_match',
                    '良好匹配，建议针对差距进行优化'
                  )
                : t(
                    'match_analysis.needs_improvement',
                    '需要改进，建议加强相关技能'
                  )}
          </Paragraph>
        </div>
      </Card>

      {/* Radar + dimension scores */}
      {analysis.radar && analysis.radar.length > 0 && (
        <Card title={t('match_analysis.radar', '六维匹配雷达')}>
          <RadarChart entries={analysis.radar} />
        </Card>
      )}

      <Card title={t('match_analysis.dimensions', '分维度详情')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            type="inner"
            title={`${DIMENSION_TITLES.skills} · ${breakdown.skills.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.skills.score}
              size="small"
              strokeColor={getScoreColor(breakdown.skills.score)}
            />
            <DimensionTagGroup
              label="已匹配"
              items={breakdown.skills.matched}
              color="success"
            />
            <DimensionTagGroup
              label="部分匹配"
              items={breakdown.skills.partial}
              color="warning"
            />
            <DimensionTagGroup
              label="缺失"
              items={breakdown.skills.missing}
              color="error"
            />
          </Card>

          <Card
            type="inner"
            title={`${DIMENSION_TITLES.experience} · ${breakdown.experience.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.experience.score}
              size="small"
              strokeColor={getScoreColor(breakdown.experience.score)}
            />
            {(breakdown.experience.yearsRequired !== undefined ||
              breakdown.experience.yearsCandidate !== undefined) && (
              <Paragraph className="mb-3">
                <Text type="secondary">经验要求：</Text>
                {breakdown.experience.yearsRequired ?? '-'} 年 ·{' '}
                <Text type="secondary">候选人：</Text>
                {breakdown.experience.yearsCandidate ?? '-'} 年
              </Paragraph>
            )}
            <DimensionTagGroup
              label="相关经验"
              items={breakdown.experience.relevantExperience}
              color="processing"
            />
          </Card>

          <Card
            type="inner"
            title={`${DIMENSION_TITLES.education} · ${breakdown.education.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.education.score}
              size="small"
              strokeColor={getScoreColor(breakdown.education.score)}
            />
            <DimensionTagGroup
              label="岗位要求"
              items={breakdown.education.requirements}
              color="default"
            />
            <DimensionTagGroup
              label="候选人背景"
              items={breakdown.education.candidateEducation}
              color="success"
            />
            <DimensionTagGroup
              label="差距"
              items={breakdown.education.gap}
              color="error"
            />
          </Card>

          <Card
            type="inner"
            title={`${DIMENSION_TITLES.softSkills} · ${breakdown.softSkills.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.softSkills.score}
              size="small"
              strokeColor={getScoreColor(breakdown.softSkills.score)}
            />
            <DimensionTagGroup
              label="要求"
              items={breakdown.softSkills.required}
              color="default"
            />
            <DimensionTagGroup
              label="已有佐证"
              items={breakdown.softSkills.evidenced}
              color="success"
            />
            <DimensionTagGroup
              label="差距"
              items={breakdown.softSkills.gap}
              color="error"
            />
          </Card>

          <Card
            type="inner"
            title={`${DIMENSION_TITLES.hiddenRequirements} · ${breakdown.hiddenRequirements.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.hiddenRequirements.score}
              size="small"
              strokeColor={getScoreColor(breakdown.hiddenRequirements.score)}
            />
            <DimensionTagGroup
              label="识别出的隐性要求"
              items={breakdown.hiddenRequirements.identified}
              color="geekblue"
            />
            <DimensionTagGroup
              label="已对齐"
              items={breakdown.hiddenRequirements.aligned}
              color="success"
            />
            <DimensionTagGroup
              label="风险点"
              items={breakdown.hiddenRequirements.risk}
              color="error"
            />
          </Card>

          <Card
            type="inner"
            title={`${DIMENSION_TITLES.development} · ${breakdown.development.score} 分`}
            size="small"
          >
            <Progress
              percent={breakdown.development.score}
              size="small"
              strokeColor={getScoreColor(breakdown.development.score)}
            />
            <DimensionTagGroup
              label="成长信号"
              items={breakdown.development.signals}
              color="cyan"
            />
            <Paragraph className="mb-1">
              <Text type="secondary">成长轨迹：</Text>
              {breakdown.development.trajectory}
            </Paragraph>
            <Paragraph className="mb-0">
              <Text type="secondary">岗位潜力：</Text>
              {breakdown.development.fitForRole}
            </Paragraph>
          </Card>
        </div>
      </Card>

      {/* Gaps */}
      {analysis.gaps && analysis.gaps.length > 0 && (
        <Card title={t('match_analysis.gap_analysis', '差距分析')}>
          <List
            itemLayout="vertical"
            dataSource={analysis.gaps}
            renderItem={(gap, index) => (
              <List.Item key={index}>
                <Space direction="vertical" className="w-full">
                  <div className="flex items-center gap-2">
                    <Text strong>{gap.area}</Text>
                    <Tag
                      color={SEVERITY_META[gap.severity]?.color ?? 'default'}
                    >
                      {SEVERITY_META[gap.severity]?.label ?? gap.severity}
                    </Tag>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Paragraph className="!mb-0">
                      <Text type="secondary">期望：</Text>
                      {gap.expectation}
                    </Paragraph>
                    <Paragraph className="!mb-0">
                      <Text type="secondary">现状：</Text>
                      {gap.reality}
                    </Paragraph>
                  </div>
                  <Alert
                    type="info"
                    showIcon
                    icon={<BulbOutlined />}
                    message={gap.suggestion}
                  />
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t('match_analysis.strengths', '优势')}>
          <List
            size="small"
            dataSource={analysis.strengths}
            locale={{ emptyText: '暂无' }}
            renderItem={(item) => (
              <List.Item className="!py-2">
                <CheckCircleOutlined className="text-green-500 mr-2" />
                {item}
              </List.Item>
            )}
          />
        </Card>

        <Card title={t('match_analysis.concerns', '顾虑')}>
          <List
            size="small"
            dataSource={analysis.concerns}
            locale={{ emptyText: '暂无' }}
            renderItem={(item) => (
              <List.Item className="!py-2">
                <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                {item}
              </List.Item>
            )}
          />
        </Card>
      </div>

      <Card title={t('match_analysis.recommendations', '优化建议')}>
        <List
          size="small"
          dataSource={analysis.recommendations}
          locale={{ emptyText: '暂无' }}
          renderItem={(item) => (
            <List.Item className="!py-2">
              <BulbOutlined className="text-blue-500 mr-2" />
              {item}
            </List.Item>
          )}
        />
      </Card>

      {analysis.interviewFocus && analysis.interviewFocus.length > 0 && (
        <Card title={t('match_analysis.interview_focus', '面试准备重点')}>
          <List
            size="small"
            dataSource={analysis.interviewFocus}
            renderItem={(item) => (
              <List.Item className="!py-2">
                <AimOutlined className="text-purple-500 mr-2" />
                {item}
              </List.Item>
            )}
          />
        </Card>
      )}

      {analysis.learningPath && analysis.learningPath.length > 0 && (
        <Card title={t('match_analysis.learning_path', '学习路径')}>
          <List
            itemLayout="vertical"
            dataSource={analysis.learningPath}
            renderItem={(item) => (
              <List.Item>
                <Title level={5}>{item.skill}</Title>
                <Text type="secondary" className="block mb-2">
                  {t('match_analysis.estimated_time', '预计时间')}:{' '}
                  {item.estimatedTime}
                </Text>
                <div>
                  <Text strong>
                    {t('match_analysis.resources', '推荐资源')}:
                  </Text>
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
