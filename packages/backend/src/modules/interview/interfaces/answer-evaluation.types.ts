/**
 * Shared six-dimension answer evaluation contract.
 *
 * Dimensions (with weights used to compute overallScore):
 *  - content              内容质量        20%
 *  - logicalThinking      表达逻辑        20%
 *  - contentMatch         内容匹配度      15%
 *  - jobFit               岗位适配性      20%
 *  - professionalKnowledge 专业知识      15%
 *  - communication        沟通表达        10%
 */

export const EVALUATION_DIMENSIONS = [
  'content',
  'logicalThinking',
  'contentMatch',
  'jobFit',
  'professionalKnowledge',
  'communication',
] as const;

export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];

export const DIMENSION_LABELS_ZH: Record<EvaluationDimension, string> = {
  content: '内容质量',
  logicalThinking: '表达逻辑',
  contentMatch: '内容匹配度',
  jobFit: '岗位适配性',
  professionalKnowledge: '专业知识',
  communication: '沟通表达',
};

export const DIMENSION_WEIGHTS: Record<EvaluationDimension, number> = {
  content: 0.2,
  logicalThinking: 0.2,
  contentMatch: 0.15,
  jobFit: 0.2,
  professionalKnowledge: 0.15,
  communication: 0.1,
};

export interface DimensionScore {
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface AnswerEvaluation {
  overallScore: number | null;
  grade?: string;
  breakdown: Partial<Record<EvaluationDimension, DimensionScore>>;
  feedback: {
    positive: string[];
    improvements: string[];
    redFlags: string[];
  };
  followUpQuestions: string[];
}

const EVAL_JSON_MARKER = /<!--EVAL_JSON:([\s\S]*?)-->/;

/**
 * Extract machine-readable evaluations embedded in assistant messages.
 */
export function extractEvaluations(contents: string[]): AnswerEvaluation[] {
  const evaluations: AnswerEvaluation[] = [];

  for (const content of contents) {
    const match = content.match(EVAL_JSON_MARKER);
    if (!match) {
      continue;
    }
    try {
      evaluations.push(normalizeEvaluation(JSON.parse(match[1])));
    } catch {
      // Ignore malformed evaluation payloads
    }
  }

  return evaluations;
}

export function normalizeEvaluation(data: any): AnswerEvaluation {
  const breakdown: AnswerEvaluation['breakdown'] = {};
  const rawBreakdown = data?.breakdown ?? {};

  for (const dimension of EVALUATION_DIMENSIONS) {
    const raw = rawBreakdown[dimension];
    if (raw && typeof raw === 'object') {
      breakdown[dimension] = {
        score: clampScore(raw.score),
        strengths: toStringArray(raw.strengths),
        weaknesses: toStringArray(raw.weaknesses),
      };
    }
  }

  return {
    overallScore:
      typeof data?.overallScore === 'number'
        ? clampScore(data.overallScore)
        : null,
    grade: typeof data?.grade === 'string' ? data.grade : undefined,
    breakdown,
    feedback: {
      positive: toStringArray(data?.feedback?.positive),
      improvements: toStringArray(data?.feedback?.improvements),
      redFlags: toStringArray(data?.feedback?.redFlags),
    },
    followUpQuestions: toStringArray(data?.followUpQuestions),
  };
}

/**
 * Average the six dimensions across multiple per-question evaluations.
 */
export function aggregateDimensions(
  evaluations: AnswerEvaluation[]
): Record<EvaluationDimension, number> {
  const sums = Object.fromEntries(
    EVALUATION_DIMENSIONS.map((d) => [d, { total: 0, count: 0 }])
  ) as Record<EvaluationDimension, { total: number; count: number }>;

  for (const evaluation of evaluations) {
    for (const dimension of EVALUATION_DIMENSIONS) {
      const score = evaluation.breakdown[dimension]?.score;
      if (typeof score === 'number') {
        sums[dimension].total += score;
        sums[dimension].count += 1;
      }
    }
  }

  const result = Object.fromEntries(
    EVALUATION_DIMENSIONS.map((d) => [
      d,
      sums[d].count > 0
        ? Math.round(sums[d].total / sums[d].count)
        : 50,
    ])
  ) as Record<EvaluationDimension, number>;

  return result;
}

export function weightedOverallScore(
  dimensions: Record<EvaluationDimension, number>
): number {
  return Math.round(
    EVALUATION_DIMENSIONS.reduce(
      (sum, dimension) => sum + dimensions[dimension] * DIMENSION_WEIGHTS[dimension],
      0
    )
  );
}

function clampScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 50;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
