import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JobSearchModule } from './job-search.module';
import { InterviewPrepService } from './services/interview-prep.service';
import {
  UserProfile,
  JobPosting,
  RemotePolicy,
  EmploymentType,
  ExperienceLevel,
  ApplicationMethod,
  SkillCategory,
  SkillLevel,
} from './interfaces/job-search.interface';

describe('Interview Prep (Coach) Integration Test', () => {
  let prepService: InterviewPrepService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), JobSearchModule],
    }).compile();

    prepService = module.get<InterviewPrepService>(InterviewPrepService);
  });

  it('should generate a 7-day personalized study plan and track completion', async () => {
    console.log('--- Starting Interview Prep Coach Test ---');

    const mockUser: UserProfile = {
      id: 'user_789',
      userId: 'user_789',
      skills: [
        {
          name: 'TypeScript',
          category: SkillCategory.TECHNICAL,
          level: SkillLevel.ADVANCED,
          isRequired: true,
        },
        {
          name: 'React',
          category: SkillCategory.TECHNICAL,
          level: SkillLevel.ADVANCED,
          isRequired: true,
        },
      ],
      experience: [],
      education: [],
      preferences: {
        preferredRoles: ['Senior Frontend Engineer'],
        preferredIndustries: [],
        preferredLocations: [],
        remotePreference: RemotePolicy.REMOTE,
        companySizePrefs: [],
        excludedCompanies: [],
      },
      experienceSummary:
        'Senior Frontend Engineer with 5 years React, TypeScript, Next.js experience.',
    };

    const mockJob: JobPosting = {
      id: 'job_coach_001',
      externalId: 'ext_coach_001',
      platform: 'linkedin',
      title: 'Senior Frontend Engineer',
      company: 'Stripe',
      location: { city: 'Remote', country: 'Global' },
      remotePolicy: RemotePolicy.REMOTE,
      currency: 'USD',
      description:
        'Build the next generation of payment UIs with React and TypeScript at scale.',
      requirements: ['5+ years frontend', 'React proficiency', 'TypeScript'],
      preferredSkills: [
        'React',
        'TypeScript',
        'Next.js',
        'GraphQL',
        'Webpack',
        'Testing Library',
      ],
      experienceLevel: ExperienceLevel.SENIOR,
      employmentType: EmploymentType.FULL_TIME,
      postedDate: new Date(),
      applicationUrl: 'https://stripe.com/jobs',
      applicationMethod: ApplicationMethod.EXTERNAL,
      scrapedAt: new Date(),
      lastUpdated: new Date(),
      isActive: true,
      qualityScore: 98,
      tags: ['frontend', 'react', 'typescript'],
    };

    // 1. Generate a 7-day plan
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 7);

    console.log(
      `Generating 7-day study plan for ${mockJob.title} @ ${mockJob.company}...`
    );
    const plan = await prepService.generatePlan(
      mockUser.userId,
      mockJob,
      mockUser,
      interviewDate
    );

    console.log(`\n📋 Study Plan: "${plan.id}"`);
    console.log(`📆 Days: ${plan.totalDays}`);
    console.log(`⏱️  Estimated Total: ${plan.estimatedTotalHours}h`);
    console.log(`🔍 Priority Skill Gaps: ${plan.prioritySkillGaps.join(', ')}`);
    console.log(`\n--- Daily Milestones ---`);
    plan.milestones.forEach((m) => {
      console.log(`  Day ${m.day} (${m.estimatedHours}h): ${m.title}`);
      m.topics.forEach((t) => console.log(`    • [${t.category}] ${t.title}`));
    });
    console.log(
      `\n🎤 Mock Interview Questions (${plan.mockInterviewQuestions.length}):`
    );
    plan.mockInterviewQuestions.slice(0, 3).forEach((q) => {
      console.log(`  - ${q.question} [${q.difficulty}]`);
    });

    // Core assertions
    expect(plan).toBeDefined();
    expect(plan.totalDays).toBe(7);
    expect(plan.milestones).toHaveLength(7);
    expect(plan.prioritySkillGaps.length).toBeGreaterThan(0);
    expect(plan.mockInterviewQuestions.length).toBeGreaterThan(0);
    expect(plan.estimatedTotalHours).toBeGreaterThan(0);

    // 2. Mark the first topic complete
    const firstTopic = plan.milestones[0].topics[0];
    console.log(`\n✅ Completing topic: "${firstTopic.title}"`);
    const updatedPlan = prepService.completeTopic(plan.id, firstTopic.id);
    console.log(`Progress: ${(updatedPlan.progress * 100).toFixed(1)}%`);

    expect(updatedPlan.progress).toBeGreaterThan(0);
    expect(updatedPlan.milestones[0].topics[0].completed).toBe(true);

    // 3. Retrieve via ID
    const retrieved = prepService.getPlan(plan.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(plan.id);
  }, 30000);
});
