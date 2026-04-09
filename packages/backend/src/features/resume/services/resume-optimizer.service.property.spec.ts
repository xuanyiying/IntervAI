import { AIService } from '@/core/ai';
import { QuotaService } from '@/core/quota/quota.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { ResumeOptimizerService } from './resume-optimizer.service';

describe('ResumeOptimizerService Property Tests', () => {
  let service: ResumeOptimizerService;
  let aiService: jest.Mocked<AIService>;

  const mockPrismaService = {
    optimization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    resume: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
  };

  const mockAIService = {
    stream: jest.fn(),
    executeSkill: jest.fn(),
    generate: jest.fn(),
  };

  const mockQuotaService = {
    enforceOptimizationQuota: jest.fn(),
    incrementOptimizationCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeOptimizerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AIService, useValue: mockAIService },
        { provide: QuotaService, useValue: mockQuotaService },
      ],
    }).compile();

    service = module.get<ResumeOptimizerService>(ResumeOptimizerService);
    aiService = module.get(AIService);
    jest.clearAllMocks();
  });

  describe('createOptimization', () => {
    it('should create optimization with valid inputs', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, resumeId) => {
          mockPrismaService.resume.findUnique.mockResolvedValue({
            id: resumeId,
            userId,
          });
          mockPrismaService.optimization.create.mockResolvedValue({
            id: 'opt-id',
            userId,
            resumeId,
            status: 'PENDING',
          });

          const result = await service.createOptimization(userId, resumeId);

          expect(result.userId).toBe(userId);
          expect(result.resumeId).toBe(resumeId);
          expect(mockPrismaService.optimization.create).toHaveBeenCalled();
        }),
        { numRuns: 10 }
      );
    });

    it('should reject when user does not own resume', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, resumeId) => {
          mockPrismaService.resume.findUnique.mockResolvedValue({
            id: resumeId,
            userId: 'other-user',
          });

          await expect(
            service.createOptimization(userId, resumeId)
          ).rejects.toThrow();
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('suggestion acceptance/rejection', () => {
    it('should accept a single suggestion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (optimizationId, userId, suggestionId) => {
            const mockSuggestions = [
              {
                id: suggestionId,
                type: 'CONTENT',
                section: 'experience',
                original: '负责项目开发',
                optimized: '主导核心系统架构设计与开发',
                reason: '使用更强有力的动词',
                status: 'PENDING',
              },
            ];

            mockPrismaService.optimization.findUnique.mockResolvedValue({
              id: optimizationId,
              userId,
              status: 'PENDING',
              suggestions: JSON.stringify(mockSuggestions),
            } as any);

            mockPrismaService.optimization.update.mockImplementation(
              async (args: any) => ({
                ...args.data,
                id: optimizationId,
              })
            );

            const result = await service.acceptSuggestion(
              optimizationId,
              userId,
              suggestionId
            );

            expect(result.suggestion.status).toBe('ACCEPTED');
            expect(mockPrismaService.optimization.update).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject a single suggestion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (optimizationId, userId, suggestionId) => {
            const mockSuggestions = [
              {
                id: suggestionId,
                type: 'KEYWORD',
                section: 'skills',
                original: 'Java, Python',
                optimized: 'Java, Python, Go, Kubernetes',
                reason: '补充云原生技术栈关键词',
                status: 'PENDING',
              },
            ];

            mockPrismaService.optimization.findUnique.mockResolvedValue({
              id: optimizationId,
              userId,
              status: 'PENDING',
              suggestions: JSON.stringify(mockSuggestions),
            } as any);

            mockPrismaService.optimization.update.mockImplementation(
              async (args: any) => ({
                ...args.data,
                id: optimizationId,
              })
            );

            const result = await service.rejectSuggestion(
              optimizationId,
              userId,
              suggestionId
            );

            expect(result.suggestion.status).toBe('REJECTED');
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('generateSuggestions', () => {
    it('should delegate to resume-writer skill', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (resumeContent, jobContent) => {
            mockAIService.executeSkill.mockResolvedValue({
              success: true,
              data: {
                optimizations: [
                  {
                    section: 'summary',
                    type: 'content',
                    before: resumeContent,
                    after: `Optimized: ${resumeContent}`,
                    reason: 'Improved clarity',
                  },
                ],
              },
            });

            const result = await service.generateSuggestions(
              { summary: resumeContent, skills: [], experience: [], education: [], projects: [] } as any,
              { title: jobContent, requiredSkills: [], preferredSkills: [], keywords: [], responsibilities: [] } as any,
              'test-user-id'
            );

            expect(mockAIService.executeSkill).toHaveBeenCalledWith(
              'resume-writer',
              expect.any(Object),
              'test-user-id'
            );
            expect(result).toBeInstanceOf(Array);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
