import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JobSearchModule } from './job-search.module';
import { ApplicationTrackingService } from './services/application-tracking.service';
import {
  UserProfile,
  JobPosting,
  RemotePolicy,
  ApplicationStatus,
} from './interfaces/job-search.interface';

describe('Application Tracking Integration Test', () => {
  let trackingService: ApplicationTrackingService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), JobSearchModule],
    }).compile();

    trackingService = module.get<ApplicationTrackingService>(
      ApplicationTrackingService
    );
  });

  it('should simulate an application submission and track status updates', async () => {
    console.log('--- Starting Application Tracking Test ---');

    const mockUser: UserProfile = {
      id: 'user_456',
      userId: 'user_456',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
      experience: [],
      education: [],
      preferences: {
        preferredRoles: ['Backend Engineer'],
        preferredIndustries: [],
        preferredLocations: [],
        remotePreference: RemotePolicy.REMOTE,
        excludedCompanies: [],
      },
    };

    const mockJob: JobPosting = {
      id: 'job_xyz_123',
      externalId: 'ext_xyz',
      platform: 'test_platform',
      title: 'Test Software Engineer',
      company: 'Test Corp',
      location: 'Remote',
      remotePolicy: RemotePolicy.REMOTE,
      description: 'Test Description',
      requirements: [],
      skills: ['Node.js', 'TypeScript'],
      benefits: [],
      postedAt: new Date(),
      applicationUrl: 'https://example.com',
      scrapedAt: new Date(),
      isActive: true,
      tags: [],
    };

    console.log(`Applying to job ${mockJob.id}...`);
    const application = await trackingService.applyToJob(
      mockJob,
      mockUser,
      '/mock/path/to/resume.pdf'
    );

    console.log(`Application completed with status: ${application.status}`);
    expect(application).toBeDefined();
    expect(application.id).toBeDefined();

    console.log(`Simulating an interview invitation email...`);
    const updated1 = await trackingService.receiveTrackingUpdate(
      application.id,
      'We would like to schedule an interview with you next Tuesday.',
      'email'
    );

    console.log(`Status after email 1: ${updated1.status}`);
    expect(updated1.status).toBe(ApplicationStatus.INTERVIEW_REQUESTED);

    console.log(`Simulating a rejection email...`);
    const updated2 = await trackingService.receiveTrackingUpdate(
      application.id,
      'We regret to inform you that we will not be moving forward.',
      'email'
    );

    console.log(`Status after email 2: ${updated2.status}`);
    expect(updated2.status).toBe(ApplicationStatus.REJECTED);

    console.log(`Application Notes Matrix:\n${updated2.notes}`);
    expect(updated2.notes).toContain('Interview requested');
    expect(updated2.notes).toContain('Rejected');
  }, 45000);
});
