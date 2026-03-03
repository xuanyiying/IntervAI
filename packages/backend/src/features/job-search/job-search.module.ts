import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '@/core/ai';
import { JOB_SEARCH_CONFIG } from './config/job-search.config';
import { ScraperAgent } from './agents/scraper.agent';
import { ParserAgent } from './agents/parser.agent';
import { MatcherAgent } from './agents/matcher.agent';
import { ApplyAgent } from './agents/apply.agent';
import { TrackerAgent } from './agents/tracker.agent';
import { CoachAgent } from './agents/coach.agent';
import { JobAggregationService } from './services/job-aggregation.service';
import { JobMatchingService } from './services/job-matching.service';
import { ApplicationTrackingService } from './services/application-tracking.service';
import { InterviewPrepService } from './services/interview-prep.service';

@Module({
  imports: [ConfigModule.forFeature(JOB_SEARCH_CONFIG), ConfigModule, AIModule],
  providers: [
    ScraperAgent,
    ParserAgent,
    MatcherAgent,
    ApplyAgent,
    TrackerAgent,
    CoachAgent,
    JobAggregationService,
    JobMatchingService,
    ApplicationTrackingService,
    InterviewPrepService,
  ],
  exports: [
    ScraperAgent,
    ParserAgent,
    MatcherAgent,
    JobAggregationService,
    JobMatchingService,
    ApplicationTrackingService,
    InterviewPrepService,
  ],
})
export class JobSearchModule {}
