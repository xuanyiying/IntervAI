import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { conversationService } from '../services/conversation-service';
import { Conversation, Message, MessageRole } from '../types';

interface ConversationState {
  // ... existing state fields ...
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;
  conversationError: string | null;

  // Messages
  messages: Message[];
  isLoadingMessages: boolean;
  messageError: string | null;
  hasMoreMessages: boolean;
  messagePage: number;

  // Actions - Conversations
  createConversation: (title?: string) => Promise<Conversation>;
  loadConversations: () => Promise<void>;
  switchConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (
    conversationId: string,
    title: string
  ) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;

  // Actions - Messages
  loadMessages: (conversationId: string, page?: number, limit?: number) => Promise<void>;
  loadMoreMessages: (conversationId: string, limit?: number) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    role?: MessageRole,
    metadata?: Record<string, unknown>
  ) => Promise<Message>;
  addMessageToState: (message: Message) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      currentConversation: null,
      isLoadingConversations: false,
      conversationError: null,
      messages: [],
      isLoadingMessages: false,
      messageError: null,
      hasMoreMessages: true,
      messagePage: 0,

      // Conversation actions
      createConversation: async (title?: string) => {
        try {
          set({ conversationError: null });
          const conversation = await conversationService.createConversation({
            title,
          });
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            currentConversation: conversation,
            messages: [],
          }));
          return conversation;
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '创建会话失败';
          set({ conversationError: errorMessage });
          throw error;
        }
      },

      loadConversations: async () => {
        try {
          set({ isLoadingConversations: true, conversationError: null });
          const conversations = await conversationService.listConversations();
          set({ conversations, isLoadingConversations: false });
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '加载会话列表失败';
          set({ conversationError: errorMessage, isLoadingConversations: false });
          throw error;
        }
      },

      switchConversation: async (conversationId: string) => {
        try {
          set({ messageError: null, isLoadingMessages: true });
          const conversation =
            await conversationService.getConversation(conversationId);
          const messages = await conversationService.getMessages(conversationId);
          set({
            currentConversation: conversation,
            messages,
            isLoadingMessages: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '切换会话失败';
          set({ messageError: errorMessage, isLoadingMessages: false });
          throw error;
        }
      },

      updateConversationTitle: async (conversationId: string, title: string) => {
        try {
          set({ conversationError: null });
          const updated = await conversationService.updateConversation(
            conversationId,
            { title }
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? updated : c
            ),
            currentConversation:
              state.currentConversation?.id === conversationId
                ? updated
                : state.currentConversation,
          }));
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '更新标题失败';
          set({ conversationError: errorMessage });
          throw error;
        }
      },

      deleteConversation: async (conversationId: string) => {
        try {
          set({ conversationError: null });
          await conversationService.deleteConversation(conversationId);
          set((state) => {
            const updatedConversations = state.conversations.filter(
              (c) => c.id !== conversationId
            );
            const isCurrentDeleted =
              state.currentConversation?.id === conversationId;
            return {
              conversations: updatedConversations,
              currentConversation: isCurrentDeleted
                ? null
                : state.currentConversation,
              messages: isCurrentDeleted ? [] : state.messages,
            };
          });
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '删除会话失败';
          set({ conversationError: errorMessage });
          throw error;
        }
      },

      setCurrentConversation: (conversation: Conversation | null) => {
        set({ currentConversation: conversation, messages: [] });
      },

      // Message actions
      loadMessages: async (conversationId: string, page = 0, limit = 20) => {
        try {
          set({ messageError: null, isLoadingMessages: true });
          const skip = page * limit;
          const messages = await conversationService.getMessages(conversationId, skip, limit);
          
          // Sort messages by timestamp or createdAt to ensure correct order
          const sortedMessages = [...messages].sort((a, b) => {
            const timeA = a.timestamp || new Date(a.createdAt).getTime();
            const timeB = b.timestamp || new Date(b.createdAt).getTime();
            return timeA - timeB;
          });

          set({ 
            messages: sortedMessages, 
            isLoadingMessages: false,
            messagePage: page,
            hasMoreMessages: messages.length === limit
          });
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '加载消息失败';
          set({ messageError: errorMessage, isLoadingMessages: false });
          throw error;
        }
      },

      loadMoreMessages: async (conversationId: string, limit = 20) => {
        const { messagePage, messages, hasMoreMessages, isLoadingMessages } = get();
        if (!hasMoreMessages || isLoadingMessages) return;

        try {
          set({ isLoadingMessages: true });
          const nextPage = messagePage + 1;
          const skip = nextPage * limit;
          const newMessages = await conversationService.getMessages(conversationId, skip, limit);
          
          const allMessages = [...messages, ...newMessages].sort((a, b) => {
            const timeA = a.timestamp || new Date(a.createdAt).getTime();
            const timeB = b.timestamp || new Date(b.createdAt).getTime();
            return timeA - timeB;
          });

          set({
            messages: allMessages,
            isLoadingMessages: false,
            messagePage: nextPage,
            hasMoreMessages: newMessages.length === limit
          });
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '加载更多消息失败';
          set({ messageError: errorMessage, isLoadingMessages: false });
          throw error;
        }
      },

      sendMessage: async (
        conversationId: string,
        content: string,
        role: MessageRole = MessageRole.USER,
        metadata?: Record<string, unknown>
      ) => {
        try {
          set({ messageError: null });
          const message = await conversationService.addMessage(conversationId, {
            role,
            content,
            metadata,
          });
          set((state) => {
            const newMessages = [...state.messages, message].sort((a, b) => {
              const timeA = a.timestamp || new Date(a.createdAt).getTime();
              const timeB = b.timestamp || new Date(b.createdAt).getTime();
              return timeA - timeB;
            });
            return {
              messages: newMessages,
              currentConversation: state.currentConversation
                ? {
                    ...state.currentConversation,
                    messageCount: state.currentConversation.messageCount + 1,
                    lastMessageAt: new Date().toISOString(),
                  }
                : null,
            };
          });
          return message;
        } catch (error: any) {
          const errorMessage = error.response?.status === 401 || error.response?.status === 403
            ? '登录已过期，请重新登录'
            : error.message || '发送消息失败';
          set({ messageError: errorMessage });
          throw error;
        }
      },

      addMessageToState: (message: Message) => {
        set((state) => {
          // Check if message already exists to avoid duplicates
          if (state.messages.some((m) => m.id === message.id)) {
            return state;
          }
          const newMessages = [...state.messages, message].sort((a, b) => {
            const timeA = a.timestamp || new Date(a.createdAt).getTime();
            const timeB = b.timestamp || new Date(b.createdAt).getTime();
            return timeA - timeB;
          });
          return {
            messages: newMessages,
          };
        });
      },

      clearMessages: () => {
        set({ messages: [] });
      },
    }),
    {
      name: 'conversation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
        messages: state.messages,
      }),
    }
  )
);

