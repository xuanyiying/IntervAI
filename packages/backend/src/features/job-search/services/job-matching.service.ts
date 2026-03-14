import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@/core/ai/ai.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { UserProfile, JobPosting, JobMatch } from '../interfaces/job-search.interface';

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService
  ) { }

  async matchJobsForUser(
    userId: string,
    userProfile: UserProfile,
    jobs: JobPosting[]
  ): Promise<JobMatch[]> {
    this.logger.log(`Starting job matching process for user: ${userId}`);

    const matcherResult = await this.aiService.executeSkill(
      'jd-matcher',
      {
        jobs,
        userProfile,
      },
      userId
    );

    const matches: any[] = [];
    if (matcherResult.success && matcherResult.data) {
      const data = matcherResult.data as any;
      if (Array.isArray(data)) {
        matches.push(...data);
      } else if (data.matches) {
        matches.push(...data.matches);
      }
    }

    this.logger.log(`Generated ${matches.length} matches for user: ${userId}`);

    const savedMatches: JobMatch[] = [];

    for (const match of matches) {
      try {
        const saved = await this.saveMatch(userId, match);
        savedMatches.push({
          ...match,
          id: saved.id,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to save match for job ${match.jobId}: ${errorMessage}`);
      }
    }

    return savedMatches;
  }

  private async saveMatch(userId: string, match: JobMatch) {
    return this.prisma.jobMatch.upsert({
      where: {
        userId_jobId: { userId, jobId: match.jobId },
      },
      create: {
        userId,
        jobId: match.jobId,
        matchScore: match.matchScore,
        semanticScore: match.semanticScore || 0,
        skillMatchScore: match.skillMatchScore || 0,
        preferenceScore: match.preferenceScore || 0,
        temporalScore: match.temporalScore || 0,
        matchedSkills: match.matchedSkills || [],
        missingSkills: match.missingSkills || [],
        skillGaps: match.skillGaps ? JSON.parse(JSON.stringify(match.skillGaps)) : undefined,
        strengths: match.strengths || [],
        concerns: match.concerns || [],
        recommendations: match.recommendations || [],
        matchReasons: match.matchReasons || [],
      },
      update: {
        matchScore: match.matchScore,
        semanticScore: match.semanticScore || 0,
        skillMatchScore: match.skillMatchScore || 0,
        preferenceScore: match.preferenceScore || 0,
        temporalScore: match.temporalScore || 0,
        matchedSkills: match.matchedSkills || [],
        missingSkills: match.missingSkills || [],
        skillGaps: match.skillGaps ? JSON.parse(JSON.stringify(match.skillGaps)) : undefined,
        strengths: match.strengths || [],
        concerns: match.concerns || [],
        recommendations: match.recommendations || [],
        matchReasons: match.matchReasons || [],
      },
    });
  }

  async getMatchesForUser(params: {
    userId: string;
    minScore?: number;
    skip?: number;
    take?: number;
  }): Promise<JobMatch[]> {
    const matches = await this.prisma.jobMatch.findMany({
      skip: params.skip,
      take: params.take,
      where: {
        userId: params.userId,
        ...(params.minScore !== undefined ? { matchScore: { gte: params.minScore } } : {}),
      },
      include: { job: true },
      orderBy: { matchScore: 'desc' },
    });

    return matches.map((m) => this.mapPrismaMatchToInterface(m));
  }

  async getTopMatches(userId: string, limit: number = 10): Promise<JobMatch[]> {
    return this.getMatchesForUser({
      userId,
      minScore: 60,
      take: limit,
    });
  }

  private mapPrismaMatchToInterface(match: any): JobMatch {
    return {
      id: match.id,
      jobId: match.jobId,
      userId: match.userId,
      matchScore: match.matchScore,
      semanticScore: match.semanticScore || 0,
      skillMatchScore: match.skillMatchScore || 0,
      preferenceScore: match.preferenceScore || 0,
      temporalScore: match.temporalScore || 0,
      matchedSkills: match.matchedSkills || [],
      missingSkills: match.missingSkills || [],
      skillGaps: match.skillGaps || undefined,
      strengths: match.strengths || [],
      concerns: match.concerns || [],
      recommendations: match.recommendations || [],
      matchReasons: match.matchReasons || [],
      job: match.job,
      createdAt: match.createdAt,
    };
  }
}
