import React from 'react';
import {
  Card,
  Progress,
  Statistic,
  Typography,
  Divider,
  List,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AnalysisDimensionCard } from './AnalysisDimensionCard';

const { Paragraph, Text } = Typography;

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

interface ResumeAnalysisResultProps {
  result: AnalysisResult;
}

export const ResumeAnalysisResult: React.FC<ResumeAnalysisResultProps> = ({
  result,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
        return 'red';
      case '中':
        return 'orange';
      case '低':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: '优秀 (Excellent)', color: '#3f8600' };
    if (score >= 75) return { label: '良好 (Good)', color: '#3f8600' };
    if (score >= 60) return { label: '及格 (Pass)', color: '#faad14' };
    return { label: '需改进 (Improve)', color: '#cf1322' };
  };

  const status = getScoreStatus(result.overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            title="综合评分 (Overall Score)"
            hoverable
            style={{ height: '100%', textAlign: 'center' }}
          >
            <Progress
              type="dashboard"
              percent={result.overallScore}
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              width={180}
            />
            <div style={{ marginTop: 16 }}>
              <Statistic
                title="简历评级"
                value={status.label}
                valueStyle={{ color: status.color }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <AnalysisDimensionCard scoreDetail={result.scoreDetail} />
        </Col>

        <Col xs={24} md={8}>
          <Card title="综合点评 (Summary)" hoverable style={{ height: '100%' }}>
            <Paragraph style={{ fontSize: 16 }}>{result.summary}</Paragraph>
            <Divider orientation={'left' as any} plain>
              亮点 (Strengths)
            </Divider>
            <List
              size="small"
              dataSource={result.strengths}
              renderItem={(item) => (
                <List.Item>
                  <Text>
                    <CheckCircleOutlined
                      style={{ color: '#52c41a', marginRight: 8 }}
                    />{' '}
                    {item}
                  </Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="优化建议 (Optimization Suggestions)" hoverable>
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
              dataSource={result.suggestions}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    type="inner"
                    title={
                      <>
                        <Tag color={getPriorityColor(item.priority)}>
                          {item.priority}优先级
                        </Tag>{' '}
                        {item.category}
                      </>
                    }
                    headStyle={{ backgroundColor: '#fafafa' }}
                  >
                    <Paragraph>
                      <Text strong>
                        <WarningOutlined style={{ color: '#faad14' }} /> 问题：
                      </Text>
                      {item.issue}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>
                        <RocketOutlined style={{ color: '#1890ff' }} /> 建议：
                      </Text>
                      {item.recommendation}
                    </Paragraph>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};
