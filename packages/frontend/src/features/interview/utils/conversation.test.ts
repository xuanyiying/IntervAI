import { MessageRole, type InterviewMessage } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import {
  createLocalTurn,
  fromReportTranscript,
  fromSessionMessages,
  mergeConversationTurns,
  toConversationRole,
} from './conversation';

const message = (
  overrides: Partial<InterviewMessage> = {}
): InterviewMessage => ({
  id: 'm1',
  sessionId: 's1',
  role: MessageRole.USER,
  content: '我的回答',
  createdAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
});

describe('toConversationRole', () => {
  it('maps persisted roles and Chinese report labels', () => {
    expect(toConversationRole(MessageRole.USER)).toBe('user');
    expect(toConversationRole(MessageRole.ASSISTANT)).toBe('assistant');
    expect(toConversationRole(MessageRole.SYSTEM)).toBe('system');
    expect(toConversationRole('候选人')).toBe('user');
    expect(toConversationRole('面试官')).toBe('assistant');
  });
});

describe('fromSessionMessages', () => {
  it('keeps timestamps and audio, strips evaluation payloads and blanks', () => {
    const turns = fromSessionMessages([
      message({
        content: '<!--EVAL_JSON:{"score":90}-->\n  回答内容  ',
        audioUrl: 'https://example.test/a.webm',
      }),
      message({ id: 'm2', content: '<!--EVAL_JSON:{}-->' }),
      message({ id: 'm3', role: MessageRole.SYSTEM, content: '系统提示' }),
    ]);

    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({
      role: 'user',
      content: '回答内容',
      audioUrl: 'https://example.test/a.webm',
      createdAt: '2026-01-01T10:00:00.000Z',
      origin: 'session',
    });
    expect(turns[1].role).toBe('system');
  });
});

describe('fromReportTranscript', () => {
  it('maps transcript entries with timestamps', () => {
    const turns = fromReportTranscript([
      {
        role: '面试官',
        content: '请自我介绍',
        timestamp: '2026-01-01T10:00:00.000Z',
      },
      {
        role: '候选人',
        content: '我有五年经验',
        timestamp: '2026-01-01T10:01:00.000Z',
      },
    ]);
    expect(turns.map((t) => t.role)).toEqual(['assistant', 'user']);
    expect(turns[0].origin).toBe('report');
  });
});

describe('mergeConversationTurns', () => {
  it('de-duplicates the same turn across session, report and local sources', () => {
    const persisted = fromSessionMessages([
      message({ id: 'm1', role: MessageRole.ASSISTANT, content: '请自我介绍' }),
    ]);
    const report = fromReportTranscript([
      {
        role: '面试官',
        content: '请自我介绍',
        timestamp: '2026-01-01T10:00:00.000Z',
      },
      {
        role: '候选人',
        content: '报告里的回答',
        timestamp: '2026-01-01T10:01:00.000Z',
      },
    ]);
    const local = [createLocalTurn('user', '报告里的回答')];

    const merged = mergeConversationTurns(persisted, report, local);

    expect(merged).toHaveLength(2);
    expect(merged[0].origin).toBe('session');
    expect(merged[1].origin).toBe('report');
    expect(merged[0].content).toBe('请自我介绍');
  });

  it('sorts by timestamp and keeps timestamp-less turns last', () => {
    const merged = mergeConversationTurns(
      [createLocalTurn('user', '刚刚发送')],
      fromReportTranscript([
        {
          role: '面试官',
          content: '早先的问题',
          timestamp: '2026-01-01T09:00:00.000Z',
        },
      ])
    );
    expect(merged.map((t) => t.content)).toEqual(['早先的问题', '刚刚发送']);
  });
});
