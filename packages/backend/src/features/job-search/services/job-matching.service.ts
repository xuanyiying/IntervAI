import { Injectable, Logger } from '@nestjs/common';
import { MatcherAgent } from '../agents/matcher.agent';
import {
  UserProfile,
  JobPosting,
  JobMatch,
} from '../interfaces/job-search.interface';

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private readonly matcherAgent: MatcherAgent
    // Database service would be injected here to fetch user profiles and save matches
  ) {}

  /**
   * Orchestrate the matching of a user against a list of jobs
   */
  async matchJobsForUser(
    userId: string,
    userProfile: UserProfile,
    jobs: JobPosting[]
  ): Promise<JobMatch[]> {
    this.logger.log(`Starting job matching process for user: ${userId}`);

    // Perform matching
    const matches = await this.matcherAgent.matchJobs(
      jobs,
      userId,
      userProfile
    );

    this.logger.log(`Generated ${matches.length} matches for user: ${userId}`);

    // In a real application, save matches to DB here:
    // await this.dbService.saveMatches(matches);

    return matches;
  }
}
