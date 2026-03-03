import { Injectable, Logger } from '@nestjs/common';
import { ScraperAgent } from '../agents/scraper.agent';
import { ParserAgent } from '../agents/parser.agent';
import { PrismaService } from '@/shared/database/prisma.service';
import { SearchCriteria, JobPosting } from '../interfaces/job-search.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobAggregationService {
  private readonly logger = new Logger(JobAggregationService.name);

  constructor(
    private readonly scraperAgent: ScraperAgent,
    private readonly parserAgent: ParserAgent,
    private readonly prisma: PrismaService
  ) { }

  async aggregateJobs(criteria: SearchCriteria, userId?: string): Promise<JobPosting[]> {
    this.logger.log('Starting job aggregation process...');

    const scraperResult = await this.scraperAgent.collectJobs(criteria);
    this.logger.log(`Scraper collected ${scraperResult.jobs.length} raw jobs`);

    const parsedJobs: JobPosting[] = [];
    const errors: Array<{ jobId: string; error: string }> = [];

    for (const rawJob of scraperResult.jobs) {
      try {
        const parserResult = await this.parserAgent.parseJob(rawJob);

        if (parserResult.success && parserResult.job) {
          const savedJob = await this.prisma.jobPosting.upsert({
            where: {
              platform_externalId: {
                platform: parserResult.job.platform,
                externalId: parserResult.job.externalId || parserResult.job.id,
              },
            },
            create: {
              externalId: parserResult.job.externalId,
              platform: parserResult.job.platform,
              title: parserResult.job.title,
              company: parserResult.job.company,
              location: parserResult.job.location || null,
              remotePolicy: parserResult.job.remotePolicy || null,
              salary: (parserResult.job.salary as Prisma.JsonObject) || null,
              jobType: parserResult.job.jobType || null,
              description: parserResult.job.description || null,
              requirements: parserResult.job.requirements || [],
              skills: parserResult.job.skills || [],
              benefits: parserResult.job.benefits || [],
              applicationUrl: parserResult.job.applicationUrl || null,
              applicationMethod: parserResult.job.applicationMethod || null,
              postedAt: parserResult.job.postedAt || null,
              expiresAt: parserResult.job.expiresAt || null,
              scrapedAt: parserResult.job.scrapedAt,
              isActive: true,
              tags: parserResult.job.tags || [],
              metadata: (parserResult.job.metadata as Prisma.JsonObject) || null,
              userId: userId || null,
            },
            update: {
              title: parserResult.job.title,
              company: parserResult.job.company,
              location: parserResult.job.location || null,
              description: parserResult.job.description || null,
              lastUpdated: new Date(),
            },
          });

          parsedJobs.push({
            ...parserResult.job,
            id: savedJob.id,
          });
        } else if (!parserResult.success) {
          errors.push({
            jobId: rawJob.id,
            error: parserResult.errors?.map((e) => e.error).join('; ') || 'Unknown error',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to save job ${rawJob.id}: ${errorMessage}`);
        errors.push({ jobId: rawJob.id, error: errorMessage });
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`${errors.length} jobs failed to parse or save`);
    }

    this.logger.log(`Successfully parsed and saved ${parsedJobs.length} jobs`);
    return parsedJobs;
  }

  async getJobs(params: {
    userId?: string;
    platforms?: string[];
    keywords?: string[];
    location?: string;
    remoteOnly?: boolean;
    skip?: number;
    take?: number;
  }): Promise<JobPosting[]> {
    const jobs = await this.prisma.jobPosting.findMany({
      skip: params.skip,
      take: params.take,
      where: {
        isActive: true,
        ...(params.platforms && params.platforms.length > 0
          ? { platform: { in: params.platforms } }
          : {}),
        ...(params.keywords && params.keywords.length > 0
          ? {
            OR: params.keywords.map((keyword) => ({
              OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { company: { contains: keyword, mode: 'insensitive' } },
              ],
            })),
          }
          : {}),
        ...(params.location ? { location: { contains: params.location, mode: 'insensitive' } } : {}),
        ...(params.remoteOnly ? { remotePolicy: { not: null } } : {}),
      },
      orderBy: { postedAt: 'desc' },
    });

    return jobs.map(this.mapToJobPosting);
  }

  async getJobById(id: string): Promise<JobPosting | null> {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
    });
    return job ? this.mapToJobPosting(job) : null;
  }

  async cleanupExpiredJobs(): Promise<number> {
    const result = await this.prisma.jobPosting.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
        lastUpdated: new Date(),
      },
    });
    this.logger.log(`Deactivated ${result.count} expired jobs`);
    return result.count;
  }

  async cleanupOldJobs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.jobPosting.deleteMany({
      where: {
        scrapedAt: { lt: cutoffDate },
      },
    });
    this.logger.log(`Deleted ${result.count} jobs older than ${daysToKeep} days`);
    return result.count;
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
