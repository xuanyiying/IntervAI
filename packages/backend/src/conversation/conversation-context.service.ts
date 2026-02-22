import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { MessageRole } from '@prisma/client';

export interface ConversationContext {
  conversationId: string;
  userId: string;
  resumeId?: string;
  jobId?: string;
  optimizationGoal?: string;
  previousMessages: Array<{
    role: MessageRole;
    content: string;
    timestamp: Date;
  }>;
  extractedEntities: {
    skills: string[];
    experiences: string[];
    concerns: string[];
    preferences: string[];
  };
  currentOptimizationStep?: string;
}

export interface OptimizationSuggestion {
  type: 'content' | 'structure' | 'keyword' | 'achievement';
  section: string;
  original?: string;
  suggested: string;
  reason: string;
  confidence: number;
}

@Injectable()
export class ConversationContextService {
  private readonly logger = new Logger(ConversationContextService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiEngine: AIEngineService
  ) {}

  async buildContext(
    conversationId: string,
    userId: string
  ): Promise<ConversationContext> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        resumes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const previousMessages = conversation.messages
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      }))
      .slice(0, 20);

    const extractedEntities = await this.extractEntities(previousMessages);

    return {
      conversationId,
      userId,
      resumeId: conversation.resumes[0]?.id,
      previousMessages,
      extractedEntities,
    };
  }

  async generateContextualResponse(
    context: ConversationContext,
    userMessage: string
  ): Promise<{
    response: string;
    suggestions?: OptimizationSuggestion[];
    followUpQuestions?: string[];
  }> {
    const systemPrompt = this.buildSystemPrompt(context);

    const conversationHistory = context.previousMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `${systemPrompt}

Conversation History:
${conversationHistory}

Current User Message:
${userMessage}

Please provide a helpful response that:
1. Addresses the user's question or concern
2. Provides specific, actionable optimization suggestions
3. Explains the reasoning behind each suggestion
4. Asks clarifying questions if needed

If the user is asking for clarification about a previous suggestion, explain it in detail with examples.
If the user wants to make changes, provide the specific content they can use.

Format your response in a clear, structured way.`;

    const response = await this.aiEngine.call(
      {
        model: '',
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      },
      'system'
    );

    const suggestions = await this.extractSuggestions(response.content);
    const followUpQuestions = await this.generateFollowUpQuestions(
      context,
      userMessage,
      response.content
    );

    return {
      response: response.content,
      suggestions,
      followUpQuestions,
    };
  }

  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = `You are an expert resume optimization assistant helping a user improve their resume.

Your role is to:
- Provide specific, actionable suggestions for resume improvement
- Explain the reasoning behind each suggestion
- Help the user understand why certain changes are recommended
- Adapt your suggestions based on the user's feedback and concerns
- Guide the user through a step-by-step optimization process

Current context:`;

    if (context.optimizationGoal) {
      prompt += `\n- Optimization goal: ${context.optimizationGoal}`;
    }

    if (context.extractedEntities.skills.length > 0) {
      prompt += `\n- Discussed skills: ${context.extractedEntities.skills.join(', ')}`;
    }

    if (context.extractedEntities.concerns.length > 0) {
      prompt += `\n- User concerns: ${context.extractedEntities.concerns.join(', ')}`;
    }

    return prompt;
  }

  private async extractEntities(
    messages: Array<{ role: MessageRole; content: string; timestamp: Date }>
  ): Promise<ConversationContext['extractedEntities']> {
    const entities: ConversationContext['extractedEntities'] = {
      skills: [],
      experiences: [],
      concerns: [],
      preferences: [],
    };

    const userMessages = messages
      .filter((m) => m.role === MessageRole.USER)
      .map((m) => m.content)
      .join(' ');

    const skillKeywords = [
      'JavaScript',
      'Python',
      'Java',
      'React',
      'Node.js',
      'TypeScript',
      'SQL',
      'AWS',
      'Docker',
      'Kubernetes',
      'Git',
      'MongoDB',
      'PostgreSQL',
      'GraphQL',
      'REST',
      'Agile',
      'Scrum',
    ];

    skillKeywords.forEach((skill) => {
      if (userMessages.toLowerCase().includes(skill.toLowerCase())) {
        entities.skills.push(skill);
      }
    });

    const concernPatterns = [
      /worried about (.+?)/gi,
      /concerned (?:about|that) (.+?)/gi,
      /not sure (?:about|if) (.+?)/gi,
      /struggling with (.+?)/gi,
    ];

    concernPatterns.forEach((pattern) => {
      const matches = userMessages.match(pattern);
      if (matches) {
        entities.concerns.push(...matches);
      }
    });

    return entities;
  }

  private async extractSuggestions(
    responseContent: string
  ): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    const suggestionPattern =
      /(?:suggestion|recommend|should|could):\s*(.+?)(?:\n|$)/gi;
    const matches = responseContent.matchAll(suggestionPattern);

    for (const match of matches) {
      suggestions.push({
        type: 'content',
        section: 'general',
        suggested: match[1],
        reason: 'AI-generated suggestion',
        confidence: 0.8,
      });
    }

    return suggestions.slice(0, 5);
  }

  private async generateFollowUpQuestions(
    context: ConversationContext,
    userMessage: string,
    aiResponse: string
  ): Promise<string[]> {
    const questions: string[] = [];

    if (
      userMessage.toLowerCase().includes('optimize') ||
      userMessage.toLowerCase().includes('improve')
    ) {
      questions.push(
        'Would you like me to explain why this change would be effective?'
      );
      questions.push(
        'Should I provide alternative suggestions for this section?'
      );
    }

    if (userMessage.toLowerCase().includes('why')) {
      questions.push(
        'Would you like to see examples of effective alternatives?'
      );
    }

    if (
      context.previousMessages.length < 3 &&
      !context.extractedEntities.skills.length
    ) {
      questions.push(
        'What specific skills or experiences would you like to highlight?'
      );
    }

    return questions.slice(0, 3);
  }

  async updateContext(
    context: ConversationContext,
    updates: Partial<ConversationContext>
  ): Promise<ConversationContext> {
    return {
      ...context,
      ...updates,
    };
  }

  async saveContext(context: ConversationContext): Promise<void> {
    const latestMessage = await this.prisma.message.findFirst({
      where: { conversationId: context.conversationId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestMessage) {
      return;
    }

    const baseMetadata =
      latestMessage.metadata &&
      typeof latestMessage.metadata === 'object' &&
      !Array.isArray(latestMessage.metadata)
        ? (latestMessage.metadata as Record<string, unknown>)
        : {};

    await this.prisma.message.update({
      where: { id: latestMessage.id },
      data: {
        metadata: {
          ...baseMetadata,
          conversationContext: {
            optimizationGoal: context.optimizationGoal,
            extractedEntities: context.extractedEntities,
            currentOptimizationStep: context.currentOptimizationStep,
          },
        },
      },
    });
  }
}
