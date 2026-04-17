import { CheckOutlined, CloseOutlined, DiffOutlined } from '@ant-design/icons';
import { Button, Card, message, Space, Tag, theme, Tooltip } from 'antd';
import React, { useState } from 'react';
import { Suggestion, SuggestionStatus, SuggestionType } from '../types';
import InlineDiffViewer from './InlineDiffViewer';

interface SuggestionDiffCardProps {
  suggestion: Suggestion;
  onAccept: (suggestionId: string) => Promise<void>;
  onReject: (suggestionId: string) => Promise<void>;
  index: number;
}

const SuggestionDiffCard: React.FC<SuggestionDiffCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  index,
}) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(true);

  const typeColors: Record<SuggestionType, string> = {
    [SuggestionType.CONTENT]: 'blue',
    [SuggestionType.KEYWORD]: 'green',
    [SuggestionType.STRUCTURE]: 'orange',
    [SuggestionType.QUANTIFICATION]: 'purple',
  };

  const typeLabels: Record<SuggestionType, string> = {
    [SuggestionType.CONTENT]: '内容优化',
    [SuggestionType.KEYWORD]: '关键词',
    [SuggestionType.STRUCTURE]: '结构调整',
    [SuggestionType.QUANTIFICATION]: '量化指标',
  };

  const statusColors: Record<string, string> = {
    [SuggestionStatus.PENDING]: 'default',
    [SuggestionStatus.ACCEPTED]: 'success',
    [SuggestionStatus.REJECTED]: 'error',
  };

  const statusLabels: Record<string, string> = {
    [SuggestionStatus.PENDING]: '待处理',
    [SuggestionStatus.ACCEPTED]: '已接受',
    [SuggestionStatus.REJECTED]: '已拒绝',
  };

  const sectionLabels: Record<string, string> = {
    experience: '工作经历',
    projects: '项目经验',
    skills: '技能标签',
    summary: '自我介绍',
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      await onAccept(suggestion.id!);
      message.success('建议已接受');
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
      message.error('接受建议失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await onReject(suggestion.id!);
      message.success('建议已拒绝');
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      message.error('拒绝建议失败');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = suggestion.status !== SuggestionStatus.PENDING;

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        borderLeft: `4px solid ${
          suggestion.status === SuggestionStatus.ACCEPTED
            ? token.colorSuccess
            : suggestion.status === SuggestionStatus.REJECTED
              ? token.colorError
              : token.colorPrimary
        }`,
        opacity: isDisabled ? 0.75 : 1,
        transition: 'all 0.3s ease',
      }}
      className="suggestion-diff-card"
    >
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <Space size={8}>
            <span
              style={{
                fontWeight: 600,
                color: token.colorTextSecondary,
                fontSize: '13px',
              }}
            >
              #{index + 1}
            </span>
            <Tag color={typeColors[suggestion.type]}>
              {typeLabels[suggestion.type]}
            </Tag>
            <Tag color={statusColors[suggestion.status || '']}>
              {statusLabels[suggestion.status || '']}
            </Tag>
            <Tag
              style={{
                fontSize: '11px',
                background: token.colorBgLayout,
                borderColor: token.colorBorderSecondary,
              }}
            >
              {sectionLabels[suggestion.section] || suggestion.section}
            </Tag>
          </Space>

          {!isDisabled && (
            <Tooltip title={showDiff ? '收起 Diff' : '展开 Diff'}>
              <Button
                type="text"
                size="small"
                icon={<DiffOutlined />}
                onClick={() => setShowDiff(!showDiff)}
              />
            </Tooltip>
          )}
        </div>

        {suggestion.reason && (
          <div
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              backgroundColor: token.colorInfoBg,
              borderRadius: '6px',
              fontSize: '12px',
              color: token.colorTextSecondary,
              lineHeight: 1.5,
              borderLeft: `3px solid ${token.colorInfo}`,
            }}
          >
            💡 {suggestion.reason}
          </div>
        )}

        {showDiff && (
          <InlineDiffViewer
            original={suggestion.original}
            optimized={suggestion.optimized}
            splitView={false}
            showDiffOnly={true}
          />
        )}
      </div>

      {!isDisabled ? (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Tooltip title="接受此建议">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={handleAccept}
              loading={loading}
              ghost
            >
              接受
            </Button>
          </Tooltip>
          <Tooltip title="拒绝此建议">
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={handleReject}
              loading={loading}
            >
              拒绝
            </Button>
          </Tooltip>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            paddingTop: '8px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            fontSize: '12px',
            color:
              suggestion.status === SuggestionStatus.ACCEPTED
                ? token.colorSuccess
                : token.colorError,
          }}
        >
          {suggestion.status === SuggestionStatus.ACCEPTED ? (
            <>
              <CheckOutlined /> 已接受 — 已应用到简历
            </>
          ) : (
            <>
              <CloseOutlined /> 已拒绝 — 保持原文不变
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default SuggestionDiffCard;
