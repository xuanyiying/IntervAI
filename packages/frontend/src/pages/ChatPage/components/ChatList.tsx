import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bubble } from '@ant-design/x';
import { Button, Spin, Alert } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { MessageRole, MessageItem } from '../../../types';
import { MessageContent } from './MessageContent';

interface ChatListProps {
  items: MessageItem[];
  isLoading: boolean;
  messageError: string | null;
  hasMoreMessages: boolean;
  isStreaming: boolean;
  onLoadMore: () => void;
  onRetryLoad: () => void;
  // Handlers passed down to MessageContent
  contentHandlers: Omit<
    React.ComponentProps<typeof MessageContent>,
    'item' | 'isStreaming'
  >;
}

export const ChatList: React.FC<ChatListProps> = ({
  items,
  isLoading,
  messageError,
  hasMoreMessages,
  isStreaming,
  onLoadMore,
  onRetryLoad,
  contentHandlers,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const lastItemKeyRef = useRef<string | undefined>(undefined);

  // Compute initial visible count based on container height (approximation)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const estimatedItemHeight = 92; // approximate bubble height
    const overscan = 3;
    const cnt = Math.max(
      Math.ceil(el.clientHeight / estimatedItemHeight) * overscan,
      30
    );
    setVisibleCount(cnt);
  }, []);

  // Scroll-to-bottom only when streaming or tail item changed
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const lastKey = items.length ? items[items.length - 1].key : undefined;
    const shouldAutoScroll =
      isStreaming ||
      (lastKey &&
        lastKey !== lastItemKeyRef.current &&
        el.scrollTop > el.scrollHeight - el.clientHeight - 80);
    if (shouldAutoScroll) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    lastItemKeyRef.current = lastKey;
  }, [items, isStreaming]);

  const visibleItems = useMemo(() => {
    if (items.length <= visibleCount) return items;
    return items.slice(items.length - visibleCount);
  }, [items, visibleCount]);

  if (isLoading && items.length === 0) {
    return (
      <div className="chat-loading-container flex items-center justify-center h-full">
        <Spin size="large" tip={t('chat.loading_messages')} />
      </div>
    );
  }

  if (messageError && items.length === 0) {
    return (
      <div className="chat-error-container flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500">{messageError}</p>
        <Button type="primary" onClick={onRetryLoad}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div
      id="scrollableDiv"
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
      style={{ height: 'calc(100vh - 180px)' }}
    >
      <div className="bubble-list-container">
        {messageError && (
          <div className="mb-4">
            <Alert
              message={messageError}
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={onRetryLoad}>
                  {t('common.retry')}
                </Button>
              }
            />
          </div>
        )}
        {hasMoreMessages && (
          <div className="load-more-container flex justify-center mb-4">
            <Button
              type="link"
              onClick={() => {
                // Increase local window size before requesting older messages
                setVisibleCount((c) => c + 40);
                onLoadMore();
              }}
              loading={isLoading}
            >
              {t('chat.load_more')}
            </Button>
          </div>
        )}
        <Bubble.List
          items={visibleItems.map((item) => ({
            key: item.key,
            role: item.role,
            header: item.header,
            placement: item.role === MessageRole.USER ? 'end' : 'start',
            content: (
              <MessageContent
                item={item}
                isStreaming={isStreaming}
                {...contentHandlers}
              />
            ),
            avatar:
              item.role === MessageRole.USER ? (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--chat-bubble-user-bg)',
                  }}
                >
                  <UserOutlined
                    style={{
                      color: 'var(--chat-text-secondary)',
                      fontSize: '18px',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(22, 119, 255, 0.1)',
                  }}
                >
                  <RobotOutlined
                    style={{
                      color: 'var(--chat-primary)',
                      fontSize: '18px',
                    }}
                  />
                </div>
              ),
          }))}
        />
      </div>
    </div>
  );
};
