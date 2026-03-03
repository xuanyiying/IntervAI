import { Injectable, Logger } from '@nestjs/common';
import { MatcherAgent } from '../agents/matcher.agent';
import { PrismaService } from '@/shared/database/prisma.service';
import { UserProfile, JobPosting, JobMatch } from '../interfaces/job-search.interface';

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly matcherAgent: MatcherAgent,
    private readonly prisma: PrismaService
  ) { }

  async matchJobsForUser(
    userId: string,
    userProfile: UserProfile,
    jobs: JobPosting[]
  ): Promise<JobMatch[]> {
    this.logger.log(`Starting job matching process for user: ${userId}`);

    const matches = await this.matcherAgent.matchJobs(
      jobs,
      userId,
      userProfile
    );

    this.logger.log(`Generated ${matches.length} matches for user: ${userId}`);

    const savedMatches: JobMatch[] = [];

    for (const match of matches) {
      try {
        const saved = await this.prisma.jobMatch.upsert({
          where: {
            userId_jobId: { userId, jobId: match.jobId },
          },
          create: {
            userId,
            jobId: match.jobId,
            matchScore: match.matchScore,
            semanticScore: match.semanticScore,
            skillMatchScore: match.skillMatchScore,
            preferenceScore: match.preferenceScore,
            temporalScore: match.temporalScore,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            skillGaps: match.skillGaps ? JSON.parse(JSON.stringify(match.skillGaps)) : null,
            strengths: match.strengths,
            concerns: match.concerns,
            recommendations: match.recommendations,
            matchReasons: match.matchReasons,
          },
          update: {
            matchScore: match.matchScore,
            semanticScore: match.semanticScore,
            skillMatchScore: match.skillMatchScore,
            preferenceScore: match.preferenceScore,
            temporalScore: match.temporalScore,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            skillGaps: match.skillGaps ? JSON.parse(JSON.stringify(match.skillGaps)) : null,
            strengths: match.strengths,
            concerns: match.concerns,
            recommendations: match.recommendations,
            matchReasons: match.matchReasons,
          },
        });

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
        ...(params.minScore !== undefined
          ? { matchScore: { gte: params.minScore } }
          : {}),
      },
      include: { job: true },
      orderBy: { matchScore: 'desc' },
    });

    return matches.map((match) => this.mapToJobMatch(match));
  }

  async getMatchById(matchId: string): Promise<JobMatch | null> {
    const match = await this.prisma.jobMatch.findUnique({
      where: { id: matchId },
      include: { job: true },
    });
    return match ? this.mapToJobMatch(match) : null;
  }

  async deleteMatchesForUser(userId: string): Promise<number> {
    const result = await this.prisma.jobMatch.deleteMany({
      where: { userId },
    });
    this.logger.log(`Deleted ${result.count} matches for user: ${userId}`);
    return result.count;
  }

  async getTopMatches(userId: string, limit: number = 10): Promise<JobMatch[]> {
    const matches = await this.prisma.jobMatch.findMany({
      take: limit,
      where: { userId },
      include: { job: true },
      orderBy: { matchScore: 'desc' },
    });

    return matches.map((match) => this.mapToJobMatch(match));
  }

  async getMatchStats(userId: string): Promise<{
    total: number;
    avgScore: number;
    topSkills: string[];
  }> {
    const matches = await this.prisma.jobMatch.findMany({
      where: { userId },
      select: { matchScore: true, matchedSkills: true },
    });

    const total = matches.length;
    const avgScore = total > 0
      ? matches.reduce((sum, m) => sum + m.matchScore, 0) / total
      : 0;

    const skillCounts: Record<string, number> = {};
    for (const match of matches) {
      for (const skill of match.matchedSkills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    return { total, avgScore, topSkills };
  }

  private mapToJobMatch(match: any): JobMatch {
    return {
      id: match.id,
      jobId: match.jobId,
      userId: match.userId,
      matchScore: match.matchScore,
      semanticScore: match.semanticScore,
      skillMatchScore: match.skillMatchScore,
      preferenceScore: match.preferenceScore,
      temporalScore: match.temporalScore,
      matchedSkills: match.matchedSkills || [],
      missingSkills: match.missingSkills || [],
      skillGaps: match.skillGaps || undefined,
      strengths: match.strengths || [],
      concerns: match.concerns || [],
      recommendations: match.recommendations || [],
      matchReasons: match.matchReasons || [],
      job: match.job ? this.mapToJobPosting(match.job) : undefined,
      createdAt: match.createdAt,
    };
  }

  private mapToJobPosting(job: any): JobPosting {
    return {
      id: job.id,
      externalId: job.externalId || undefined,
      platform: job.platform,
      title: job.title,
      company: job.company,
      location: job.location || undefined,
      remotePolicy: job.remotePolicy || undefined,
      salary: job.salary || undefined,
      jobType: job.jobType || undefined,
      description: job.description || undefined,
      requirements: job.requirements || [],
      skills: job.skills || [],
      benefits: job.benefits || [],
      applicationUrl: job.applicationUrl || undefined,
      applicationMethod: job.applicationMethod || undefined,
      postedAt: job.postedAt || undefined,
      expiresAt: job.expiresAt || undefined,
      scrapedAt: job.scrapedAt,
      lastUpdated: job.lastUpdated,
      isActive: job.isActive,
      tags: job.tags || [],
      metadata: job.metadata || undefined,
    };
  }
}
