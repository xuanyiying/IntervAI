import { AIService } from '@/modules/ai/services/ai.service';
import { AI_EMBEDDING_MODEL } from '@/modules/ai/constants/models';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

export interface RadarEntry {
  dimension: string;
  label: string;
  score: number;
}

export interface MatchGap {
  area: string;
  expectation: string;
  reality: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MatchAnalysisResult {
  analysis: string;
  overallScore: number;
  confidence: string;
  radar: RadarEntry[];
  breakdown: {
    skills: {
      score: number;
      matched: string[];
      missing: string[];
      partial: string[];
    };
    experience: {
      score: number;
      yearsRequired?: number;
      yearsCandidate?: number;
      relevantExperience: string[];
    };
    education: {
      score: number;
      requirements: string[];
      candidateEducation: string[];
      gap: string[];
    };
    softSkills: {
      score: number;
      required: string[];
      evidenced: string[];
      gap: string[];
    };
    hiddenRequirements: {
      score: number;
      identified: string[];
      aligned: string[];
      risk: string[];
    };
    development: {
      score: number;
      signals: string[];
      trajectory: string;
      fitForRole: string;
    };
  };
  gaps: MatchGap[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  interviewFocus: string[];
  learningPath?: Array<{
    skill: string;
    resources: string[];
    estimatedTime: string;
  }>;
}

const RADAR_DIMENSIONS = [
  'skills',
  'experience',
  'education',
  'softSkills',
  'hiddenRequirements',
  'development',
] as const;

@Injectable()
export class MatchAnalysisService {
  private readonly logger = new Logger(MatchAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService
  ) {}

  async analyzeMatch(
    resumeId: string,
    jobId: string,
    userId: string
  ): Promise<MatchAnalysisResult> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: { optimizations: { where: { jobId }, take: 1 } },
    });

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!resume || !job) {
      throw new Error('Resume or Job not found');
    }

    const resumeText = resume.extractedText || '';
    const jobDescription = job.jobDescription || '';

    const matchResult = await this.aiService.executeSkill(
      'jd-matcher',
      {
        resumeText,
        jobDescription,
        matchDepth: 'detailed',
      },
      userId
    );

    const matchData =
      matchResult.success && matchResult.data ? (matchResult.data as any) : {};

    const result = this.normalizeResult(matchData);

    // Blend the LLM score with an embedding similarity as a sanity calibration.
    try {
      const resumeEmbedding = await this.aiService.embed(
        AI_EMBEDDING_MODEL,
        resumeText
      );
      const jobEmbedding = await this.aiService.embed(
        AI_EMBEDDING_MODEL,
        jobDescription
      );
      const similarity = this.cosineSimilarity(resumeEmbedding, jobEmbedding);
      result.overallScore = Math.round(
        result.overallScore * 0.7 + similarity * 100 * 0.3
      );
    } catch (error) {
      this.logger.warn(`Embedding calculation failed: ${error}`);
    }

    const missingSkills = result.breakdown.skills.missing.map((skill) => ({
      skill,
      importance: 0.7,
    }));
    result.learningPath = this.generateLearningPath(missingSkills);

    return result;
  }

  private normalizeResult(data: Record<string, any>): MatchAnalysisResult {
    const breakdown = data.breakdown || {};
    const scoreOf = (key: string, fallback = 50): number => {
      const value = Number(breakdown[key]?.score);
      return Number.isFinite(value)
        ? Math.max(0, Math.min(100, Math.round(value)))
        : fallback;
    };

    const overallScore = Number.isFinite(Number(data.overallScore))
      ? Math.max(0, Math.min(100, Math.round(Number(data.overallScore))))
      : scoreOf('skills');

    const radar: RadarEntry[] = RADAR_DIMENSIONS.map((dimension) => {
      const entry = Array.isArray(data.radar)
        ? data.radar.find((r: any) => r?.dimension === dimension)
        : null;
      return {
        dimension,
        label: entry?.label || dimension,
        score: Number.isFinite(Number(entry?.score))
          ? Math.max(0, Math.min(100, Math.round(Number(entry.score))))
          : scoreOf(dimension),
      };
    });

    const gaps: MatchGap[] = (Array.isArray(data.gaps) ? data.gaps : [])
      .filter((g: any) => g && (g.expectation || g.reality))
      .map((g: any) => ({
        area: String(g.area ?? ''),
        expectation: String(g.expectation ?? ''),
        reality: String(g.reality ?? ''),
        severity: ['high', 'medium', 'low'].includes(g.severity)
          ? g.severity
          : 'medium',
        suggestion: String(g.suggestion ?? ''),
      }))
      .sort(
        (a: MatchGap, b: MatchGap) =>
          severityRank(a.severity) - severityRank(b.severity)
      );

    return {
      analysis: String(data.analysis ?? ''),
      overallScore,
      confidence: String(data.confidence ?? 'medium'),
      radar,
      breakdown: {
        skills: {
          score: scoreOf('skills'),
          matched: toStringArray(breakdown.skills?.matched),
          missing: toStringArray(breakdown.skills?.missing),
          partial: toStringArray(breakdown.skills?.partial),
        },
        experience: {
          score: scoreOf('experience'),
          yearsRequired: toNumber(breakdown.experience?.yearsRequired),
          yearsCandidate: toNumber(breakdown.experience?.yearsCandidate),
          relevantExperience: toStringArray(
            breakdown.experience?.relevantExperience
          ),
        },
        education: {
          score: scoreOf('education'),
          requirements: toStringArray(breakdown.education?.requirements),
          candidateEducation: toStringArray(
            breakdown.education?.candidateEducation
          ),
          gap: toStringArray(breakdown.education?.gap),
        },
        softSkills: {
          score: scoreOf('softSkills'),
          required: toStringArray(breakdown.softSkills?.required),
          evidenced: toStringArray(breakdown.softSkills?.evidenced),
          gap: toStringArray(breakdown.softSkills?.gap),
        },
        hiddenRequirements: {
          score: scoreOf('hiddenRequirements'),
          identified: toStringArray(breakdown.hiddenRequirements?.identified),
          aligned: toStringArray(breakdown.hiddenRequirements?.aligned),
          risk: toStringArray(breakdown.hiddenRequirements?.risk),
        },
        development: {
          score: scoreOf('development'),
          signals: toStringArray(breakdown.development?.signals),
          trajectory: String(breakdown.development?.trajectory ?? ''),
          fitForRole: String(breakdown.development?.fitForRole ?? ''),
        },
      },
      gaps,
      strengths: toStringArray(data.strengths),
      concerns: toStringArray(data.concerns),
      recommendations: toStringArray(data.recommendations),
      interviewFocus: toStringArray(data.interviewFocus),
    };
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateLearningPath(
    missingSkills: Array<{ skill: string; importance: number }>
  ): MatchAnalysisResult['learningPath'] {
    return missingSkills.slice(0, 5).map(({ skill }) => ({
      skill,
      resources: [
        `${skill} 官方文档`,
        `${skill} 系统教程与实践练习`,
        `使用 ${skill} 完成一个小型实战项目`,
      ],
      estimatedTime: '2-4 周',
    }));
  }
}

function severityRank(severity: MatchGap['severity']): number {
  return severity === 'high' ? 0 : severity === 'medium' ? 1 : 2;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function toNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
