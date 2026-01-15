import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConversationStore } from './conversationStore';
import { conversationService } from '../services/conversation-service';

// Mock conversationService
vi.mock('../services/conversation-service', () => ({
  conversationService: {
    deleteConversation: vi.fn(),
  },
}));

describe('useConversationStore - deleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = useConversationStore.getState();
    store.clearMessages();
    store.setCurrentConversation(null);
    // Reset internal state
    useConversationStore.setState({
      conversations: [],
      currentConversation: null,
      messages: [],
    });
  });

  it('should delete a conversation and update the list', async () => {
    const { result } = renderHook(() => useConversationStore());

    const conversation1 = {
      id: 'c1',
      title: 'Chat 1',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };
    const conversation2 = {
      id: 'c2',
      title: 'Chat 2',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };

    // Setup initial state
    act(() => {
      useConversationStore.setState({
        conversations: [conversation1, conversation2],
      });
    });

    // Mock successful deletion
    (conversationService.deleteConversation as any).mockResolvedValue(
      undefined
    );

    await act(async () => {
      await result.current.deleteConversation('c1');
    });

    expect(conversationService.deleteConversation).toHaveBeenCalledWith('c1');
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].id).toBe('c2');
  });

  it('should clear currentConversation if the active conversation is deleted', async () => {
    const { result } = renderHook(() => useConversationStore());

    const conversation1 = {
      id: 'c1',
      title: 'Chat 1',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };
    const conversation2 = {
      id: 'c2',
      title: 'Chat 2',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };

    // Setup initial state with active conversation
    act(() => {
      useConversationStore.setState({
        conversations: [conversation1, conversation2],
        currentConversation: conversation1,
        messages: [
          {
            id: 'm1',
            content: 'hello',
            role: 'user',
            conversationId: 'c1',
            userId: 'u1',
            createdAt: '',
          } as any,
        ],
      });
    });

    // Mock successful deletion
    (conversationService.deleteConversation as any).mockResolvedValue(
      undefined
    );

    await act(async () => {
      await result.current.deleteConversation('c1');
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.currentConversation).toBeNull();
    expect(result.current.messages).toHaveLength(0);
  });

  it('should NOT clear currentConversation if an inactive conversation is deleted', async () => {
    const { result } = renderHook(() => useConversationStore());

    const conversation1 = {
      id: 'c1',
      title: 'Chat 1',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };
    const conversation2 = {
      id: 'c2',
      title: 'Chat 2',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };

    // Setup initial state with active conversation2
    act(() => {
      useConversationStore.setState({
        conversations: [conversation1, conversation2],
        currentConversation: conversation2,
        messages: [
          {
            id: 'm2',
            content: 'hi',
            role: 'user',
            conversationId: 'c2',
            userId: 'u1',
            createdAt: '',
          } as any,
        ],
      });
    });

    // Mock successful deletion
    (conversationService.deleteConversation as any).mockResolvedValue(
      undefined
    );

    await act(async () => {
      await result.current.deleteConversation('c1');
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.currentConversation).toEqual(conversation2);
    expect(result.current.messages).toHaveLength(1);
  });

  it('should handle deletion errors', async () => {
    const { result } = renderHook(() => useConversationStore());

    // Mock failed deletion
    const error = new Error('Network error');
    (conversationService.deleteConversation as any).mockRejectedValue(error);

    await act(async () => {
      try {
        await result.current.deleteConversation('c1');
      } catch (e) {
        // Expected error
      }
    });

    // The store uses error.message if available
    expect(result.current.conversationError).toBe('Network error');
  });
});
