import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useConversationStore,
  useResumeStore,
  useAuthStore,
} from '../../stores';
import { useChatSocket } from '../../hooks/useChatSocket';
import { AttachmentStatus, MessageRole } from '../../types';
import { accountService } from '../../services/account-service';

// Components
import { ChatWelcome } from './components/ChatWelcome';
import { ChatList } from './components/ChatList';
import { ChatInput } from './components/ChatInput';
import ResumeComparisonDialog from '../../components/ResumeComparisonDialog';

// Hooks
import { useResumeUpload } from './hooks/useResumeUpload';
import { useOptimization } from './hooks/useOptimization';
import { useChatItems } from './hooks/useChatItems';

import './chat.css';

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<any>(null);

  // Local State
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Guest State
  const [guestCount, setGuestCount] = useState(0);
  const [guestMessages, setGuestMessages] = useState<any[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Usage Data Fetching
  const fetchUsage = async () => {
    if (user) {
      try {
        const data = await accountService.getUsage();
        setUsage(data);
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('guest_usage_count');
      if (stored) setGuestCount(parseInt(stored, 10));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUsage({
        quota: {
          tier: 'FREE',
          optimizationsLimit: 3,
          optimizationsUsed: guestCount,
          pdfGenerationsLimit: 0,
          pdfGenerationsUsed: 0,
        },
      } as any);
    }
  }, [user, guestCount]);

  // Global Stores
  const { currentResume } = useResumeStore();
  const {
    currentConversation,
    messages,
    isLoadingMessages,
    messageError,
    loadMessages,
    loadMoreMessages,
    createConversation,
    setCurrentConversation,
    hasMoreMessages,
  } = useConversationStore();

  // Custom Hooks
  // 1. Resume Upload & Parsing
  const {
    uploadItems,
    handleResumeUpload,
    updateAttachmentStatus,
    setUploadItems, // Exposed for socket updates
    removeUploadItem,
    failedFiles,
  } = useResumeUpload({
    currentConversationId: currentConversation?.id,
    onResumeParsed: (resumeId, markdown, conversationId) => {
      const targetId = conversationId || currentConversation?.id;
      // Notify socket about parsed resume
      if (targetId && user) {
        notifyResumeParsed(targetId, resumeId, markdown);
        sendSocketMessage(targetId, '优化简历', {
          action: 'optimize_resume',
          resumeId: resumeId,
        });
      }
      // Also update comparison data
      setComparisonData((prev) => ({ ...prev, original: markdown }));
    },
  });

  // 2. WebSocket
  const {
    isConnected,
    isStreaming,
    streamingContent,
    sendMessage: sendSocketMessage,
    notifyResumeParsed,
    joinConversation,
    reset: resetSocket,
  } = useChatSocket({
    onMessage: (msg) => console.log('Message received:', msg),
    onChunk: (chunk) =>
      console.log('Chunk received:', chunk.content?.substring(0, 50)),
    onDone: async (msg) => {
      if (currentConversation) {
        try {
          await loadMessages(currentConversation.id);
          if (
            msg.metadata?.type === 'optimization_result' &&
            msg.metadata?.optimizedContent
          ) {
            setComparisonData((prev) => ({
              ...prev,
              optimized:
                (msg.metadata?.optimizedContent as string) || prev.optimized,
            }));
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Failed to load messages:', error);
        } finally {
          resetSocket();
        }
      }
    },
    onError: (err) => message.error(err.content || '处理消息时发生错误'),
    onSystem: (sys) => {
      if (sys.metadata?.action === 'resume_ready') {
        message.success('简历已准备就绪，可以开始优化！');
      }
      if (sys.metadata?.stage) {
        const { resumeId, stage, progress, error } = sys.metadata;
        let status: AttachmentStatus['status'] = 'parsing';
        let finalProgress = progress;

        if (stage === 'finalizing') {
          status = 'completed';
          finalProgress = 100;
        }
        if (stage === 'error') {
          status = 'error';
        }

        updateAttachmentStatus(
          resumeId,
          {
            parseProgress: finalProgress,
            status: status,
            mode: 'parse',
            error: error,
          },
          'parse'
        );
      }
    },
    onConnected: () => {
      if (currentConversation) {
        joinConversation(currentConversation.id);
      }
    },
  });

  // 3. Optimization Logic
  const {
    comparisonVisible,
    setComparisonVisible,
    comparisonData,
    setComparisonData,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleAcceptAllSuggestions,
    handleDownloadOptimized,
    handleStartOptimization,
  } = useOptimization({
    sendSocketMessage,
    setLocalItems: setUploadItems,
  });

  // 5. Chat Items Aggregation
  const items = useChatItems({
    messages: user ? messages : guestMessages,
    localItems: uploadItems,
    streamingContent,
    isStreaming,
  });

  // Initialization Effects
  useEffect(() => {
    const init = async () => {
      if (conversationId && user) {
        if (currentConversation?.id !== conversationId) {
          setCurrentConversation({ id: conversationId } as any);
          await loadMessages(conversationId);
        }
        return;
      }
    };
    init();
  }, [
    conversationId,
    currentConversation?.id,
    loadMessages,
    setCurrentConversation,
    user,
  ]);

  useEffect(() => {
    if (currentConversation && isConnected && user) {
      joinConversation(currentConversation.id);
    }
  }, [currentConversation?.id, isConnected, joinConversation, user]);

  // Handlers
  const handleGuestSubmit = async (nextValue: string) => {
    if (guestCount >= 3) {
      setIsLoginModalOpen(true);
      return;
    }

    const newCount = guestCount + 1;
    setGuestCount(newCount);
    localStorage.setItem('guest_usage_count', newCount.toString());

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: nextValue,
      createdAt: new Date(),
    };
    setGuestMessages((prev) => [...prev, userMsg]);
    setValue('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content:
          '我是 AI Resume 助手。作为一个访客，我只能回答基础问题。请登录以体验完整功能，包括简历优化、面试模拟等！',
        createdAt: new Date(),
      };
      setGuestMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = async (nextValue: string) => {
    if (!nextValue) return;

    if (!user) {
      handleGuestSubmit(nextValue);
      return;
    }

    // Check quota for authenticated user
    if (usage && usage.quota.optimizationsLimit !== -1 && usage.quota.optimizationsUsed >= usage.quota.optimizationsLimit) {
      message.warning(t('account.usage.no_remaining_uses', '次数已用尽，请升级计划'));
      return;
    }

    let targetId = currentConversation?.id;
    if (!targetId) {
      try {
        const newConvo = await createConversation();
        targetId = newConvo.id;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        message.error(t('common.error'));
        return;
      }
    }

    try {
      setValue('');
      setLoading(true);
      sendSocketMessage(targetId, nextValue, {
        hasResume: !!comparisonData.original,
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error(t('common.error'));
      setLoading(false);
    }
  };

  const handleRetryLoadMessages = async () => {
    if (currentConversation && user) {
      try {
        await loadMessages(currentConversation.id);
        setRetryCount(0);
      } catch (error) {
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          setTimeout(handleRetryLoadMessages, 2000);
        }
      }
    }
  };

  const handleFileUploadWrapper = async (file: File) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    let targetId = currentConversation?.id;
    if (!targetId) {
      try {
        const newConvo = await createConversation();
        targetId = newConvo.id;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        message.error(t('common.error'));
        return;
      }
    }
    if (targetId) {
      await handleResumeUpload(file, undefined, targetId);
    }
  };

  const handleActionClick = async (key: string, label: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (key === 'resume_optimization') {
      let targetId = currentConversation?.id;
      if (!targetId && (currentResume || comparisonData.original)) {
        try {
          const newConvo = await createConversation();
          targetId = newConvo.id;
        } catch (error) {
          console.error('Failed to create conversation:', error);
          return;
        }
      }
      handleStartOptimization(
        !!(currentResume || comparisonData.original),
        targetId
      );
    } else if (key === 'interview_prediction') {
      navigate('/agents/interview-prediction');
    } else if (key === 'mock_interview') {
      navigate('/agents/mock-interview');
    } else {
      handleSubmit(label);
    }
  };

  const handleLoadMore = async () => {
    if (currentConversation && hasMoreMessages && !isLoadingMessages && user) {
      await loadMoreMessages(currentConversation.id);
    }
  };

  return (
    <div className="chat-page-container flex flex-col h-full w-full relative overflow-hidden">
      {/* Guest Header */}
      {!user && (
        <div className="w-full bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 px-4 py-2 flex items-center justify-between z-20">
          <span className="text-sm text-blue-600 dark:text-blue-300">
            {t('chat.guest_mode', '访客模式')}
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
            {t('account.usage.remaining_uses', {
              count: Math.max(0, 3 - guestCount),
              remaining: Math.max(0, 3 - guestCount),
              limit: 3,
            })}
          </span>
        </div>
      )}

      {/* Auth Usage Header */}
      {user && usage && (
        <div className="w-full bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center justify-between z-20">
          <span className="text-sm text-primary-400">
            {usage.quota.tier === 'FREE' ? t('account.usage.free_tier', '免费版') : t('account.usage.pro_tier', '专业版')}
          </span>
          <span className="text-sm font-medium text-primary-400">
            {t('account.usage.remaining_uses', {
              count: Math.max(0, usage.quota.optimizationsLimit - usage.quota.optimizationsUsed),
              remaining: Math.max(0, usage.quota.optimizationsLimit - usage.quota.optimizationsUsed),
              limit: usage.quota.optimizationsLimit,
            })}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {items.length <= 1 &&
        !loading &&
        !isLoadingMessages &&
        guestMessages.length === 0 ? (
          <ChatWelcome
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            loading={loading || (usage && usage.quota.optimizationsLimit !== -1 && usage.quota.optimizationsUsed >= usage.quota.optimizationsLimit)}
            onFileSelect={handleFileUploadWrapper}
            onActionClick={handleActionClick}
          />
        ) : (
          <>
            <ChatList
              items={items}
              isLoading={isLoadingMessages}
              messageError={messageError}
              hasMoreMessages={hasMoreMessages && !!user}
              isStreaming={isStreaming}
              onLoadMore={handleLoadMore}
              onRetryLoad={handleRetryLoadMessages}
              contentHandlers={{
                onDeleteAttachment: removeUploadItem,
                onRetryAttachment: (key) => {
                  const file = failedFiles.get(key);
                  if (file) handleResumeUpload(file, key);
                  else message.info('无法获取原始文件，请重新上传');
                },
                onOpenComparison: () => setComparisonVisible(true),
                onDownloadOptimized: handleDownloadOptimized,
                onConfirmJob: () => {},
                onEditJob: () => {},
                onDeleteJob: () => {},
                onAcceptSuggestion: handleAcceptSuggestion,
                onRejectSuggestion: handleRejectSuggestion,
                onAcceptAllSuggestions: handleAcceptAllSuggestions,
              }}
            />
            <ChatInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              loading={loading || (usage && usage.quota.optimizationsLimit !== -1 && usage.quota.optimizationsUsed >= usage.quota.optimizationsLimit)}
              onFileSelect={handleFileUploadWrapper}
            />
          </>
        )}
      </div>

      <ResumeComparisonDialog
        visible={comparisonVisible}
        onClose={() => setComparisonVisible(false)}
        originalContent={comparisonData.original}
        optimizedContent={comparisonData.optimized}
        onDownload={handleDownloadOptimized}
      />

      <Modal
        title={t('common.login_required', '需要登录')}
        open={isLoginModalOpen}
        onCancel={() => setIsLoginModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsLoginModalOpen(false)}>
            {t('common.cancel', '取消')}
          </Button>,
          <Button key="login" type="primary" onClick={() => navigate('/login')}>
            {t('common.login_now', '立即登录')}
          </Button>,
        ]}
      >
        <p>
          {t(
            'chat.guest_limit_reached',
            '您已达到访客使用限制（3次）。请登录以继续使用完整功能！'
          )}
        </p>
      </Modal>
    </div>
  );
};

export default ChatPage;
