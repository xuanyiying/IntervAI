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
import { useTranslation } from 'react-i18next';
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
  language?: 'zh' | 'en';
  summary: string;
  strengths: string[];
  suggestions: {
    category: string;
    priority: string;
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
  const { t } = useTranslation();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '高':
      case 'High':
        return 'red';
      case '中':
      case 'Medium':
        return 'orange';
      case '低':
      case 'Low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const priorityLabel = (priority: string) =>
    t('resume.analysis.priority_suffix', { priority });

  const getScoreStatus = (score: number) => {
    if (score >= 90)
      return { label: t('resume.analysis.grade_excellent'), color: '#3f8600' };
    if (score >= 75)
      return { label: t('resume.analysis.grade_good'), color: '#3f8600' };
    if (score >= 60)
      return { label: t('resume.analysis.grade_pass'), color: '#faad14' };
    return { label: t('resume.analysis.grade_improve'), color: '#cf1322' };
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
            title={t('resume.analysis.overall_score')}
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
                title={t('resume.analysis.rating')}
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
          <Card
            title={t('resume.analysis.summary_title')}
            hoverable
            style={{ height: '100%' }}
          >
            <Paragraph style={{ fontSize: 16 }}>{result.summary}</Paragraph>
            <Divider orientation={'left' as any} plain>
              {t('resume.analysis.strengths')}
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
          <Card
            title={t('resume.analysis.suggestions_title')}
            hoverable
          >
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
                          {priorityLabel(item.priority)}
                        </Tag>{' '}
                        {item.category}
                      </>
                    }
                    headStyle={{ backgroundColor: '#fafafa' }}
                  >
                    <Paragraph>
                      <Text strong>
                        <WarningOutlined style={{ color: '#faad14' }} />{' '}
                        {t('resume.analysis.issue')}
                      </Text>
                      {item.issue}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>
                        <RocketOutlined style={{ color: '#1890ff' }} />{' '}
                        {t('resume.analysis.fix')}
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
