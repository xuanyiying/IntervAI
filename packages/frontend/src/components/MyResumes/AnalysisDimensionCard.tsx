import React from 'react';
import { Card, List, Row, Typography, Progress } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface AnalysisDimensionCardProps {
  scoreDetail: {
    projectScore: number;
    skillMatchScore: number;
    contentScore: number;
    structureScore: number;
    expressionScore: number;
  };
}

export const AnalysisDimensionCard: React.FC<AnalysisDimensionCardProps> = ({
  scoreDetail,
}) => {
  const { t } = useTranslation();
  const items = [
    {
      label: t('resume.analysis.dimension.project'),
      score: scoreDetail.projectScore,
      max: 40,
      color: '#1890ff',
    },
    {
      label: t('resume.analysis.dimension.skills'),
      score: scoreDetail.skillMatchScore,
      max: 20,
      color: '#52c41a',
    },
    {
      label: t('resume.analysis.dimension.content'),
      score: scoreDetail.contentScore,
      max: 15,
      color: '#722ed1',
    },
    {
      label: t('resume.analysis.dimension.structure'),
      score: scoreDetail.structureScore,
      max: 15,
      color: '#fa8c16',
    },
    {
      label: t('resume.analysis.dimension.expression'),
      score: scoreDetail.expressionScore,
      max: 10,
      color: '#eb2f96',
    },
  ];

  return (
    <Card
      title={t('resume.analysis.dimension.title')}
      hoverable
      style={{ height: '100%' }}
    >
      <List
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text strong>{item.label}</Text>
                <Text>
                  {item.score} / {item.max}
                </Text>
              </Row>
              <Progress
                percent={(item.score / item.max) * 100}
                strokeColor={item.color}
                showInfo={false}
                size="small"
              />
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};
