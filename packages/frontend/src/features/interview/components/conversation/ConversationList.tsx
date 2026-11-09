import StreamingMarkdownBubble from '@/features/interview/components/StreamingMarkdownBubble';
import { formatTime } from '@/shared/utils/format';
import {
  InfoCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Spin, Tag } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import type {
  ConversationRole,
  ConversationTurn,
} from '@/features/interview/utils/conversation';
import './ConversationList.css';

export interface ConversationListProps {
  items: ConversationTurn[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Text of the answer currently being streamed, rendered as a live bubble. */
  streamingContent?: string;
  isStreaming?: boolean;
  title?: string;
  emptyText?: string;
  /** Mode-specific role names, e.g. mock: interviewer/you; assist: AI answer. */
  roleLabels?: Partial<Record<ConversationRole, string>>;
  maxHeight?: number;
  className?: string;
}

const ROLE_ICONS: Record<ConversationRole, React.ReactNode> = {
  user: <UserOutlined />,
  assistant: <RobotOutlined />,
  system: <InfoCircleOutlined />,
};

const safeFormatTime = (value?: string): string => {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  try {
    return formatTime(value);
  } catch {
    return '';
  }
};

const ConversationBubble: React.FC<{
  turn: ConversationTurn;
  label: string;
}> = React.memo(({ turn, label }) => (
  <article className={`conv-bubble conv-bubble--${turn.role}`}>
    <header className="conv-meta">
      <span className="conv-role">
        {ROLE_ICONS[turn.role]}
        {label}
        {turn.label ? <span className="conv-context">{turn.label}</span> : null}
      </span>
      <span className="conv-meta-right">
        {typeof turn.score === 'number' && (
          <Tag
            color={
              turn.score >= 80 ? 'green' : turn.score >= 60 ? 'gold' : 'red'
            }
          >
            {turn.score}
          </Tag>
        )}
        {safeFormatTime(turn.createdAt) && (
          <time className="conv-time" dateTime={turn.createdAt}>
            {safeFormatTime(turn.createdAt)}
          </time>
        )}
      </span>
    </header>
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.content}</ReactMarkdown>
    </div>
    {turn.audioUrl && (
      <audio
        className="conv-audio"
        controls
        preload="none"
        src={turn.audioUrl}
      />
    )}
  </article>
));
ConversationBubble.displayName = 'ConversationBubble';

/**
 * Shared conversation view for mock-interview and live-assist sessions.
 * Handles history, empty/loading/error states, streaming output and
 * bottom-sticky scrolling so neither view has to re-implement them.
 */
const ConversationList: React.FC<ConversationListProps> = ({
  items,
  loading = false,
  error = null,
  onRetry,
  streamingContent = '',
  isStreaming = false,
  title,
  emptyText,
  roleLabels,
  maxHeight = 360,
  className,
}) => {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const resolvedTitle =
    title ?? t('interview.conversation.title', 'Conversation');
  const resolvedEmpty =
    emptyText ?? t('interview.conversation.empty', 'No messages yet.');

  const labels = useMemo<Record<ConversationRole, string>>(
    () => ({
      user: roleLabels?.user ?? t('interview.conversation.role_user', 'You'),
      assistant:
        roleLabels?.assistant ?? t('interview.conversation.role_ai', 'AI'),
      system:
        roleLabels?.system ?? t('interview.conversation.role_system', 'System'),
    }),
    [roleLabels, t]
  );

  const hasStream = streamingContent.length > 0 || isStreaming;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!stickToBottomRef.current && !isStreaming) return;
    el.scrollTop = el.scrollHeight;
  }, [items, streamingContent, isStreaming]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const showError = !!error && items.length === 0 && !hasStream;
  const showLoading = loading && !showError && items.length === 0 && !hasStream;
  const showEmpty =
    !showLoading && !showError && items.length === 0 && !hasStream;

  return (
    <section className={`conv-panel${className ? ` ${className}` : ''}`}>
      <header className="conv-header">
        <span className="conv-title">{resolvedTitle}</span>
        <span className="conv-count">
          {t('interview.conversation.turn_count', '{{count}} messages', {
            count: items.length,
          })}
        </span>
      </header>

      <div
        ref={listRef}
        className="conv-list"
        style={{ maxHeight }}
        onScroll={handleScroll}
        role="log"
        aria-label={resolvedTitle}
        aria-live="polite"
      >
        {showLoading && (
          <div className="conv-state">
            <Spin size="small" />
            <span>{t('interview.conversation.loading', 'Loading...')}</span>
          </div>
        )}

        {showError && (
          <div className="conv-state conv-state--error">
            <span>
              {error ??
                t('interview.conversation.load_failed', 'Failed to load.')}
            </span>
            {onRetry && (
              <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                {t('interview.conversation.retry', 'Retry')}
              </Button>
            )}
          </div>
        )}

        {showEmpty && <div className="conv-state">{resolvedEmpty}</div>}

        {error && items.length > 0 && (
          <div className="conv-inline-error" role="status">
            {error}
          </div>
        )}

        {items.map((turn) => (
          <ConversationBubble
            key={turn.id}
            turn={turn}
            label={labels[turn.role]}
          />
        ))}

        {hasStream && (
          <article className="conv-bubble conv-bubble--assistant conv-stream">
            <header className="conv-meta">
              <span className="conv-role">
                {ROLE_ICONS.assistant}
                {t('interview.conversation.streaming', 'AI is answering')}
              </span>
            </header>
            <StreamingMarkdownBubble
              content={streamingContent}
              isStreaming={isStreaming}
            />
          </article>
        )}
      </div>
    </section>
  );
};

export default ConversationList;
