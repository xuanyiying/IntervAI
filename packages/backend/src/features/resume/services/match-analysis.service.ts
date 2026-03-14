import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIService } from '@/core/ai/ai.service';
import { Models } from '@/core/ai/models';

export interface MatchAnalysisResult {
  overallScore: number;
  skillMatch: {
    matched: Array<{ skill: string; relevance: number }>;
    missing: Array<{ skill: string; importance: number }>;
    additional: Array<{ skill: string; value: number }>;
  };
  experienceMatch: {
    score: number;
    gaps: string[];
    highlights: string[];
  };
  educationMatch: {
    score: number;
    meets: boolean;
    notes: string;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    impact: string;
  }>;
  learningPath?: Array<{
    skill: string;
    resources: string[];
    estimatedTime: string;
  }>;
}

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

    const matchResult = await this.aiService.executeSkill(
      'jd-matcher',
      {
        resumeText: resume.extractedText || '',
        jobDescription: job.jobDescription,
      },
      userId
    );

    const resumeText = resume.extractedText || '';
    const jobDescription = job.jobDescription || '';

    let overallScore = 50;
    const matchData = matchResult.success && matchResult.data ? (matchResult.data as any) : {};

    if (matchData.overallScore !== undefined) {
      overallScore = matchData.overallScore;
    } else if (matchData.breakdown?.skills?.score !== undefined) {
      overallScore = matchData.breakdown.skills.score;
    }

    try {
      const resumeEmbedding = await this.aiService.embed(Models.Embedding, resumeText);
      const jobEmbedding = await this.aiService.embed(Models.Embedding, jobDescription);
      const similarity = this.cosineSimilarity(resumeEmbedding, jobEmbedding);
      overallScore = Math.round(overallScore * 0.7 + similarity * 100 * 0.3);
    } catch (error) {
      this.logger.warn(`Embedding calculation failed: ${error}`);
    }

    const skillsMatch = matchData.breakdown?.skills || {};
    const skillMatch = {
      matched: (skillsMatch.matched || []).map((skill: string) => ({
        skill,
        relevance: 0.85,
      })),
      missing: (skillsMatch.missing || []).map((skill: string) => ({
        skill,
        importance: 0.7,
      })),
      additional: (skillsMatch.partial || []).map((skill: string) => ({
        skill,
        value: 0.6,
      })),
    };

    const experienceMatch = matchData.breakdown?.experience || { score: 50 };
    const educationMatch = matchData.breakdown?.education || { score: 50, meets: true };

    const recommendations = await this.generateRecommendations(
      skillMatch,
      experienceMatch,
      educationMatch,
      overallScore
    );

    const learningPath = await this.generateLearningPath(skillMatch.missing);

    return {
      overallScore,
      skillMatch,
      experienceMatch: {
        score: experienceMatch.score || 50,
        gaps: [],
        highlights: experienceMatch.relevantExperience || [],
      },
      educationMatch: {
        score: educationMatch.score || 50,
        meets: educationMatch.score >= 50,
        notes: educationMatch.gap?.join(', ') || '',
      },
      recommendations,
      learningPath,
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

  private async generateRecommendations(
    skillMatch: MatchAnalysisResult['skillMatch'],
    experienceMatch: any,
    educationMatch: any,
    overallScore: number
  ): Promise<MatchAnalysisResult['recommendations']> {
    const recommendations: MatchAnalysisResult['recommendations'] = [];

    if (skillMatch.missing.length > 0) {
      const topMissing = skillMatch.missing.slice(0, 3);
      recommendations.push({
        priority: 'high',
        category: 'Skills',
        suggestion: `Focus on learning: ${topMissing.map((s) => s.skill).join(', ')}`,
        impact: 'High impact on job match score',
      });
    }

    if ((experienceMatch.score || 50) < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'Experience',
        suggestion: 'Highlight relevant projects that demonstrate required skills',
        impact: 'Medium impact on candidate appeal',
      });
    }

    if (overallScore < 60) {
      recommendations.push({
        priority: 'high',
        category: 'Overall',
        suggestion: 'Consider positions that better match your current skill set',
        impact: 'Improves application success rate',
      });
    }

    return recommendations;
  }

  private async generateLearningPath(
    missingSkills: Array<{ skill: string; importance: number }>
  ): Promise<MatchAnalysisResult['learningPath']> {
    return missingSkills.slice(0, 5).map((skill) => ({
      skill: skill.skill,
      resources: [
        `Official ${skill.skill} documentation`,
        `${skill.skill} tutorials on YouTube`,
        `Practice projects using ${skill.skill}`,
      ],
      estimatedTime: `${Math.ceil(skill.importance * 4)} weeks`,
    }));
  }
}
