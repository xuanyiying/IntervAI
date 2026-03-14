import { Test, TestingModule } from '@nestjs/testing';
import { MatchAnalysisService } from './match-analysis.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIService } from '@/core/ai/ai.service';

describe('MatchAnalysisService', () => {
  let service: MatchAnalysisService;

  const mockResume = {
    id: 'resume-id',
    extractedText:
      'Experienced software engineer with JavaScript, Python, React skills',
    parsedData: {
      skills: ['JavaScript', 'Python', 'React'],
      experience: [
        {
          title: 'Software Engineer',
          company: 'Tech Co',
          duration: '3 years',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          school: 'University',
        },
      ],
    },
    optimizations: [],
  };

  const mockJob = {
    id: 'job-id',
    jobDescription: 'Looking for a senior software engineer',
    requirements: '5+ years experience, JavaScript, Python, React, AWS',
    parsedRequirements: {
      skills: ['JavaScript', 'Python', 'React', 'AWS'],
      experience: '5+ years',
    },
  };

  const mockPrismaService = {
    resume: {
      findUnique: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
  };

  const mockAIService = {
    executeSkill: jest.fn(),
    embed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchAnalysisService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
      ],
    }).compile();

    service = module.get<MatchAnalysisService>(MatchAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMatch', () => {
    it('should analyze match between resume and job', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockAIService.executeSkill.mockResolvedValue({
        overallScore: 75,
        skillsMatch: {
          matched: ['JavaScript', 'Python', 'React'],
          missing: ['AWS'],
          additional: [],
        },
        experienceMatch: {
          score: 60,
          relevantYears: 3,
          highlights: ['Software Engineer at Tech Co'],
        },
        educationMatch: {
          score: 80,
          meets: true,
          details: 'Bachelor degree meets requirements',
        },
      });

      mockAIService.embed
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id', 'user-id');

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.skillMatch).toBeDefined();
      expect(result.experienceMatch).toBeDefined();
      expect(result.educationMatch).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.learningPath).toBeDefined();
    });

    it('should throw error if resume not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('invalid-id', 'job-id', 'user-id')
      ).rejects.toThrow();
    });

    it('should throw error if job not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('resume-id', 'invalid-id', 'user-id')
      ).rejects.toThrow();
    });
  });

  describe('skill matching', () => {
    it('should identify matched skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockAIService.executeSkill.mockResolvedValue({
        overallScore: 75,
        skillsMatch: {
          matched: ['JavaScript', 'Python', 'React'],
          missing: ['AWS'],
          additional: [],
        },
        experienceMatch: {
          score: 60,
          relevantYears: 3,
          highlights: ['Software Engineer at Tech Co'],
        },
        educationMatch: {
          score: 80,
          meets: true,
          details: 'Bachelor degree meets requirements',
        },
      });

      mockAIService.embed
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id', 'user-id');

      expect(result.skillMatch.matched.length).toBeGreaterThan(0);
      expect(
        result.skillMatch.matched.some((s) => s.skill === 'JavaScript')
      ).toBe(true);
    });

    it('should identify missing skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockAIService.executeSkill.mockResolvedValue({
        overallScore: 75,
        skillsMatch: {
          matched: ['JavaScript', 'Python', 'React'],
          missing: ['AWS'],
          additional: [],
        },
        experienceMatch: {
          score: 60,
          relevantYears: 3,
          highlights: ['Software Engineer at Tech Co'],
        },
        educationMatch: {
          score: 80,
          meets: true,
          details: 'Bachelor degree meets requirements',
        },
      });

      mockAIService.embed
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id', 'user-id');

      expect(result.skillMatch.missing.length).toBeGreaterThan(0);
      expect(result.skillMatch.missing.some((s) => s.skill === 'AWS')).toBe(
        true
      );
    });
  });
});
