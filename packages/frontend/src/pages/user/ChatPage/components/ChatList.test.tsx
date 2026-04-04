import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatList } from './ChatList';
import { MessageRole, type MessageItem } from '../../../types';

vi.mock('@ant-design/x', () => ({
  Bubble: {
    List: ({ items }: any) =>
      React.createElement(
        'div',
        null,
        items.map((item: any) =>
          React.createElement('div', { key: item.key }, item.content)
        )
      ),
  },
}));

function makeItems(n: number): MessageItem[] {
  return Array.from({ length: n }).map((_, i) => ({
    key: `k${i}`,
    role: i % 2 === 0 ? MessageRole.USER : MessageRole.ASSISTANT,
    header: `#${i}`,
    content: `msg ${i}`,
    type: 'text',
  })) as MessageItem[];
}

describe('ChatList virtualization', () => {
  it('renders only a window of items', async () => {
    const items = makeItems(200);
    render(
      <ChatList
        items={items}
        isLoading={false}
        messageError={null}
        hasMoreMessages={false}
        isStreaming={false}
        onLoadMore={() => {}}
        onRetryLoad={() => {}}
        contentHandlers={{}}
      />
    );
    const bubbles = await screen.findAllByText(/msg \d+/);
    // Expect fewer than total items due to windowing
    expect(bubbles.length).toBeLessThan(200);
    expect(bubbles.length).toBeGreaterThan(20);
  });
});
