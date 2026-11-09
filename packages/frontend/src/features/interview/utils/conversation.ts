import type { InterviewReport } from '@/features/interview/api/interview-service';
import type { InterviewMessage } from '@/shared/types';

/**
 * One rendered turn in an interview conversation.
 *
 * Both mock and assist modes share this model so that messages restored from
 * `GET /interview/session/:id`, the report transcript and optimistic local
 * messages can be rendered by the same list component.
 */
export type ConversationRole = 'user' | 'assistant' | 'system';

export type ConversationOrigin = 'session' | 'report' | 'local';

export interface ConversationTurn {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt?: string;
  /** Optional short context shown next to the role, e.g. "Question 3". */
  label?: string;
  audioUrl?: string;
  score?: number;
  origin: ConversationOrigin;
}

/** Backend embeds evaluation JSON in message content; never show it to users. */
const EVAL_JSON_COMMENT = /<!--EVAL_JSON:[\s\S]*?-->/g;

const cleanContent = (content: string | null | undefined): string =>
  (content ?? '').replace(EVAL_JSON_COMMENT, '').trim();

const normalizeContent = (content: string): string =>
  cleanContent(content).replace(/\s+/g, ' ');

/**
 * Backend roles: `USER` / `ASSISTANT` / `SYSTEM` on InterviewMessage, and the
 * Chinese labels `候选人` / `面试官` on report transcripts.
 */
export const toConversationRole = (role: string): ConversationRole => {
  const value = String(role ?? '').toUpperCase();
  if (
    value === 'USER' ||
    value === 'CANDIDATE' ||
    value === 'SELF' ||
    role === '候选人'
  ) {
    return 'user';
  }
  if (value === 'SYSTEM' || role === '系统') {
    return 'system';
  }
  return 'assistant';
};

/** Map persisted session messages into renderable turns. */
export const fromSessionMessages = (
  messages: InterviewMessage[] = []
): ConversationTurn[] =>
  messages
    .map((message) => ({
      id: `session:${message.id}`,
      role: toConversationRole(message.role),
      content: cleanContent(message.content),
      createdAt: message.createdAt,
      audioUrl: message.audioUrl,
      origin: 'session' as const,
    }))
    .filter((turn) => turn.content.length > 0);

/** Map a generated report transcript into renderable turns (history fallback). */
export const fromReportTranscript = (
  transcript: InterviewReport['transcript'] = []
): ConversationTurn[] =>
  transcript
    .map((entry, index) => ({
      id: `report:${entry.timestamp ?? index}:${index}`,
      role: toConversationRole(entry.role),
      content: cleanContent(entry.content),
      createdAt: entry.timestamp,
      origin: 'report' as const,
    }))
    .filter((turn) => turn.content.length > 0);

/** Build an optimistic turn for a message that is not persisted yet. */
export const createLocalTurn = (
  role: ConversationRole,
  content: string,
  extra: Partial<Pick<ConversationTurn, 'label' | 'score' | 'audioUrl'>> = {}
): ConversationTurn => ({
  id: `local:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
  role,
  content: cleanContent(content),
  createdAt: new Date().toISOString(),
  origin: 'local',
  ...extra,
});

const turnKey = (turn: ConversationTurn): string =>
  `${turn.role}|${normalizeContent(turn.content)}`;

const timeValue = (turn: ConversationTurn): number => {
  if (!turn.createdAt) return Number.NaN;
  const parsed = Date.parse(turn.createdAt);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

/**
 * Merge sources without duplicating turns. `primary` wins; supplemental
 * sources (report transcript, optimistic local messages) only contribute
 * turns that are not already present. The result is ordered by timestamp,
 * with timestamp-less turns kept at the end in their original order.
 */
export const mergeConversationTurns = (
  primary: ConversationTurn[],
  ...supplemental: ConversationTurn[][]
): ConversationTurn[] => {
  const merged = [...primary];
  const seen = new Set(merged.map(turnKey));

  for (const group of supplemental) {
    for (const turn of group) {
      const key = turnKey(turn);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(turn);
    }
  }

  return merged.sort((a, b) => {
    const ta = timeValue(a);
    const tb = timeValue(b);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });
};
