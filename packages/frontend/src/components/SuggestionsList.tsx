import React, { useState } from 'react';
import {
  Card,
  Button,
  Statistic,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import SuggestionCard from './SuggestionCard';
import SuggestionDiffCard from './SuggestionDiffCard';
import { Suggestion, SuggestionStatus } from '../types';

interface SuggestionsListProps {
  suggestions: Suggestion[];
  onAccept: (suggestionId: string) => Promise<void>;
  onReject: (suggestionId: string) => Promise<void>;
  onAcceptAll?: () => Promise<void>;
  loading?: boolean;
  useDiffView?: boolean;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onAccept,
  onReject,
  onAcceptAll,
  loading = false,
  useDiffView = true,
}) => {
  const { token } = theme.useToken();
  const [acceptAllLoading, setAcceptAllLoading] = useState(false);

  const acceptedCount = suggestions.filter(
    (s) => s.status === SuggestionStatus.ACCEPTED
  ).length;
  const rejectedCount = suggestions.filter(
    (s) => s.status === SuggestionStatus.REJECTED
  ).length;
  const pendingCount = suggestions.filter(
    (s) => s.status === SuggestionStatus.PENDING
  ).length;

  const handleAcceptAll = async () => {
    try {
      setAcceptAllLoading(true);
      if (onAcceptAll) {
        await onAcceptAll();
        message.success('所有建议已接受');
      }
    } catch (error) {
      console.error('Failed to accept all suggestions:', error);
      message.error('接受所有建议失败');
    } finally {
      setAcceptAllLoading(false);
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card style={{ marginBottom: '12px' }}>
        <Empty
          description="暂无优化建议"
          style={{ marginTop: '20px', marginBottom: '20px' }}
        />
      </Card>
    );
  }

  return (
    <Card
      style={{
        marginBottom: '12px',
        borderLeft: `4px solid ${token.colorPrimary}`,
      }}
    >
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={8} sm={6}>
            <Statistic
              title="总建议数"
              value={suggestions.length}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title="待处理"
              value={pendingCount}
              valueStyle={{ color: token.colorWarning }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title="已接受"
              value={acceptedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title="已拒绝"
              value={rejectedCount}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Col>
        </Row>

        {pendingCount > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <Tooltip title="接受所有待处理的建议">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleAcceptAll}
                  loading={acceptAllLoading}
                  disabled={pendingCount === 0}
                >
                  接受全部 ({pendingCount})
                </Button>
              </Tooltip>
            </div>
            <Divider style={{ margin: '16px 0' }} />
          </>
        )}

        <div style={{ maxHeight: '600px', overflow: 'auto' }}>
          {suggestions.map((suggestion, index) =>
            useDiffView ? (
              <SuggestionDiffCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAccept}
                onReject={onReject}
                index={index}
              />
            ) : (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAccept}
                onReject={onReject}
                index={index}
              />
            )
          )}
        </div>

        <Divider style={{ margin: '16px 0' }} />
        <div
          style={{
            fontSize: '12px',
            color: token.colorTextTertiary,
            textAlign: 'center',
          }}
        >
          💡
          提示：接受建议后，您的简历将自动更新为新版本。您可以随时查看历史版本。
        </div>
      </Spin>
    </Card>
  );
};

export default SuggestionsList;
