import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '@/core/ai/ai.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { SearchCriteria, JobPosting } from '../interfaces/job-search.interface';
import { Prisma } from '@prisma/client';

export interface ScraperConfig {
  platform: string;
  baseUrl: string;
  rateLimit: {
    requestsPerSecond: number;
    maxRetries: number;
  };
  selectors: Record<string, string>;
}

@Injectable()
export class JobAggregationService {
  private readonly logger = new Logger(JobAggregationService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly prisma: PrismaService
  ) { }

  async aggregateJobs(criteria: SearchCriteria, userId?: string): Promise<JobPosting[]> {
    this.logger.log('Starting job aggregation process...');

    const scraperConfigs = this.getScraperConfigs();

    const scraperResult = await this.aiService.executeSkill(
      'job-scraper',
      {
        jobListingText: JSON.stringify({ criteria, configs: scraperConfigs }),
      },
      userId || 'system'
    );

    const jobs: any[] = [];
    if (scraperResult.success && scraperResult.data) {
      const data = scraperResult.data as any;
      if (Array.isArray(data)) {
        jobs.push(...data);
      } else if (data.jobs) {
        jobs.push(...data.jobs);
      }
    }

    this.logger.log(`Scraper collected ${jobs.length} raw jobs`);

    const parsedJobs: JobPosting[] = [];
    const errors: Array<{ jobId: string; error: string }> = [];

    for (const rawJob of jobs) {
      try {
        const parserResult = await this.aiService.executeSkill(
          'job-parser',
          {
            rawJob,
          },
          userId || 'system'
        );

        if (parserResult.success && parserResult.data) {
          const jobData = parserResult.data as any;
          const savedJob = await this.saveJob(jobData, userId);
          parsedJobs.push({
            ...jobData,
            id: savedJob.id,
          });
        } else if (!parserResult.success) {
          errors.push({
            jobId: rawJob.id || 'unknown',
            error: parserResult.error?.message || 'Unknown error',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to save job ${rawJob.id}: ${errorMessage}`);
        errors.push({ jobId: rawJob.id || 'unknown', error: errorMessage });
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`${errors.length} jobs failed to parse or save`);
    }

    this.logger.log(`Successfully parsed and saved ${parsedJobs.length} jobs`);
    return parsedJobs;
  }

  private async saveJob(job: JobPosting, userId?: string) {
    return this.prisma.jobPosting.upsert({
      where: {
        platform_externalId: {
          platform: job.platform,
          externalId: job.externalId || job.id,
        },
      },
      create: {
        externalId: job.externalId,
        platform: job.platform,
        title: job.title,
        company: job.company,
        location: job.location || null,
        remotePolicy: job.remotePolicy || null,
        salary: (job.salary as Prisma.JsonObject) || null,
        description: job.description || null,
        requirements: job.requirements || [],
        skills: job.skills || [],
        benefits: job.benefits || [],
        applicationUrl: job.applicationUrl || null,
        applicationMethod: job.applicationMethod || null,
        postedAt: job.postedAt || null,
        scrapedAt: job.scrapedAt,
        isActive: true,
        tags: job.tags || [],
        userId: userId || null,
      },
      update: {
        title: job.title,
        company: job.company,
        location: job.location || null,
        description: job.description || null,
        lastUpdated: new Date(),
      },
    });
  }

  private getScraperConfigs(): ScraperConfig[] {
    return [
      {
        platform: 'linkedin',
        baseUrl: 'https://www.linkedin.com/jobs/search',
        rateLimit: {
          requestsPerSecond: 1,
          maxRetries: 3,
        },
        selectors: {
          title: '.job-title',
          company: '.company-name',
          location: '.job-location',
          description: '.job-description',
          salary: '.salary',
          requirements: '.requirements',
        },
      },
      {
        platform: 'indeed',
        baseUrl: 'https://www.indeed.com/jobs',
        rateLimit: {
          requestsPerSecond: 2,
          maxRetries: 3,
        },
        selectors: {
          title: '.jobTitle',
          company: '.companyName',
          location: '.companyLocation',
          description: '.jobDescription',
          salary: '.salary-snippet',
          requirements: '.job-requirements',
        },
      },
    ];
  }

  async getJobs(params: {
    userId?: string;
    platforms?: string[];
    keywords?: string[];
    location?: string;
    remote?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: JobPosting[]; total: number }> {
    const { userId, platforms, keywords, location, remote, limit = 20, offset = 0 } = params;

    const where: Prisma.JobPostingWhereInput = {
      isActive: true,
      ...(userId && { userId }),
      ...(platforms && platforms.length > 0 && { platform: { in: platforms } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(remote !== undefined && { remotePolicy: remote ? 'remote' : { not: 'remote' } }),
      ...(keywords &&
        keywords.length > 0 && {
        OR: keywords.map((keyword) => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { skills: { has: keyword } },
          ],
        })),
      }),
    };

    const [jobs, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { scrapedAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      jobs: jobs.map((job) => this.mapPrismaJobToInterface(job)),
      total,
    };
  }

  private mapPrismaJobToInterface(job: any): JobPosting {
    return {
      id: job.id,
      externalId: job.externalId,
      platform: job.platform,
      title: job.title,
      company: job.company,
      location: job.location || undefined,
      remotePolicy: job.remotePolicy as any,
      salary: job.salary as any,
      description: job.description || '',
      requirements: job.requirements || [],
      skills: job.skills || [],
      benefits: job.benefits || [],
      applicationUrl: job.applicationUrl || '',
      applicationMethod: job.applicationMethod as any,
      postedAt: job.postedAt || undefined,
      scrapedAt: job.scrapedAt,
      lastUpdated: job.lastUpdated,
      isActive: job.isActive,
      tags: job.tags || [],
    };
  }
}
