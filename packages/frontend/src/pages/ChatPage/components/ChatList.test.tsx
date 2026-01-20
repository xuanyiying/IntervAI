import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatList } from './ChatList';
import { MessageRole, type MessageItem } from '../../../types';

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
