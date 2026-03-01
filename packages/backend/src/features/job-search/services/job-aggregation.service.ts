import { Injectable, Logger } from '@nestjs/common';
import { ScraperAgent } from '../agents/scraper.agent';
import { ParserAgent } from '../agents/parser.agent';
import { SearchCriteria, JobPosting } from '../interfaces/job-search.interface';

@Injectable()
export class JobAggregationService {
  private readonly logger = new Logger(JobAggregationService.name);

  constructor(
    private readonly scraperAgent: ScraperAgent,
    private readonly parserAgent: ParserAgent
    // Database service would typically be injected here to save jobs
  ) {}

  /**
   * Orchestrate the process of scraping and parsing jobs
   */
  async aggregateJobs(criteria: SearchCriteria): Promise<JobPosting[]> {
    this.logger.log('Starting job aggregation process...');

    // 1. Scrape jobs
    const scraperResult = await this.scraperAgent.collectJobs(criteria);
    this.logger.log(`Scraper collected ${scraperResult.jobs.length} raw jobs`);

    // 2. Parse jobs
    const parsedJobs: JobPosting[] = [];

    for (const rawJob of scraperResult.jobs) {
      const parserResult = await this.parserAgent.parseJob(rawJob);

      if (parserResult.success && parserResult.job) {
        parsedJobs.push(parserResult.job);
        // In a real application, save to DB here:
        // await this.dbService.saveJob(parserResult.job);
      }
    }

    this.logger.log(`Successfully parsed ${parsedJobs.length} jobs`);
    return parsedJobs;
  }
}
