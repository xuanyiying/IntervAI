import { AIService } from '@/modules/ai';
import { AIQueueService } from '@/modules/ai/queue/ai-queue.service';
import { QuotaService } from '@/modules/quota/services/quota.service';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { ResumeVersionService } from './resume-version.service';
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

    const mockAIQueueService = {
      addResumeOptimizationJob: jest.fn().mockResolvedValue({ id: 'job-id' }),
    };

    const mockResumeVersionService = {
      createVersion: jest.fn(),
      getVersions: jest.fn().mockResolvedValue([]),
      restoreVersion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeOptimizerService,
        { provide: AIService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotaService, useValue: mockQuotaService },
        { provide: AIQueueService, useValue: mockAIQueueService },
        { provide: ResumeVersionService, useValue: mockResumeVersionService },
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
        'test-user-id'
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

    it('should drop suggestions without optimized content', () => {
      const aiData = {
        optimizations: [
          { section: 'summary', before: 'a', after: '', reason: 'empty' },
          { section: 'summary', before: '', after: 'real suggestion' },
        ],
      };

      const result = (service as any).parseAISuggestions(aiData);

      expect(result.length).toBe(1);
      expect(result[0].optimized).toBe('real suggestion');
    });

    it('should return empty array for invalid data', () => {
      const result = (service as any).parseAISuggestions('invalid json');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  describe('generateSuggestions without JD', () => {
    it('should omit targetJob when no job data is provided', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: true,
        metadata: { skillName: 'resume-writer', duration: 100 },
        data: { optimizations: [] },
      });

      await service.generateSuggestions(mockResumeData as any, null, 'u1');

      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'resume-writer',
        expect.not.objectContaining({ targetJob: expect.anything() }),
        'u1'
      );
    });

    it('should pass diagnosisContext to the skill when provided', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: true,
        metadata: { skillName: 'resume-writer', duration: 100 },
        data: { optimizations: [] },
      });

      await service.generateSuggestions(
        mockResumeData as any,
        null,
        'u1',
        'Weaknesses:\n缺少量化成果'
      );

      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'resume-writer',
        expect.objectContaining({
          diagnosisContext: 'Weaknesses:\n缺少量化成果',
        }),
        'u1'
      );
    });
  });

  describe('processOptimization', () => {
    const baseOptimization = {
      id: 'opt-1',
      userId: mockUserId,
      resumeId: mockResumeId,
      jobId: mockJobId,
      status: OptimizationStatus.PENDING,
      suggestions: [],
    };

    it('should generate suggestions and mark COMPLETED', async () => {
      prismaService.optimization.findUnique.mockResolvedValue(
        baseOptimization as any
      );
      prismaService.resume.findUnique.mockResolvedValue({
        id: mockResumeId,
        parsedData: mockResumeData,
        analysisResult: {
          weaknesses: ['缺少量化成果'],
          suggestions: [
            {
              category: '工作经历',
              priority: '高',
              issue: '缺少量化',
              recommendation: '补充数字',
            },
          ],
        },
      } as any);
      prismaService.job.findUnique.mockResolvedValue(mockJobData as any);
      aiService.executeSkill.mockResolvedValue({
        success: true,
        metadata: { skillName: 'resume-writer', duration: 100 },
        data: {
          optimizations: [
            {
              section: 'experience',
              type: 'quantification',
              before: 'Built web applications',
              after: 'Built web applications serving 1M+ users',
              reason: 'Added metrics',
            },
          ],
        },
      });

      await service.processOptimization('opt-1');

      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'resume-writer',
        expect.objectContaining({
          diagnosisContext: expect.stringContaining('缺少量化成果'),
        }),
        mockUserId
      );
      expect(prismaService.optimization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'opt-1' },
          data: expect.objectContaining({
            status: OptimizationStatus.COMPLETED,
          }),
        })
      );
    });

    it('should mark FAILED with errorMessage when AI yields nothing', async () => {
      prismaService.optimization.findUnique.mockResolvedValue(
        baseOptimization as any
      );
      prismaService.resume.findUnique.mockResolvedValue({
        id: mockResumeId,
        parsedData: mockResumeData,
      } as any);
      prismaService.job.findUnique.mockResolvedValue(mockJobData as any);
      aiService.executeSkill.mockResolvedValue({
        success: true,
        metadata: { skillName: 'resume-writer', duration: 100 },
        data: { optimizations: [] },
      });

      await service.processOptimization('opt-1');

      expect(prismaService.optimization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OptimizationStatus.FAILED,
            errorMessage: expect.stringContaining('AI did not produce'),
          }),
        })
      );
    });

    it('should skip already finished optimizations', async () => {
      prismaService.optimization.findUnique.mockResolvedValue({
        ...baseOptimization,
        status: OptimizationStatus.COMPLETED,
      } as any);

      await service.processOptimization('opt-1');

      expect(prismaService.optimization.update).not.toHaveBeenCalled();
      expect(aiService.executeSkill).not.toHaveBeenCalled();
    });
  });

  describe('applyChanges', () => {
    it('should apply accepted suggestions, snapshot versions and count failures', async () => {
      const resumeData = {
        ...mockResumeData,
        summary: 'Experienced software engineer',
        projects: [
          {
            name: 'Project A',
            description: 'A web platform',
            technologies: [],
            highlights: [],
          },
        ],
      };

      prismaService.optimization.findUnique.mockResolvedValue({
        id: 'opt-1',
        userId: mockUserId,
        resumeId: mockResumeId,
        status: OptimizationStatus.COMPLETED,
        suggestions: [
          {
            id: 's1',
            type: SuggestionType.CONTENT,
            section: 'summary',
            original: 'Experienced software engineer',
            optimized: 'Senior engineer with 8 years of experience',
            reason: 'r',
            status: SuggestionStatus.ACCEPTED,
          },
          {
            id: 's2',
            type: SuggestionType.KEYWORD,
            section: 'skills',
            original: '',
            optimized: 'Kubernetes',
            reason: 'r',
            status: SuggestionStatus.ACCEPTED,
          },
          {
            id: 's3',
            type: SuggestionType.CONTENT,
            section: 'experience',
            original: 'no match anywhere',
            optimized: 'irrelevant',
            reason: 'r',
            status: SuggestionStatus.ACCEPTED,
          },
        ],
      } as any);
      prismaService.resume.findUnique.mockResolvedValue({
        id: mockResumeId,
        userId: mockUserId,
        version: 3,
        parsedData: resumeData,
      } as any);
      prismaService.resume.update.mockResolvedValue({} as any);

      const result = await service.applyChanges('opt-1', mockUserId);

      expect(result.appliedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.version).toBe(4);
      expect(result.parsedData.summary).toBe(
        'Senior engineer with 8 years of experience'
      );
      expect(result.parsedData.skills).toContain('Kubernetes');
      // Pre-apply + post-apply snapshots
      expect(
        (service as any).resumeVersionService.createVersion
      ).toHaveBeenCalledTimes(2);
      // Stale diagnosis invalidated
      expect(prismaService.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 4 }),
        })
      );
    });

    it('should throw when no accepted suggestions exist', async () => {
      prismaService.optimization.findUnique.mockResolvedValue({
        id: 'opt-1',
        userId: mockUserId,
        resumeId: mockResumeId,
        suggestions: [
          {
            id: 's1',
            status: SuggestionStatus.PENDING,
          },
        ],
      } as any);

      await expect(
        service.applyChanges('opt-1', mockUserId)
      ).rejects.toThrow('No accepted suggestions to apply');
    });

    it('should throw when nothing matches the resume content', async () => {
      prismaService.optimization.findUnique.mockResolvedValue({
        id: 'opt-1',
        userId: mockUserId,
        resumeId: mockResumeId,
        suggestions: [
          {
            id: 's1',
            section: 'summary',
            original: 'stale original text',
            optimized: 'new text',
            status: SuggestionStatus.ACCEPTED,
          },
        ],
      } as any);
      prismaService.resume.findUnique.mockResolvedValue({
        id: mockResumeId,
        userId: mockUserId,
        version: 1,
        parsedData: mockResumeData,
      } as any);

      await expect(
        service.applyChanges('opt-1', mockUserId)
      ).rejects.toThrow('No suggestions could be applied');
    });
  });

  describe('applySuggestionToResumeData (fuzzy matching)', () => {
    const data = () => ({
      personalInfo: { name: '李四', email: 'a@b.com' },
      summary: '有  多年   经验的工程师',
      skills: ['JavaScript'],
      experience: [
        {
          company: 'A公司',
          position: '工程师',
          description: ['负责 后端 开发'],
          achievements: [],
        },
      ],
      projects: [
        {
          name: 'P1',
          description: '电商平台',
          technologies: [],
          highlights: [],
        },
      ],
      education: [],
      certifications: [],
      languages: [],
    });

    it('should match with collapsed whitespace', () => {
      const d: any = data();
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'experience',
        original: '负责后端开发',
        optimized: '负责后端架构设计',
      });
      expect(ok).toBe(true);
      expect(d.experience[0].description[0]).toBe('负责后端架构设计');
    });

    it('should replace project string description', () => {
      const d: any = data();
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'projects',
        itemIndex: 0,
        original: '电商平台',
        optimized: '日活百万的电商平台',
      });
      expect(ok).toBe(true);
      expect(d.projects[0].description).toBe('日活百万的电商平台');
    });

    it('should append a new skill for keyword suggestions', () => {
      const d: any = data();
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'skills',
        type: 'keyword',
        original: '',
        optimized: 'Kubernetes',
      });
      expect(ok).toBe(true);
      expect(d.skills).toContain('Kubernetes');
      expect(d.skills).toContain('JavaScript');
    });

    it('should replace the whole summary when original is empty', () => {
      const d: any = data();
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'summary',
        original: '',
        optimized: '全新总结',
      });
      expect(ok).toBe(true);
      expect(d.summary).toBe('全新总结');
    });

    it('should fall back across items when itemIndex is stale', () => {
      const d: any = data();
      d.experience.push({
        company: 'B公司',
        position: '架构师',
        description: ['带领 团队 重构'],
        achievements: [],
      });
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'experience',
        itemIndex: 0,
        original: '带领团队重构',
        optimized: '带领 10 人团队完成微服务重构',
      });
      expect(ok).toBe(true);
      expect(d.experience[1].description[0]).toBe(
        '带领 10 人团队完成微服务重构'
      );
    });

    it('should return false when original cannot be found', () => {
      const d: any = data();
      const ok = (service as any).applySuggestionToResumeData(d, {
        section: 'experience',
        original: '完全不存在的内容',
        optimized: 'whatever',
      });
      expect(ok).toBe(false);
    });
  });
});
