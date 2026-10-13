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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        message.success(t('suggestions.accept_all_success'));
      }
    } catch (error) {
      console.error('Failed to accept all suggestions:', error);
      message.error(t('suggestions.accept_all_failed'));
    } finally {
      setAcceptAllLoading(false);
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card style={{ marginBottom: '12px' }}>
        <Empty
          description={t('suggestions.empty')}
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
              title={t('suggestions.total')}
              value={suggestions.length}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title={t('suggestions.pending')}
              value={pendingCount}
              valueStyle={{ color: token.colorWarning }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title={t('suggestions.accepted')}
              value={acceptedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Col>
          <Col xs={8} sm={6}>
            <Statistic
              title={t('suggestions.rejected')}
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
              <Tooltip title={t('suggestions.accept_all_tooltip')}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleAcceptAll}
                  loading={acceptAllLoading}
                  disabled={pendingCount === 0}
                >
                  {t('suggestions.accept_all')} ({pendingCount})
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
          💡 {t('suggestions.hint')}
        </div>
      </Spin>
    </Card>
  );
};

export default SuggestionsList;
