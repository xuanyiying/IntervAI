import React from 'react';
import { Button, Typography } from 'antd';
import { RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface ResumeAnalysisEmptyStateProps {
  onAnalyze: () => void;
}

export const ResumeAnalysisEmptyState: React.FC<ResumeAnalysisEmptyStateProps> = ({ onAnalyze }) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <ThunderboltOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
      <Title level={3}>准备好进行深度诊断了吗？</Title>
      <Paragraph type="secondary" style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        我们将基于大模型技术，从技术深度、业务价值、表达逻辑等维度对您的简历进行全方位审计与评分。此过程可能需要 1-2 分钟。
      </Paragraph>
      <Button 
        type="primary" 
        size="large" 
        icon={<RocketOutlined />} 
        onClick={onAnalyze}
        style={{ height: 48, padding: '0 48px', fontSize: 18 }}
      >
        开始深度诊断
      </Button>
    </div>
  );
};
