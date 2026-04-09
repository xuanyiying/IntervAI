import { Test, TestingModule } from '@nestjs/testing';
import { InterviewService } from './interview.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIService } from '@/core/ai/ai.service';
import { InterviewAIService } from './services/interview-ai.service';
import { InterviewSessionService } from './services/interview-session.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { PromptService } from '@/core/prompts';
import {
  QuestionType,
  Difficulty,
  InterviewStatus,
  MessageRole,
} from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

describe('InterviewService', () => {
  let service: InterviewService;
  let sessionService: jest.Mocked<InterviewSessionService>;
  let questionGenerator: jest.Mocked<QuestionGeneratorService>;
  let interviewAI: jest.Mocked<InterviewAIService>;
  let aiService: jest.Mocked<AIService>;

  const mockUserId = 'user-123';
  const mockOptimizationId = 'opt-123';

  const mockSession = {
    id: 'session-123',
    userId: mockUserId,
    optimizationId: mockOptimizationId,
    status: InterviewStatus.IN_PROGRESS,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: InterviewSessionService,
          useValue: {
            startSession: jest.fn(),
            handleMessage: jest.fn(),
            endSession: jest.fn(),
            getSession: jest.fn(),
            getActiveSessionByOptimization: jest.fn(),
          },
        },
        {
          provide: QuestionGeneratorService,
          useValue: {
            generateQuestions: jest.fn(),
          },
        },
        {
          provide: InterviewAIService,
          useValue: {
            generateInterviewQuestions: jest.fn(),
            chatWithInterviewer: jest.fn(),
            transcribeAudio: jest.fn(),
          },
        },
        {
          provide: AIService,
          useValue: {
            chat: jest.fn(),
          },
        },
        {
          provide: PromptService,
          useValue: {
            getPreparationGuidancePrompt: jest.fn().mockReturnValue('Test prompt'),
          },
        },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
    sessionService = module.get(InterviewSessionService);
    questionGenerator = module.get(QuestionGeneratorService);
    interviewAI = module.get(InterviewAIService);
    aiService = module.get(AIService);
  });

  describe('generateQuestions', () => {
    it('should generate interview questions successfully', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          optimizationId: mockOptimizationId,
          questionType: QuestionType.BEHAVIORAL,
          question: 'Tell me about a challenge you overcame',
          suggestedAnswer: 'I faced a challenge...',
          tips: ['Use STAR method'],
          difficulty: Difficulty.MEDIUM,
          createdAt: new Date(),
        },
      ];

      questionGenerator.generateQuestions.mockResolvedValue(mockQuestions as any);

      const result = await service.generateQuestions(
        mockOptimizationId,
        mockUserId,
        10
      );

      expect(result).toEqual(mockQuestions);
      expect(questionGenerator.generateQuestions).toHaveBeenCalledWith(
        mockOptimizationId,
        mockUserId,
        10
      );
    });
  });

  describe('createSession', () => {
    it('should create a new interview session', async () => {
      const createSessionDto: CreateSessionDto = {
        optimizationId: mockOptimizationId,
      };

      sessionService.startSession.mockResolvedValue({
        session: mockSession as any,
        firstQuestion: null,
      });

      const result = await service.createSession(mockUserId, createSessionDto);

      expect(result.session).toEqual(mockSession);
      expect(sessionService.startSession).toHaveBeenCalledWith(
        mockUserId,
        createSessionDto
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message and get AI response', async () => {
      const sessionId = 'session-123';
      const sendMessageDto: SendMessageDto = { content: 'Hello' };

      const mockUserMessage = {
        id: 'msg-1',
        sessionId,
        role: MessageRole.USER,
        content: 'Hello',
        createdAt: new Date(),
      };

      const mockAiMessage = {
        id: 'msg-2',
        sessionId,
        role: MessageRole.ASSISTANT,
        content: 'Hi there',
        audioUrl: 'http://example.com/audio.mp3',
        createdAt: new Date(),
      };

      sessionService.handleMessage.mockResolvedValue({
        userMessage: mockUserMessage as any,
        aiMessage: mockAiMessage as any,
      });

      const result = await service.sendMessage(sessionId, mockUserId, sendMessageDto);

      expect(result.userMessage).toEqual(mockUserMessage);
      expect(result.aiMessage).toEqual(mockAiMessage);
      expect(sessionService.handleMessage).toHaveBeenCalledWith(
        mockUserId,
        sessionId,
        sendMessageDto
      );
    });
  });

  describe('endSession', () => {
    it('should end interview session', async () => {
      const sessionId = 'session-123';

      const mockCompletedSession = {
        ...mockSession,
        status: InterviewStatus.COMPLETED,
        endTime: new Date(),
      };

      sessionService.endSession.mockResolvedValue(mockCompletedSession as any);

      const result = await service.endSession(sessionId, mockUserId);

      expect(result.status).toBe(InterviewStatus.COMPLETED);
      expect(sessionService.endSession).toHaveBeenCalledWith(
        mockUserId,
        { sessionId }
      );
    });
  });
});
