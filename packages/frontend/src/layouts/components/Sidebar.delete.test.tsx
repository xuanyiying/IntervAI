import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Modal } from 'antd';
import Sidebar from './Sidebar';
import { useConversationStore } from '@/stores';
import { Role, SubscriptionTier } from '@/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/stores', async () => {
  const actual = await vi.importActual<typeof import('@/stores')>('@/stores');
  return {
    ...actual,
    useAuthStore: () => ({
      user: {
        id: 'u1',
        email: 'u1@example.com',
        role: Role.USER,
        subscriptionTier: SubscriptionTier.FREE,
        createdAt: new Date().toISOString(),
      },
    }),
    useResumeStore: () => ({
      fetchResumes: vi.fn(),
    }),
  };
});

describe('Sidebar deletion behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    useConversationStore.setState({
      conversations: [],
      currentConversation: null,
      messages: [],
    } as any);
  });

  it('deleting current conversation switches to next remaining one', async () => {
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
    const conversation3 = {
      id: 'c3',
      title: 'Chat 3',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
      messageCount: 0,
    };

    const deleteConversation = vi.fn(async (conversationId: string) => {
      useConversationStore.setState((state: any) => ({
        conversations: state.conversations.filter(
          (c: any) => c.id !== conversationId
        ),
        currentConversation:
          state.currentConversation?.id === conversationId
            ? null
            : state.currentConversation,
      }));
    });

    const switchConversation = vi.fn(async (conversationId: string) => {
      const next = useConversationStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      useConversationStore.setState({
        currentConversation: next ?? null,
      } as any);
    });

    useConversationStore.setState({
      conversations: [conversation1, conversation2, conversation3],
      currentConversation: conversation1,
      deleteConversation,
      switchConversation,
    } as any);

    const confirmSpy = vi
      .spyOn(Modal, 'confirm')
      .mockImplementation((config: any) => {
        config.onOk?.();
        return {} as any;
      });

    const { container } = render(
      <MemoryRouter initialEntries={['/chat']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    const dangerousButtons = Array.from(
      container.querySelectorAll('button.ant-btn-dangerous')
    );
    expect(dangerousButtons.length).toBeGreaterThan(0);

    fireEvent.click(dangerousButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteConversation).toHaveBeenCalledWith('c1');
    });

    await waitFor(() => {
      expect(useConversationStore.getState().conversations).toHaveLength(2);
      expect(switchConversation).toHaveBeenCalledWith('c2');
      expect(useConversationStore.getState().currentConversation?.id).toBe(
        'c2'
      );
    });
  });
});
