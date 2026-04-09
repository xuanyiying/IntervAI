import { AIService } from '@/core/ai';
import { QuotaService } from '@/core/quota/quota.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { SuggestionStatus, SuggestionType } from '@/types';
import { Test, TestingModule } from '@nestjs/testing';
import { OptimizationStatus } from '@prisma/client';
import { ResumeOptimizerService } from './resume-optimizer.service';

describe('ResumeOptimizerService', () => {
  let service: ResumeOptimizerService;
  let aiService: jest.Mocked<AIService>;
  let prismaService: any;

  const mockUserId = 'test-user-id';
  const mockResumeId = 'test-resume-id';
  const mockJobId = 'test-job-id';

  const mockResumeData = {
    personalInfo: {
      name: 'Test User',
      email: 'test@example.com',
    },
    summary: 'Experienced software engineer',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: ['Built web applications'],
        achievements: ['Improved performance by 50%'],
      },
    ],
    education: [
      {
        institution: 'University',
        degree: 'BS Computer Science',
        field: 'Computer Science',
        year: '2019',
      },
    ],
    projects: [],
  };

  const mockJobData = {
    title: 'Senior Software Engineer',
    company: 'Target Company',
    requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
    preferredSkills: ['AWS', 'Docker'],
    responsibilities: ['Build scalable applications', 'Lead development team'],
    keywords: ['JavaScript', 'React', 'Node.js', 'AWS', 'Python'],
    experienceYears: 5,
    educationLevel: 'bachelor',
  };

  beforeEach(async () => {
    const mockAiService = {
      executeSkill: jest.fn(),
      stream: jest.fn(),
      generate: jest.fn(),
    };

    const mockPrismaService = {
      resume: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      job: {
        findUnique: jest.fn(),
      },
      optimization: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockQuotaService = {
      enforceOptimizationQuota: jest.fn(),
      incrementOptimizationCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeOptimizerService,
        { provide: AIService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotaService, useValue: mockQuotaService },
      ],
    }).compile();

    service = module.get<ResumeOptimizerService>(ResumeOptimizerService);
    aiService = module.get(AIService);
    prismaService = module.get(PrismaService);
  });

  describe('generateSuggestions', () => {
    it('should generate AI-powered suggestions using resume-writer skill', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: true,
        data: {
          optimizations: [
            {
              section: 'experience',
              type: 'content',
              before: 'Built web applications',
              after: 'Built scalable web applications serving 1M+ users',
              reason: 'Added quantification',
            },
            {
              section: 'skills',
              type: 'keyword',
              before: 'JavaScript, TypeScript',
              after: 'JavaScript, TypeScript, Python',
              reason: 'Add missing required skill from JD',
            },
          ],
        },
        metadata: {
          skillName: 'resume-writer',
          duration: 1000,
        },
      });

      const result = await service.generateSuggestions(
        mockResumeData as any,
        mockJobData as any,
        'test-user-id'
      );

      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'resume-writer',
        expect.objectContaining({
          resumeData: JSON.stringify(mockResumeData),
          targetJob: JSON.stringify(mockJobData),
          optimizationFocus: 'all',
          style: 'professional',
        }),
        ''
      );
      expect(result.length).toBe(2);
      expect(result[0].section).toBe('experience');
      expect(result[1].type).toBe(SuggestionType.KEYWORD);
    });

    it('should return empty array when AI skill fails', async () => {
      aiService.executeSkill.mockRejectedValue(
        new Error('AI service unavailable')
      );

      const result = await service.generateSuggestions(
        mockResumeData as any,
        mockJobData as any,
        'test-user-id'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should return empty array when AI skill returns no data', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: false,
        data: null,
        metadata: {
          skillName: 'resume-writer',
          duration: 0,
        },
      });

      const result = await service.generateSuggestions(
        mockResumeData as any,
        mockJobData as any,
        'test-user-id'
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  describe('suggestion acceptance/rejection', () => {
    it('should accept a single suggestion', async () => {
      const mockOptimization = {
        id: 'opt-id',
        userId: mockUserId,
        resumeId: mockResumeId,
        jobId: mockJobId,
        status: OptimizationStatus.COMPLETED,
        suggestions: [
          {
            id: 'suggestion-1',
            type: SuggestionType.CONTENT,
            section: 'summary',
            original: 'Experienced software engineer',
            optimized:
              'Experienced software engineer with 5+ years of expertise',
            reason: 'Enhanced summary',
            status: SuggestionStatus.PENDING,
          },
        ],
      };

      prismaService.optimization.findUnique.mockResolvedValue(
        mockOptimization as any
      );
      prismaService.optimization.update.mockResolvedValue({
        ...mockOptimization,
        suggestions: [
          {
            ...mockOptimization.suggestions[0],
            status: SuggestionStatus.ACCEPTED,
          },
        ],
      } as any);

      const result = await service.acceptSuggestion(
        'opt-id',
        mockUserId,
        'suggestion-1'
      );

      expect(result.status).toBe('accepted');
      expect(result.suggestion.status).toBe(SuggestionStatus.ACCEPTED);
      expect(prismaService.optimization.update).toHaveBeenCalled();
    });

    it('should reject a single suggestion', async () => {
      const mockOptimization = {
        id: 'opt-id',
        userId: mockUserId,
        resumeId: mockResumeId,
        suggestions: [
          {
            id: 'suggestion-1',
            type: SuggestionType.KEYWORD,
            section: 'skills',
            original: 'JavaScript',
            optimized: 'JavaScript, Python',
            reason: 'Add missing skill',
            status: SuggestionStatus.PENDING,
          },
        ],
      };

      prismaService.optimization.findUnique.mockResolvedValue(
        mockOptimization as any
      );
      prismaService.optimization.update.mockResolvedValue({
        ...mockOptimization,
        suggestions: [
          {
            ...mockOptimization.suggestions[0],
            status: SuggestionStatus.REJECTED,
          },
        ],
      } as any);

      const result = await service.rejectSuggestion(
        'opt-id',
        mockUserId,
        'suggestion-1'
      );

      expect(result.status).toBe('rejected');
      expect(result.suggestion.status).toBe(SuggestionStatus.REJECTED);
    });

    it('should throw NotFoundException for non-existent suggestion', async () => {
      const mockOptimization = {
        id: 'opt-id',
        userId: mockUserId,
        resumeId: mockResumeId,
        suggestions: [],
      };

      prismaService.optimization.findUnique.mockResolvedValue(
        mockOptimization as any
      );

      await expect(
        service.acceptSuggestion('opt-id', mockUserId, 'non-existent')
      ).rejects.toThrow('Suggestion non-existent not found');
    });
  });

  describe('parseAISuggestions', () => {
    it('should parse valid AI suggestions', () => {
      const aiData = {
        optimizations: [
          {
            section: 'experience',
            type: 'content',
            before: 'Original text',
            after: 'Optimized text',
            reason: 'Test reason',
          },
        ],
      };

      const result = (service as any).parseAISuggestions(aiData);

      expect(result).toBeInstanceOf(Array);
      expect(result[0].section).toBe('experience');
      expect(result[0].original).toBe('Original text');
      expect(result[0].optimized).toBe('Optimized text');
    });

    it('should handle string input', () => {
      const aiDataString = JSON.stringify({
        suggestions: [
          {
            section: 'skills',
            original: 'JavaScript',
            optimized: 'JavaScript/TypeScript',
          },
        ],
      });

      const result = (service as any).parseAISuggestions(aiDataString);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid data', () => {
      const result = (service as any).parseAISuggestions('invalid json');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });
});
