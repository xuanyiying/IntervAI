import React from 'react';
import { Spin } from 'antd';

export const ResumeAnalysisLoading: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <Spin size="large" tip="正在深度分析您的简历，请稍候..." />
      <div style={{ marginTop: 24, color: '#8c8c8c' }}>
        AI 正在逐行审计您的项目经历和技能描述...
      </div>
    </div>
  );
};
