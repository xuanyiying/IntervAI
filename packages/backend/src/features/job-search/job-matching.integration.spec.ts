import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JobSearchModule } from './job-search.module';
import { JobMatchingService } from './services/job-matching.service';
import {
  UserProfile,
  JobPosting,
  RemotePolicy,
} from './interfaces/job-search.interface';

describe('JobMatching Integration Test', () => {
  let jobMatchingService: JobMatchingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), JobSearchModule],
    }).compile();

    jobMatchingService = module.get<JobMatchingService>(JobMatchingService);
  });

  it('should calculate match score utilizing OpenAI embeddings via LangChain', async () => {
    console.log('--- Starting Job Matching Test ---');

    const mockUser: UserProfile = {
      id: 'user_123',
      userId: 'user_123',
      skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
      experience: [],
      education: [],
      preferences: {
        preferredRoles: ['Frontend Engineer'],
        preferredIndustries: [],
        preferredLocations: [],
        remotePreference: RemotePolicy.REMOTE,
        excludedCompanies: [],
      },
    };

    const mockJobs: JobPosting[] = [
      {
        id: 'job_1',
        externalId: 'ext_1',
        platform: 'test',
        title: 'Senior Frontend Developer',
        company: 'Tech Startup',
        location: 'Remote',
        remotePolicy: RemotePolicy.REMOTE,
        description:
          'We are looking for a Senior Frontend Developer who excels in React, TypeScript, and has a great eye for design and UI/UX. You will lead our frontend architecture.',
        requirements: [],
        skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
        benefits: [],
        postedAt: new Date(),
        applicationUrl: 'https://example.com',
        scrapedAt: new Date(),
        isActive: true,
        tags: [],
      },
      {
        id: 'job_2',
        externalId: 'ext_2',
        platform: 'test',
        title: 'Backend SQL Admin',
        company: 'Enterprise Corp',
        location: 'New York, USA',
        remotePolicy: RemotePolicy.ONSITE,
        description:
          'Seeking a database administrator with deep knowledge of Oracle, internal networking, and C++ server maintenance. Zero frontend work required.',
        requirements: [],
        skills: ['SQL', 'Oracle', 'C++'],
        benefits: [],
        postedAt: new Date(),
        applicationUrl: 'https://example.com',
        scrapedAt: new Date(),
        isActive: true,
        tags: [],
      },
    ];

    const matches = await jobMatchingService.matchJobsForUser(
      'user_123',
      mockUser,
      mockJobs
    );

    console.log(`\nGenerated ${matches.length} matches.`);

    matches.sort((a, b) => b.matchScore - a.matchScore);

    matches.forEach((match, index) => {
      const job = match.job;
      if (job) {
        console.log(`\nRank ${index + 1}: ${job.title}`);
      }
      console.log(`Overall Score: ${match.matchScore.toFixed(2)}`);
      console.log(
        `Semantic (Embeddings) Score: ${match.semanticScore.toFixed(2)}`
      );
    });

    expect(matches.length).toBeGreaterThan(0);
    if (matches[0].job) {
      expect(matches[0].job.id).toBeDefined();
    }

    if (
      matches.length > 1 &&
      matches[0].semanticScore !== matches[1].semanticScore
    ) {
      if (matches[0].job) {
        expect(matches[0].job.id).toBe('job_1');
      }
      expect(matches[0].semanticScore).toBeGreaterThan(
        matches[1].semanticScore
      );
    }
  }, 30000);
});
