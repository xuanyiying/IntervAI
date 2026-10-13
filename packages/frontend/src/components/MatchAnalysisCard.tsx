import React from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Divider,
  Space,
  Empty,
  theme,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { MatchScore } from '../types';
import { useTranslation } from 'react-i18next';

interface MatchAnalysisCardProps {
  matchScore: MatchScore | null;
  loading?: boolean;
  onClose?: () => void;
}

const MatchAnalysisCard: React.FC<MatchAnalysisCardProps> = ({
  matchScore,
  loading,
  onClose,
}) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a'; // green
    if (score >= 60) return '#faad14'; // orange
    return '#f5222d'; // red
  };

  // Determine status text
  const getScoreStatus = (score: number) => {
    if (score >= 80) return t('match_analysis.excellent', '优秀');
    if (score >= 60) return t('match_analysis.good', '良好');
    return t('match_analysis.needs_improvement_short', '需要改进');
  };

  const overallColor = getScoreColor(matchScore?.overall || 0);

  return (
    <Card
      loading={loading}
      style={{
        marginTop: '16px',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📊 匹配度分析</span>
          <Tag color={overallColor}>
            {getScoreStatus(matchScore?.overall || 0)}
          </Tag>
        </div>
      }
      extra={
        onClose && (
          <a onClick={onClose} style={{ color: token.colorTextSecondary }}>
            关闭
          </a>
        )
      }
    >
      {/* Overall Score */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: overallColor,
            marginBottom: '8px',
          }}
        >
          {matchScore?.overall || 0}%
        </div>
        <div style={{ color: token.colorTextSecondary, fontSize: '14px' }}>
          整体匹配度评分
        </div>
      </div>

      <Divider />

      {/* Detailed Scores */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px', fontWeight: 500 }}>详细评分</div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                <span>技能匹配度</span>
                <span style={{ fontWeight: 500 }}>
                  {matchScore?.skillMatch || 0}%
                </span>
              </div>
              <Progress
                percent={matchScore?.skillMatch || 0}
                strokeColor={getScoreColor(matchScore?.skillMatch || 0)}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                <span>经验匹配度</span>
                <span style={{ fontWeight: 500 }}>
                  {matchScore?.experienceMatch || 0}%
                </span>
              </div>
              <Progress
                percent={matchScore?.experienceMatch || 0}
                strokeColor={getScoreColor(matchScore?.experienceMatch || 0)}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                <span>教育背景匹配度</span>
                <span style={{ fontWeight: 500 }}>
                  {matchScore?.educationMatch || 0}%
                </span>
              </div>
              <Progress
                percent={matchScore?.educationMatch || 0}
                strokeColor={getScoreColor(matchScore?.educationMatch || 0)}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                <span>关键词覆盖率</span>
                <span style={{ fontWeight: 500 }}>
                  {matchScore?.keywordCoverage || 0}%
                </span>
              </div>
              <Progress
                percent={matchScore?.keywordCoverage || 0}
                strokeColor={getScoreColor(matchScore?.keywordCoverage || 0)}
                size="small"
              />
            </div>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Strengths */}
      {matchScore?.strengths && matchScore.strengths.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px', fontWeight: 500 }}>✅ 优势</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            {matchScore.strengths.map((strength: string, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  padding: '8px 12px',
                  background: '#f6ffed',
                  border: `1px solid #b7eb8f`,
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <CheckCircleOutlined
                  style={{ color: '#52c41a', marginTop: '2px', flexShrink: 0 }}
                />
                <span>{strength}</span>
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* Weaknesses */}
      {matchScore?.weaknesses && matchScore.weaknesses.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px', fontWeight: 500 }}>
            ⚠️ 需要改进
          </div>
          <Space direction="vertical" style={{ width: '100%' }}>
            {matchScore.weaknesses.map((weakness: string, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  padding: '8px 12px',
                  background: '#fff7e6',
                  border: `1px solid #ffd591`,
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <CloseCircleOutlined
                  style={{ color: '#faad14', marginTop: '2px', flexShrink: 0 }}
                />
                <span>{weakness}</span>
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* Missing Keywords */}
      {matchScore?.missingKeywords && matchScore.missingKeywords.length > 0 && (
        <div>
          <div style={{ marginBottom: '12px', fontWeight: 500 }}>
            🔑 缺失关键词
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {matchScore.missingKeywords
              .slice(0, 10)
              .map((keyword: string, index: number) => (
                <Tag key={index} color="error">
                  {keyword}
                </Tag>
              ))}
            {matchScore.missingKeywords.length > 10 && (
              <Tag>+{matchScore.missingKeywords.length - 10} 更多</Tag>
            )}
          </div>
        </div>
      )}

      {!matchScore?.strengths?.length &&
        !matchScore?.weaknesses?.length &&
        !matchScore?.missingKeywords?.length && (
          <Empty description={t('match_analysis.no_data', '暂无分析数据')} />
        )}
    </Card>
  );
};

export default MatchAnalysisCard;
