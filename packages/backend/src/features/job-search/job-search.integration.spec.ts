import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JobSearchModule } from './job-search.module';
import { JobAggregationService } from './services/job-aggregation.service';
import { SearchCriteria } from './interfaces/job-search.interface';

describe('JobSearch Integration Test', () => {
  let jobAggregationService: JobAggregationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), JobSearchModule],
    }).compile();

    jobAggregationService = module.get<JobAggregationService>(
      JobAggregationService
    );
  });

  it('should aggregate jobs from external sources (e.g., Arbeitnow)', async () => {
    console.log('--- Starting Job Aggregation Test ---');

    const criteria: SearchCriteria = {
      keywords: ['developer', 'engineer'],
      location: 'Berlin',
    };

    const jobs = await jobAggregationService.aggregateJobs(criteria);

    console.log(`\nSuccessfully aggregated ${jobs.length} jobs.`);
    if (jobs.length > 0) {
      console.log('Sample Job:');
      console.log(JSON.stringify(jobs[0], null, 2));
    }

    expect(jobs).toBeDefined();
    if (jobs.length > 0) {
      expect(jobs[0]).toHaveProperty('title');
      expect(jobs[0]).toHaveProperty('company');
    }
  }, 30000);
});
