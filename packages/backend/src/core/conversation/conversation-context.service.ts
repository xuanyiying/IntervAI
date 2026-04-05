import { AIService, Models } from '@/core/ai';
import { PrismaService } from '@/shared/database/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PromptService, LanguageInput } from '@/core/prompts';

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
    private readonly aiService: AIService,
    private readonly promptService: PromptService
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
    userMessage: string,
    language: LanguageInput = 'EN'
  ): Promise<{
    response: string;
    suggestions?: OptimizationSuggestion[];
    followUpQuestions?: string[];
  }> {
    const systemPrompt = this.buildSystemPrompt(context, language);

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

    const response = await this.aiService.chat(
      Models.Chat,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        maxTokens: 2000,
      }
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

  private buildSystemPrompt(
    context: ConversationContext,
    language: LanguageInput = 'EN'
  ): string {
    // Use PromptService to get the localized system prompt
    const basePrompt = this.promptService.getResumeOptimizationPrompt(language);

    let prompt = `${basePrompt}

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
    const lowerMessage = userMessage.toLowerCase();

    // 1. 基于用户意图的智能问题生成
    const intentQuestions = this.getIntentBasedQuestions(lowerMessage, context);
    questions.push(...intentQuestions);

    // 2. 基于 AI 回复内容的深度追问
    const responseBasedQuestions = this.getResponseBasedQuestions(
      aiResponse,
      lowerMessage
    );
    questions.push(...responseBasedQuestions);

    // 3. 基于对话阶段的引导问题
    const stageBasedQuestions = this.getStageBasedQuestions(context);
    questions.push(...stageBasedQuestions);

    // 4. 基于用户画像的个性化问题
    const personalizedQuestions = this.getPersonalizedQuestions(context);
    questions.push(...personalizedQuestions);

    // 去重并限制数量
    const uniqueQuestions = [...new Set(questions)];
    return uniqueQuestions.slice(0, 3);
  }

  /**
   * 基于用户意图生成问题
   */
  private getIntentBasedQuestions(
    lowerMessage: string,
    context: ConversationContext
  ): string[] {
    const questions: string[] = [];

    // 优化/改进意图
    if (
      /\b(optimize|improve|enhance|polish|优化|改进|完善)\b/.test(lowerMessage)
    ) {
      questions.push(
        '您希望我重点优化简历的哪个部分？（如工作经历、项目描述、技能列表等）'
      );
      questions.push('您有特定的目标职位吗？我可以根据职位要求进行针对性优化');
    }

    // 疑问/解释意图
    if (/\b(why|how|what|为什么|如何|什么|怎么)\b/.test(lowerMessage)) {
      questions.push('您希望我详细解释某个优化建议的原因吗？');
      questions.push('您需要我提供具体的修改示例吗？');
    }

    // 比较/选择意图
    if (
      /\b(compare|difference|better|which|比较|区别|哪个更好)\b/.test(
        lowerMessage
      )
    ) {
      questions.push('您希望我提供多个版本的修改方案供您选择吗？');
    }

    // 技能相关意图
    if (/\b(skill|technology|tech stack|技能|技术|工具)\b/.test(lowerMessage)) {
      if (context.extractedEntities.skills.length === 0) {
        questions.push('您最擅长或最常用的技术栈是什么？');
      } else {
        questions.push('您还希望强调哪些其他技能？');
      }
    }

    // 求职意向
    if (
      /\b(job|position|role|career|apply|职位|工作|求职|应聘)\b/.test(
        lowerMessage
      )
    ) {
      questions.push('您目前主要关注哪个行业或领域的职位？');
    }

    return questions;
  }

  /**
   * 基于 AI 回复内容生成追问
   */
  private getResponseBasedQuestions(
    aiResponse: string,
    lowerMessage: string
  ): string[] {
    const questions: string[] = [];
    const lowerResponse = aiResponse.toLowerCase();

    // 如果 AI 提供了多个建议，询问用户想先看哪个
    const suggestionCount = (
      lowerResponse.match(/\d+\.|suggestion|建议/g) || []
    ).length;
    if (suggestionCount >= 3) {
      questions.push('这些建议中，您最想先处理哪一个？');
    }

    // 如果 AI 提到了具体技能，询问熟练程度
    if (lowerResponse.includes('skill') || lowerResponse.includes('技能')) {
      questions.push(
        '对于提到的这些技能，您的熟练程度如何？（初级/中级/高级/专家）'
      );
    }

    // 如果 AI 建议添加量化成果
    if (
      /\b(metric|number|percentage|量化|数据|百分比|增长)\b/.test(lowerResponse)
    ) {
      questions.push(
        '您是否有具体的业绩数据可以补充？（如提升 X%、节省 Y 小时等）'
      );
    }

    // 如果用户询问某个具体问题
    if (lowerMessage.includes('project') || lowerMessage.includes('项目')) {
      questions.push('您在这个项目中具体负责哪些工作？解决了什么核心问题？');
    }

    return questions;
  }

  /**
   * 基于对话阶段生成引导问题
   */
  private getStageBasedQuestions(context: ConversationContext): string[] {
    const questions: string[] = [];
    const messageCount = context.previousMessages.length;

    // 新会话 - 收集基础信息
    if (messageCount < 3) {
      if (!context.extractedEntities.skills.length) {
        questions.push('请简单介绍一下您的技术背景和核心技能？');
      }
      if (!context.optimizationGoal) {
        questions.push('您这次优化简历的主要目标是什么？（求职/晋升/转行等）');
      }
    }

    // 中期会话 - 深入优化
    if (messageCount >= 3 && messageCount < 10) {
      questions.push('目前的修改方向符合您的预期吗？需要调整重点吗？');
    }

    // 后期会话 - 收尾检查
    if (messageCount >= 10) {
      questions.push('您希望我对优化后的简历进行整体检查吗？');
      questions.push('需要我帮您准备面试中可能会被问到的问题吗？');
    }

    return questions;
  }

  /**
   * 基于用户画像生成个性化问题
   */
  private getPersonalizedQuestions(context: ConversationContext): string[] {
    const questions: string[] = [];
    const { extractedEntities } = context;

    // 根据已提取的技能推荐相关问题
    if (extractedEntities.skills.length > 0) {
      const topSkill = extractedEntities.skills[0];
      questions.push(`您在 ${topSkill} 方面有哪些实际项目经验可以展示？`);
    }

    // 根据用户顾虑提供针对性问题
    if (extractedEntities.concerns.length > 0) {
      questions.push('您还有其他担心的地方需要我帮您分析吗？');
    }

    // 如果没有提取到经验信息
    if (
      extractedEntities.experiences.length === 0 &&
      context.previousMessages.length > 2
    ) {
      questions.push('您有哪些值得突出的工作经历或项目成果？');
    }

    return questions;
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
