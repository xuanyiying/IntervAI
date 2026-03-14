import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '@/core/ai';
import { JOB_SEARCH_CONFIG } from './config/job-search.config';
import { JobAggregationService } from './services/job-aggregation.service';
import { JobMatchingService } from './services/job-matching.service';
import { ApplicationTrackingService } from './services/application-tracking.service';
import { InterviewPrepService } from './services/interview-prep.service';

@Module({
  imports: [ConfigModule.forFeature(JOB_SEARCH_CONFIG), ConfigModule, AIModule],
  providers: [
    JobAggregationService,
    JobMatchingService,
    ApplicationTrackingService,
    InterviewPrepService,
  ],
  exports: [
    JobAggregationService,
    JobMatchingService,
    ApplicationTrackingService,
    InterviewPrepService,
  ],
})
export class JobSearchModule {}
