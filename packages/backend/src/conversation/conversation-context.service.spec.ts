import { Test, TestingModule } from '@nestjs/testing';
import { ConversationContextService } from './conversation-context.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { MessageRole } from '@prisma/client';

describe('ConversationContextService', () => {
  let service: ConversationContextService;

  const mockConversation = {
    id: 'conv-id',
    userId: 'user-id',
    messages: [
      {
        role: MessageRole.USER,
        content: 'I want to optimize my resume for a senior engineer position',
        createdAt: new Date(),
      },
      {
        role: MessageRole.ASSISTANT,
        content:
          'I can help you optimize your resume. What specific areas would you like to focus on?',
        createdAt: new Date(),
      },
      {
        role: MessageRole.USER,
        content: 'I want to highlight my JavaScript and Python skills',
        createdAt: new Date(),
      },
    ],
    resumes: [
      {
        id: 'resume-id',
        createdAt: new Date(),
      },
    ],
  };

  const mockPrismaService = {
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAIEngineService = {
    call: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationContextService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AIEngineService,
          useValue: mockAIEngineService,
        },
      ],
    }).compile();

    service = module.get<ConversationContextService>(
      ConversationContextService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildContext', () => {
    it('should build conversation context', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(
        mockConversation
      );

      const result = await service.buildContext('conv-id', 'user-id');

      expect(result).toBeDefined();
      expect(result.conversationId).toBe('conv-id');
      expect(result.userId).toBe('user-id');
      expect(result.previousMessages.length).toBe(3);
      expect(result.extractedEntities).toBeDefined();
    });

    it('should throw error if conversation not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.buildContext('invalid-id', 'user-id')
      ).rejects.toThrow();
    });

    it('should extract skills from messages', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(
        mockConversation
      );

      const result = await service.buildContext('conv-id', 'user-id');

      expect(result.extractedEntities.skills).toContain('JavaScript');
      expect(result.extractedEntities.skills).toContain('Python');
    });

    it('should limit messages to 20', async () => {
      const manyMessages = Array(25)
        .fill(null)
        .map((_, i) => ({
          role: MessageRole.USER,
          content: `Message ${i}`,
          createdAt: new Date(),
        }));

      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        messages: manyMessages,
      });

      const result = await service.buildContext('conv-id', 'user-id');

      expect(result.previousMessages.length).toBe(20);
    });
  });

  describe('generateContextualResponse', () => {
    it('should generate response based on context', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: ['JavaScript'],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      mockAIEngineService.call.mockResolvedValue({
        content:
          'I recommend highlighting your JavaScript experience by adding specific project examples.',
      });

      const result = await service.generateContextualResponse(
        context,
        'How can I improve my resume?'
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(mockAIEngineService.call).toHaveBeenCalled();
    });

    it('should extract suggestions from response', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      mockAIEngineService.call.mockResolvedValue({
        content: `Here are my suggestions:

Suggestion: Add quantifiable achievements to your experience section.
Recommend: Use action verbs to start each bullet point.
Should: Include relevant keywords from the job description.`,
      });

      const result = await service.generateContextualResponse(
        context,
        'Give me suggestions'
      );

      expect(result.suggestions).toBeDefined();
      expect(result?.suggestions?.length).toBeGreaterThan(0);
    });

    it('should generate follow-up questions', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      mockAIEngineService.call.mockResolvedValue({
        content: 'I can help you optimize your resume.',
      });

      const result = await service.generateContextualResponse(
        context,
        'Optimize my resume'
      );

      expect(result.followUpQuestions).toBeDefined();
      expect(Array.isArray(result.followUpQuestions)).toBe(true);
    });
  });

  describe('entity extraction', () => {
    it('should extract technical skills', async () => {
      const messages = [
        {
          role: MessageRole.USER,
          content: 'I have experience with JavaScript, React, and Node.js',
          timestamp: new Date(),
        },
      ];

      const result = await (service as any).extractEntities(messages);

      expect(result.skills).toContain('JavaScript');
      expect(result.skills).toContain('React');
      expect(result.skills).toContain('Node.js');
    });

    it('should extract user concerns', async () => {
      const messages = [
        {
          role: MessageRole.USER,
          content: 'I am worried about my lack of experience',
          timestamp: new Date(),
        },
      ];

      const result = await (service as any).extractEntities(messages);

      expect(result.concerns.length).toBeGreaterThan(0);
    });

    it('should handle empty messages', async () => {
      const result = await (service as any).extractEntities([]);

      expect(result.skills).toEqual([]);
      expect(result.experiences).toEqual([]);
      expect(result.concerns).toEqual([]);
      expect(result.preferences).toEqual([]);
    });
  });

  describe('updateContext', () => {
    it('should update context with new values', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      const updated = await service.updateContext(context, {
        optimizationGoal: 'Highlight technical skills',
      });

      expect(updated.optimizationGoal).toBe('Highlight technical skills');
    });
  });

  describe('saveContext', () => {
    it('should save context to database', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: ['JavaScript'],
          experiences: [],
          concerns: [],
          preferences: [],
        },
        optimizationGoal: 'Test goal',
      };

      mockPrismaService.message.findFirst.mockResolvedValue({
        id: 'msg-id',
        metadata: { existing: true },
      });
      mockPrismaService.message.update.mockResolvedValue({});

      await service.saveContext(context);

      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-id' },
        data: {
          metadata: {
            existing: true,
            conversationContext: {
              optimizationGoal: 'Test goal',
              extractedEntities: context.extractedEntities,
              currentOptimizationStep: undefined,
            },
          },
        },
      });
    });
  });

  describe('system prompt building', () => {
    it('should build personalized system prompt', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: ['JavaScript', 'Python'],
          experiences: [],
          concerns: ['lack of experience'],
          preferences: [],
        },
        optimizationGoal: 'Senior Engineer position',
      };

      const prompt = (service as any).buildSystemPrompt(context);

      expect(prompt).toContain('Senior Engineer position');
      expect(prompt).toContain('JavaScript');
      expect(prompt).toContain('Python');
      expect(prompt).toContain('lack of experience');
    });

    it('should handle empty context', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      const prompt = (service as any).buildSystemPrompt(context);

      expect(prompt).toBeDefined();
      expect(prompt).toContain('resume optimization assistant');
    });
  });

  describe('suggestion extraction', () => {
    it('should extract structured suggestions', async () => {
      const responseContent = `
        Here are my suggestions:

        Suggestion: Add more quantifiable achievements
        Recommend: Use the STAR method
        Should: Include relevant keywords
      `;

      const suggestions = await (service as any).extractSuggestions(
        responseContent
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].type).toBeDefined();
      expect(suggestions[0].suggested).toBeDefined();
    });

    it('should limit suggestions to 5', async () => {
      const responseContent = `
        Suggestion: One
        Suggestion: Two
        Suggestion: Three
        Suggestion: Four
        Suggestion: Five
        Suggestion: Six
        Suggestion: Seven
      `;

      const suggestions = await (service as any).extractSuggestions(
        responseContent
      );

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('follow-up question generation', () => {
    it('should generate relevant follow-up questions', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      const questions = await (service as any).generateFollowUpQuestions(
        context,
        'How can I optimize my resume?',
        'I can help you optimize your resume.'
      );

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeLessThanOrEqual(3);
    });

    it('should ask about skills if not mentioned', async () => {
      const context = {
        conversationId: 'conv-id',
        userId: 'user-id',
        previousMessages: [
          {
            role: MessageRole.USER,
            content: 'Help me',
            timestamp: new Date(),
          },
        ],
        extractedEntities: {
          skills: [],
          experiences: [],
          concerns: [],
          preferences: [],
        },
      };

      const questions = await (service as any).generateFollowUpQuestions(
        context,
        'Help me optimize',
        'I can help'
      );

      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
