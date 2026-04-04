import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageRole,
  type MessageItem,
  type Job,
  type AttachmentStatus,
  type InterviewQuestion,
} from '../../../types';
import { formatTime } from '../../../i18n';

interface UseChatItemsProps {
  messages: any[];
  localItems: MessageItem[];
  streamingContent: string;
  isStreaming: boolean;
}

export const useChatItems = ({
  messages,
  localItems,
  streamingContent,
  isStreaming,
}: UseChatItemsProps) => {
  const { t } = useTranslation();

  const items = useMemo(() => {
    let mappedItems: MessageItem[] = [];

    if (messages.length > 0) {
      mappedItems = messages.map((msg) => {
        let messageType: MessageItem['type'] = 'text';
        if (msg.metadata?.type === 'job') {
          messageType = 'job';
        } else if (msg.metadata?.type === 'suggestions') {
          messageType = 'suggestions';
        } else if (msg.metadata?.type === 'pdf') {
          messageType = 'markdown-pdf';
        } else if (msg.metadata?.type === 'interview') {
          messageType = 'interview';
        } else if (msg.metadata?.type === 'attachment') {
          messageType = 'attachment';
        } else if (msg.metadata?.type === 'optimization_result') {
          messageType = 'optimization_result' as any;
        }

        const time = formatTime(msg.createdAt);

        return {
          key: msg.id,
          role:
            msg.role === MessageRole.ASSISTANT
              ? MessageRole.ASSISTANT
              : MessageRole.USER,
          content: msg.content,
          type: messageType,
          header: time,
          jobData: msg.metadata?.jobData as Job | undefined,
          optimizationId: msg.metadata?.optimizationId as string | undefined,
          optimizedMarkdown: msg.metadata?.optimizedMarkdown as
            | string
            | undefined,
          suggestions: msg.metadata?.suggestions as
            | MessageItem['suggestions']
            | undefined,
          interviewQuestions: msg.metadata?.interviewQuestions as
            | InterviewQuestion[]
            | undefined,
          attachmentStatus: msg.metadata?.attachmentStatus as
            | AttachmentStatus
            | undefined,
        };
      });
    }

    // Filter out local items that have been "promoted" to real messages
    const activeLocalItems = localItems.filter((local) => {
      const isPromoted = mappedItems.some((remote) => remote.key === local.key);
      if (!isPromoted) return true;
      return local.attachmentStatus?.status !== 'completed';
    });

    const itemMap = new Map<string, MessageItem>();

    // Add welcome message
    const welcomeMsg: MessageItem = {
      key: 'welcome',
      role: MessageRole.ASSISTANT,
      content: t('chat.welcome'),
      type: 'text',
    };
    itemMap.set(welcomeMsg.key, welcomeMsg);

    // Add remote items
    mappedItems.forEach((item) => {
      itemMap.set(item.key, item);
    });

    // Add/Overwrite with local items
    activeLocalItems.forEach((item) => {
      itemMap.set(item.key, item);
    });

    const displayItems: MessageItem[] = Array.from(itemMap.values());

    if (isStreaming && streamingContent) {
      const lastPersistedAssistantMessage = [...mappedItems]
        .reverse()
        .find((m) => m.role === MessageRole.ASSISTANT);

      const isAlreadyPersisted =
        lastPersistedAssistantMessage &&
        (lastPersistedAssistantMessage.content.includes(streamingContent) ||
          (lastPersistedAssistantMessage.type === 'optimization_result' &&
            lastPersistedAssistantMessage.content.length > 0));

      if (!isAlreadyPersisted) {
        // Detect sections and add tips
        const sections = [
          {
            key: '基本信息',
            tip: '✅ 已优化基本信息，增强了个人联系方式的排版',
          },
          { key: '专业总结', tip: '✅ 已优化专业总结，提升了核心竞争力的表达' },
          {
            key: '工作经历',
            tip: '✅ 已优化工作经历，强化了量化成果和技术关键词',
          },
          { key: '教育背景', tip: '✅ 已优化教育背景，整理了学术成就和荣誉' },
          {
            key: '项目经验',
            tip: '✅ 已优化项目经验，突出了个人在项目中的核心贡献',
          },
          {
            key: '技能列表',
            tip: '✅ 已优化技能列表，按专业类别进行了结构化分类',
          },
        ];

        let displayContent = streamingContent;
        const activeTips: string[] = [];

        sections.forEach((section) => {
          if (streamingContent.includes(section.key)) {
            activeTips.push(section.tip);
          }
        });

        if (activeTips.length > 0) {
          displayContent += '\n\n---\n' + activeTips.join('\n');
        }

        displayItems.push({
          key: 'streaming-optimization',
          role: MessageRole.ASSISTANT,
          content: displayContent,
          type: 'text',
        });
      }
    }

    return displayItems;
  }, [messages, localItems, streamingContent, isStreaming, t]);

  return items;
};
