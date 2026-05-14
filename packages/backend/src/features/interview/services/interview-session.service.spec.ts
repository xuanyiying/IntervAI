import { AIService } from '@/core/ai';
import { PromptService } from '@/core/prompts';
import { QuotaService } from '@/core/quota/quota.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { InterviewMode, InterviewStatus, MessageRole } from '@prisma/client';
import { InterviewSessionService } from './interview-session.service';

describe('InterviewSessionService', () => {
  let service: InterviewSessionService;
  let aiService: jest.Mocked<AIService>;
  let prismaService: any;
  let voiceService: jest.Mocked<AlibabaVoiceService>;
  let quotaService: jest.Mocked<QuotaService>;
  let promptService: jest.Mocked<PromptService>;

  const mockUserId = 'test-user-id';
  const mockSessionId = 'test-session-id';
  const mockOptimizationId = 'test-optimization-id';

  const mockSession = {
    id: mockSessionId,
    userId: mockUserId,
    optimizationId: mockOptimizationId,
    status: InterviewStatus.IN_PROGRESS,
    mode: InterviewMode.MOCK,
    language: 'ZH',
    messages: [],
    optimization: {
      resume: {
        parsedData: {
          personalInfo: { name: 'Test User' },
          skills: ['JavaScript', 'React'],
          experience: [],
          projects: [],
        },
      },
      job: {
        parsedRequirements: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          requiredSkills: ['JavaScript', 'React', 'Node.js'],
          responsibilities: ['Build applications'],
        },
      },
    },
  };

  beforeEach(async () => {
    const mockAiService = {
      executeSkill: jest.fn(),
      stream: jest.fn(),
      generate: jest.fn(),
    };

    const mockPrismaService = {
      interviewSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      interviewMessage: {
        create: jest.fn(),
      },
      interviewQuestion: {
        findMany: jest.fn(),
      },
      interviewerPersona: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      optimization: {
        findUnique: jest.fn(),
      },
    };

    const mockQuotaService = {
      enforceInterviewQuota: jest.fn(),
      incrementInterviewCount: jest.fn(),
    };

    const mockVoiceService = {
      getVoices: jest.fn(),
      transcribeAudio: jest.fn(),
      synthesizeSpeech: jest.fn(),
    };

    const mockPromptService = {
      getInterviewLabels: jest.fn().mockReturnValue({
        question: '问题',
        referenceAnswer: '参考答案',
        keyPoints: '关键点',
        estimatedTime: '预计时长',
        tips: '提示',
        avoid: '避免',
      }),
      getFallbackResponse: jest.fn().mockReturnValue('Fallback response'),
      getInterviewMockPrompts: jest.fn().mockReturnValue({
        system: 'System prompt',
        context: () => 'Context',
      }),
      buildFeedbackPrompt: jest.fn().mockReturnValue('Feedback prompt'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewSessionService,
        { provide: AIService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotaService, useValue: mockQuotaService },
        { provide: AlibabaVoiceService, useValue: mockVoiceService },
        { provide: PromptService, useValue: mockPromptService },
      ],
    }).compile();

    service = module.get<InterviewSessionService>(InterviewSessionService);
    aiService = module.get(AIService);
    prismaService = module.get(PrismaService);
    quotaService = module.get(QuotaService);
    voiceService = module.get(AlibabaVoiceService);
    promptService = module.get(PromptService);
  });

  describe('startSession', () => {
    it('should create a new interview session successfully', async () => {
      const createDto = {
        optimizationId: mockOptimizationId,
        mode: 'mock' as const,
        language: 'zh' as const,
      };

      quotaService.enforceInterviewQuota.mockResolvedValue(undefined);
      prismaService.optimization.findUnique.mockResolvedValue({
        id: mockOptimizationId,
        userId: mockUserId,
        resume: { parsedData: {} },
        job: { parsedRequirements: {} },
      } as any);
      prismaService.interviewSession.create.mockResolvedValue(
        mockSession as any
      );
      quotaService.incrementInterviewCount.mockResolvedValue(undefined);
      prismaService.interviewQuestion.findMany.mockResolvedValue([]);

      const result = await service.startSession(mockUserId, createDto as any);

      expect(result.session).toBeDefined();
      expect(quotaService.enforceInterviewQuota).toHaveBeenCalledWith(
        mockUserId
      );
      expect(quotaService.incrementInterviewCount).toHaveBeenCalledWith(
        mockUserId
      );
    });

    it('should throw error when optimization not found', async () => {
      const createDto = {
        optimizationId: 'non-existent',
        mode: 'mock' as const,
      };

      quotaService.enforceInterviewQuota.mockResolvedValue(undefined);
      prismaService.optimization.findUnique.mockResolvedValue(null);

      await expect(
        service.startSession(mockUserId, createDto as any)
      ).rejects.toThrow('Optimization with ID non-existent not found');
    });

    it('should verify voice exists when voiceId provided', async () => {
      const createDto = {
        optimizationId: mockOptimizationId,
        mode: 'mock' as const,
        voiceId: 'voice-123',
      };

      quotaService.enforceInterviewQuota.mockResolvedValue(undefined);
      voiceService.getVoices.mockResolvedValue([{ id: 'voice-123' }] as any);
      prismaService.optimization.findUnique.mockResolvedValue({
        id: mockOptimizationId,
        userId: mockUserId,
      } as any);
      prismaService.interviewSession.create.mockResolvedValue(
        mockSession as any
      );
      quotaService.incrementInterviewCount.mockResolvedValue(undefined);
      prismaService.interviewQuestion.findMany.mockResolvedValue([]);

      await service.startSession(mockUserId, createDto as any);

      expect(voiceService.getVoices).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('submitAnswer', () => {
    it('should save answer and return next question', async () => {
      const mockQuestions = [
        { id: 'q1', question: 'Question 1' },
        { id: 'q2', question: 'Question 2' },
      ];

      prismaService.interviewSession.findUnique.mockResolvedValue({
        ...mockSession,
        messages: [],
      } as any);
      prismaService.interviewMessage.create.mockResolvedValue({} as any);
      prismaService.interviewQuestion.findMany.mockResolvedValue(
        mockQuestions as any
      );

      const result = await service.submitAnswer(
        mockUserId,
        mockSessionId,
        'My answer'
      );

      expect(result.isCompleted).toBe(false);
      expect(result.nextQuestion).toEqual(mockQuestions[1]);
    });

    it('should mark as completed when all questions answered', async () => {
      const mockQuestions = [{ id: 'q1', question: 'Question 1' }];

      prismaService.interviewSession.findUnique.mockResolvedValue({
        ...mockSession,
        messages: [{ role: MessageRole.USER, content: 'Previous answer' }],
      } as any);
      prismaService.interviewMessage.create.mockResolvedValue({} as any);
      prismaService.interviewQuestion.findMany.mockResolvedValue(
        mockQuestions as any
      );

      const result = await service.submitAnswer(
        mockUserId,
        mockSessionId,
        'My answer'
      );

      expect(result.isCompleted).toBe(true);
      expect(result.nextQuestion).toBeNull();
    });
  });

  describe('handleMessage', () => {
    it('should generate assist answer in ASSIST mode', async () => {
      const assistSession = {
        ...mockSession,
        mode: InterviewMode.ASSIST,
      };

      prismaService.interviewSession.findUnique.mockResolvedValue(
        assistSession as any
      );
      prismaService.interviewMessage.create.mockResolvedValue({} as any);
      aiService.executeSkill.mockResolvedValue({
        success: true,
        data: {
          suggestedAnswer: 'AI generated answer',
          keyPoints: ['Point 1', 'Point 2'],
          estimatedTime: '60 seconds',
        },
        metadata: { skillName: 'interview-assistant', duration: 1000 },
      });

      const result = await service.handleMessage(mockUserId, mockSessionId, {
        content: 'What is your experience?',
      });

      expect(result.userMessage).toBeDefined();
      expect(result.aiMessage).toBeDefined();
      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'interview-assistant',
        expect.any(Object),
        ''
      );
    });

    it('should generate mock response in MOCK mode', async () => {
      prismaService.interviewSession.findUnique.mockResolvedValue(
        mockSession as any
      );
      prismaService.interviewMessage.create.mockResolvedValue({} as any);
      aiService.executeSkill.mockResolvedValue({
        success: true,
        data: { response: 'Follow-up question' },
        metadata: { skillName: 'interview-assistant', duration: 1000 },
      });

      const result = await service.handleMessage(mockUserId, mockSessionId, {
        content: 'My answer to the question',
      });

      expect(result.aiMessage).toBeDefined();
    });
  });

  describe('getSessionState', () => {
    it('should return current session state with progress', async () => {
      const mockQuestions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }];

      prismaService.interviewSession.findUnique.mockResolvedValue({
        ...mockSession,
        messages: [
          { role: MessageRole.USER, content: 'Answer 1' },
          { role: MessageRole.ASSISTANT, content: 'Response 1' },
        ],
      } as any);
      prismaService.interviewQuestion.findMany.mockResolvedValue(
        mockQuestions as any
      );

      const result = await service.getSessionState(mockUserId, mockSessionId);

      expect(result.currentIndex).toBe(1);
      expect(result.totalQuestions).toBe(3);
      expect(result.currentQuestion).toEqual(mockQuestions[1]);
    });
  });

  describe('endSession', () => {
    it('should update session status to COMPLETED', async () => {
      prismaService.interviewSession.findUnique.mockResolvedValue(
        mockSession as any
      );
      prismaService.interviewSession.update.mockResolvedValue({
        ...mockSession,
        status: InterviewStatus.COMPLETED,
        endTime: new Date(),
      } as any);

      const result = await service.endSession(mockUserId, {
        sessionId: mockSessionId,
      });

      expect(result.status).toBe(InterviewStatus.COMPLETED);
      expect(result.endTime).toBeDefined();
    });
  });
});
