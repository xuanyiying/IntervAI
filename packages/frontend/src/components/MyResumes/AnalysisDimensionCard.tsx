import React from 'react';
import { Card, List, Row, Typography, Progress } from 'antd';

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
  const items = [
    {
      label: '项目经历 (Project)',
      score: scoreDetail.projectScore,
      max: 40,
      color: '#1890ff',
    },
    {
      label: '技能匹配 (Skills)',
      score: scoreDetail.skillMatchScore,
      max: 20,
      color: '#52c41a',
    },
    {
      label: '内容完整 (Content)',
      score: scoreDetail.contentScore,
      max: 15,
      color: '#722ed1',
    },
    {
      label: '结构清晰 (Structure)',
      score: scoreDetail.structureScore,
      max: 15,
      color: '#fa8c16',
    },
    {
      label: '表达专业 (Expression)',
      score: scoreDetail.expressionScore,
      max: 10,
      color: '#eb2f96',
    },
  ];

  return (
    <Card
      title="维度得分 (Dimension Scores)"
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
