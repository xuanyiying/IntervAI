/**
 * Chat Intent Service
 * Handles intent recognition and dispatches to appropriate handlers
 */

import { AIService } from '@/core/ai';
import { LanguageInput, PromptService } from '@/core/prompts';
import { RedisService } from '@/shared/cache/redis.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChatResponse } from './chat.gateway';
import {
  SceneAnalysisResult,
  SceneAnalysisService,
  SceneContext,
} from './scene-analysis.service';

export enum ChatIntent {
  OPTIMIZE_RESUME = 'optimize_resume',
  PARSE_RESUME = 'parse_resume',
  MOCK_INTERVIEW = 'mock_interview',
  INTERVIEW_PREDICTION = 'interview_prediction',
  PARSE_JOB_DESCRIPTION = 'parse_job_description',
  CAREER_ADVICE = 'career_advice',
  SKILL_ANALYSIS = 'skill_analysis',
  SALARY_NEGOTIATION = 'salary_negotiation',
  FULL_OPTIMIZATION = 'full_optimization',
  INTERVIEW_PREPARATION = 'interview_preparation',
  CAREER_TRANSITION = 'career_transition',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  GENERAL_CHAT = 'general_chat',
  HELP = 'help',
  UNKNOWN = 'unknown',
}

interface IntentResult {
  intent: ChatIntent;
  confidence: number;
  entities?: Record<string, any>;
  reasoning?: string;
  suggestedActions?: string[];
}

// In-memory cache for user's resume content (replaced by Redis for multi-instance safety)

function createTextResponse(
  content: string,
  options?: { suggestions?: string[]; data?: Record<string, any> }
): ChatResponse {
  return {
    type: 'text',
    content,
    timestamp: Date.now(),
    ...options,
  };
}

@Injectable()
export class ChatIntentService implements OnModuleInit {
  private readonly logger = new Logger(ChatIntentService.name);
  private useAISceneAnalysis: boolean = true;

  private readonly intentKeywords: Record<ChatIntent, string[]> = {
    [ChatIntent.OPTIMIZE_RESUME]: [
      '优化',
      '改进',
      '润色',
      '提升',
      '修改',
      '改善',
      '完善',
      'optimize',
      'improve',
      'enhance',
      'polish',
      'refine',
      '优化简历',
      '改进简历',
      '润色简历',
      '简历优化',
    ],
    [ChatIntent.MOCK_INTERVIEW]: [
      '模拟面试',
      '面试',
      '练习',
      'mock',
      'interview',
      'practice',
      '模拟',
      '面试解忧',
    ],
    [ChatIntent.INTERVIEW_PREDICTION]: [
      '面试预测',
      '预测',
      '题目',
      '考题',
      'prediction',
      'predict',
      'questions',
    ],
    [ChatIntent.PARSE_JOB_DESCRIPTION]: [
      '职位输入',
      '输入职位',
      '解析职位',
      'JD',
      '职位',
      '职位描述',
      'job',
      'description',
    ],
    [ChatIntent.PARSE_RESUME]: [
      '解析',
      '分析',
      '查看',
      '读取',
      'parse',
      'analyze',
      'read',
      'extract',
    ],
    [ChatIntent.CAREER_ADVICE]: [
      '职业建议',
      '职业规划',
      '求职建议',
      '职业发展',
      'career',
      'advice',
      'planning',
    ],
    [ChatIntent.SKILL_ANALYSIS]: [
      '技能分析',
      '技能评估',
      '能力分析',
      'skill',
      'analysis',
      'assessment',
    ],
    [ChatIntent.SALARY_NEGOTIATION]: [
      '薪资谈判',
      '薪资',
      '工资',
      '薪酬',
      'salary',
      'negotiation',
      'compensation',
    ],
    [ChatIntent.FULL_OPTIMIZATION]: [
      '完整优化',
      '深度优化',
      '全面优化',
      '根据JD优化',
      '针对职位优化',
      'full optimization',
    ],
    [ChatIntent.INTERVIEW_PREPARATION]: [
      '面试准备',
      '准备面试',
      '面试攻略',
      '面试技巧',
      'interview preparation',
    ],
    [ChatIntent.CAREER_TRANSITION]: [
      '职业转型',
      '转行',
      '职业转换',
      'career transition',
      'switch career',
    ],
    [ChatIntent.COMPETITIVE_ANALYSIS]: [
      '竞争力分析',
      '竞争分析',
      '优劣势分析',
      'competitive analysis',
      'strength weakness',
    ],
    [ChatIntent.HELP]: [
      '帮助',
      '怎么用',
      '如何',
      '使用说明',
      '功能',
      'help',
      'how to',
      'guide',
      'tutorial',
    ],
    [ChatIntent.GENERAL_CHAT]: [],
    [ChatIntent.UNKNOWN]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly sceneAnalysisService: SceneAnalysisService,
    private readonly promptService: PromptService,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'ChatIntentService initialized with AI scene analysis enabled'
    );
  }

  private readonly RESUME_CACHE_TTL = 3600;

  private resumeCacheKey(userId: string): string {
    return `chat:resume:${userId}`;
  }

  async storeUserResumeContent(
    userId: string,
    resumeId: string,
    content: string
  ): Promise<void> {
    const key = this.resumeCacheKey(userId);
    const data = JSON.stringify({ resumeId, content, timestamp: Date.now() });
    await this.redisService.set(key, data, this.RESUME_CACHE_TTL);
    this.logger.debug(
      `Stored resume content for user ${userId}, resumeId: ${resumeId}`
    );
  }

  async getUserResumeContent(
    userId: string
  ): Promise<{ resumeId: string; content: string } | null> {
    const key = this.resumeCacheKey(userId);
    const cached = await this.redisService.get(key);
    if (cached) {
      try {
        const { resumeId, content } = JSON.parse(cached);
        this.logger.debug(
          `Using cached resume for user ${userId}, content length: ${content.length}`
        );
        return { resumeId, content };
      } catch {
        // Invalid cache data, fall through to DB
      }
    }

    const resume = await this.prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, extractedText: true },
    });

    if (resume?.extractedText) {
      await this.storeUserResumeContent(
        userId,
        resume.id,
        resume.extractedText
      );
      return { resumeId: resume.id, content: resume.extractedText };
    }

    return null;
  }

  /**
   * Analyze user message and determine intent
   */
  async analyzeIntent(
    message: string,
    userId: string,
    context?: { currentScene?: string; resumeId?: string }
  ): Promise<IntentResult> {
    this.logger.debug(`Analyzing intent for message: "${message}"`);

    // Check for help first
    if (this.matchesIntent(message, ChatIntent.HELP)) {
      return {
        intent: ChatIntent.HELP,
        confidence: 0.95,
        reasoning: 'User is asking for help',
      };
    }

    // Check for scene-specific intents
    if (context?.currentScene) {
      const sceneIntent = await this.analyzeSceneSpecificIntent(
        message,
        context.currentScene,
        userId
      );
      if (sceneIntent.confidence > 0.7) {
        return sceneIntent;
      }
    }

    // Check for resume-related intents
    if (this.matchesIntent(message, ChatIntent.OPTIMIZE_RESUME)) {
      return {
        intent: ChatIntent.OPTIMIZE_RESUME,
        confidence: 0.9,
        entities: { action: 'optimize' },
        reasoning: 'User wants to optimize their resume',
      };
    }

    if (this.matchesIntent(message, ChatIntent.MOCK_INTERVIEW)) {
      return {
        intent: ChatIntent.MOCK_INTERVIEW,
        confidence: 0.9,
        reasoning: 'User wants to practice interview',
      };
    }

    if (this.matchesIntent(message, ChatIntent.INTERVIEW_PREDICTION)) {
      return {
        intent: ChatIntent.INTERVIEW_PREDICTION,
        confidence: 0.85,
        reasoning: 'User wants interview predictions',
      };
    }

    if (this.matchesIntent(message, ChatIntent.PARSE_JOB_DESCRIPTION)) {
      return {
        intent: ChatIntent.PARSE_JOB_DESCRIPTION,
        confidence: 0.85,
        reasoning: 'User is providing job description',
      };
    }

    if (this.matchesIntent(message, ChatIntent.CAREER_ADVICE)) {
      return {
        intent: ChatIntent.CAREER_ADVICE,
        confidence: 0.8,
        reasoning: 'User is asking for career advice',
      };
    }

    if (this.matchesIntent(message, ChatIntent.SKILL_ANALYSIS)) {
      return {
        intent: ChatIntent.SKILL_ANALYSIS,
        confidence: 0.8,
        reasoning: 'User wants skill analysis',
      };
    }

    if (this.matchesIntent(message, ChatIntent.SALARY_NEGOTIATION)) {
      return {
        intent: ChatIntent.SALARY_NEGOTIATION,
        confidence: 0.8,
        reasoning: 'User is asking about salary negotiation',
      };
    }

    if (this.matchesIntent(message, ChatIntent.FULL_OPTIMIZATION)) {
      return {
        intent: ChatIntent.FULL_OPTIMIZATION,
        confidence: 0.85,
        reasoning: 'User wants full resume optimization',
      };
    }

    if (this.matchesIntent(message, ChatIntent.INTERVIEW_PREPARATION)) {
      return {
        intent: ChatIntent.INTERVIEW_PREPARATION,
        confidence: 0.8,
        reasoning: 'User wants interview preparation',
      };
    }

    // Default to general chat
    return {
      intent: ChatIntent.GENERAL_CHAT,
      confidence: 0.6,
      reasoning: 'No specific intent detected, treating as general chat',
    };
  }

  /**
   * Analyze intent specific to current scene
   */
  private async analyzeSceneSpecificIntent(
    message: string,
    currentScene: string,
    userId: string
  ): Promise<IntentResult> {
    const lowerMessage = message.toLowerCase();
    const sceneKeywords = this.getSceneKeywords(currentScene);

    for (const keyword of sceneKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        const intent = this.getIntentForSceneAndKeyword(
          currentScene,
          keyword,
          lowerMessage
        );
        if (intent) {
          return intent;
        }
      }
    }

    const implicitIntent = this.getImplicitSceneIntent(
      currentScene,
      lowerMessage,
      userId
    );
    if (implicitIntent) {
      return implicitIntent;
    }

    return {
      intent: ChatIntent.UNKNOWN,
      confidence: 0,
    };
  }

  private getSceneKeywords(scene: string): string[] {
    const sceneKeywordMap: Record<string, string[]> = {
      resume_uploaded: [
        '优化',
        '改进',
        '润色',
        '完善',
        '修改',
        '分析',
        '评估',
        '检查',
        'optimize',
        'improve',
        'polish',
        'refine',
        'analyze',
        'assess',
        'check',
      ],
      job_description_parsed: [
        '面试',
        '开始',
        '练习',
        '模拟',
        '预测',
        '分析',
        '匹配',
        'interview',
        'start',
        'practice',
        'mock',
        'predict',
        'analyze',
        'match',
      ],
      optimization_complete: [
        '面试',
        '开始',
        '下一步',
        '继续',
        '查看',
        'interview',
        'next',
        'continue',
        'proceed',
        'view',
      ],
      interview_preparing: [
        '问题',
        '题目',
        '预测',
        '预测',
        '考题',
        '准备',
        'questions',
        'predict',
        'prepare',
        'practice',
      ],
      in_interview: [
        '结束',
        '停止',
        '完成',
        '结束面试',
        '结束对话',
        'end',
        'stop',
        'finish',
        'done',
        'complete',
      ],
      general: [
        '优化',
        '面试',
        '简历',
        '职位',
        '薪资',
        '技能',
        'career',
        'job',
        'resume',
        'interview',
        'salary',
        'skill',
      ],
    };
    return sceneKeywordMap[scene] || [];
  }

  private getIntentForSceneAndKeyword(
    scene: string,
    keyword: string,
    message: string
  ): IntentResult | null {
    const sceneIntentMap: Record<
      string,
      Record<string, { intent: ChatIntent; confidence: number }>
    > = {
      resume_uploaded: {
        优化: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        改进: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        润色: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        完善: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        修改: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.9 },
        分析: { intent: ChatIntent.SKILL_ANALYSIS, confidence: 0.85 },
        评估: { intent: ChatIntent.SKILL_ANALYSIS, confidence: 0.85 },
        optimize: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        improve: { intent: ChatIntent.OPTIMIZE_RESUME, confidence: 0.95 },
        analyze: { intent: ChatIntent.SKILL_ANALYSIS, confidence: 0.85 },
        assess: { intent: ChatIntent.SKILL_ANALYSIS, confidence: 0.85 },
      },
      job_description_parsed: {
        面试: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        开始: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
        练习: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
        模拟: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        预测: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.85 },
        分析: { intent: ChatIntent.COMPETITIVE_ANALYSIS, confidence: 0.8 },
        匹配: { intent: ChatIntent.PARSE_JOB_DESCRIPTION, confidence: 0.8 },
        interview: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        start: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
        practice: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
        mock: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        predict: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.85 },
        analyze: { intent: ChatIntent.COMPETITIVE_ANALYSIS, confidence: 0.8 },
      },
      optimization_complete: {
        面试: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        开始: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
        下一步: { intent: ChatIntent.INTERVIEW_PREPARATION, confidence: 0.9 },
        继续: { intent: ChatIntent.INTERVIEW_PREPARATION, confidence: 0.85 },
        查看: { intent: ChatIntent.PARSE_RESUME, confidence: 0.8 },
        interview: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.95 },
        next: { intent: ChatIntent.INTERVIEW_PREPARATION, confidence: 0.9 },
        continue: {
          intent: ChatIntent.INTERVIEW_PREPARATION,
          confidence: 0.85,
        },
      },
      interview_preparing: {
        问题: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.95 },
        题目: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.95 },
        预测: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.95 },
        准备: { intent: ChatIntent.INTERVIEW_PREPARATION, confidence: 0.9 },
        questions: {
          intent: ChatIntent.INTERVIEW_PREDICTION,
          confidence: 0.95,
        },
        predict: { intent: ChatIntent.INTERVIEW_PREDICTION, confidence: 0.95 },
        prepare: { intent: ChatIntent.INTERVIEW_PREPARATION, confidence: 0.9 },
        practice: { intent: ChatIntent.MOCK_INTERVIEW, confidence: 0.9 },
      },
      in_interview: {
        结束: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
        停止: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
        完成: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
        end: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
        stop: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
        finish: { intent: ChatIntent.UNKNOWN, confidence: 0.5 },
      },
    };

    const sceneMap = sceneIntentMap[scene];
    if (!sceneMap) return null;
    return sceneMap[keyword] || null;
  }

  private getImplicitSceneIntent(
    scene: string,
    message: string,
    userId: string
  ): IntentResult | null {
    if (scene === 'resume_uploaded' && message.length < 20) {
      return {
        intent: ChatIntent.OPTIMIZE_RESUME,
        confidence: 0.85,
        reasoning: `Context-aware: User just uploaded a resume in "${scene}" scene`,
      };
    }
    if (scene === 'job_description_parsed' && message.length < 20) {
      return {
        intent: ChatIntent.MOCK_INTERVIEW,
        confidence: 0.85,
        reasoning: `Context-aware: User just parsed job description in "${scene}" scene`,
      };
    }
    return null;
  }

  /**
   * Check if message matches intent keywords
   */
  private matchesIntent(message: string, intent: ChatIntent): boolean {
    const keywords = this.intentKeywords[intent];
    if (!keywords || keywords.length === 0) return false;

    const lowerMessage = message.toLowerCase();
    return keywords.some((keyword) =>
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  /**
   * Process a message and handle the response
   * This is the main entry point for message handling
   */
  async processMessage(
    userId: string,
    conversationId: string,
    content: string,
    metadata: Record<string, any>,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      content: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    this.logger.log(`Processing message for user: ${userId}`);

    try {
      // Analyze intent
      const intentResult = await this.analyzeIntent(content, userId, metadata);

      // Handle the intent
      const response = await this.handleIntent(
        intentResult.intent,
        content,
        userId,
        intentResult.entities
      );

      // Send response
      onChunk(response);

      // Complete
      await onComplete(response.content || '', {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
      });
    } catch (error) {
      this.logger.error('Error processing message:', error);
      onChunk({
        type: 'error',
        content:
          error instanceof Error ? error.message : 'Failed to process message',
        timestamp: Date.now(),
      });
      await onComplete('', { error: true });
    }
  }

  /**
   * Handle the detected intent
   */
  async handleIntent(
    intent: ChatIntent,
    message: string,
    userId: string,
    _entities?: Record<string, any>
  ): Promise<ChatResponse> {
    this.logger.log(`Handling intent: ${intent} for user: ${userId}`);

    switch (intent) {
      case ChatIntent.OPTIMIZE_RESUME:
        return this.handleOptimizeResume(userId, message);

      case ChatIntent.MOCK_INTERVIEW:
        return this.handleMockInterview(userId, message);

      case ChatIntent.INTERVIEW_PREDICTION:
        return this.handleInterviewPrediction(userId, message);

      case ChatIntent.PARSE_JOB_DESCRIPTION:
        return this.handleParseJobDescription(userId, message);

      case ChatIntent.CAREER_ADVICE:
        return this.handleCareerAdvice(userId, message);

      case ChatIntent.SKILL_ANALYSIS:
        return this.handleSkillAnalysis(userId, message);

      case ChatIntent.SALARY_NEGOTIATION:
        return this.handleSalaryNegotiation(userId, message);

      case ChatIntent.FULL_OPTIMIZATION:
        return this.handleFullOptimization(userId, message);

      case ChatIntent.INTERVIEW_PREPARATION:
        return this.handleInterviewPreparation(userId, message);

      case ChatIntent.HELP:
        return this.handleHelp();

      case ChatIntent.GENERAL_CHAT:
      default:
        return this.handleGeneralChat(userId, message);
    }
  }

  /**
   * Handle resume optimization request
   */
  private async handleOptimizeResume(
    userId: string,
    _message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);
      if (!resume) {
        return createTextResponse(
          '请先上传简历，我才能帮您优化。您可以使用 "上传简历" 功能。',
          { suggestions: ['上传简历', '如何上传简历', '帮助'] }
        );
      }

      const suggestions = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeData: resume.content },
        userId
      );

      return createTextResponse(
        `基于您的简历，我发现了以下优化建议：\n\n${JSON.stringify(suggestions, null, 2)}`,
        {
          data: { suggestions },
          suggestions: ['详细分析', '生成优化版本', '模拟面试'],
        }
      );
    } catch (error) {
      this.logger.error('Error handling optimize resume:', error);
      return createTextResponse('抱歉，优化简历时出现了问题。请稍后重试。');
    }
  }

  private async handleMockInterview(
    _userId: string,
    _message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '我来为您进行模拟面试！请告诉我您面试的职位，或者上传职位描述，我会根据您的简历和职位要求生成针对性的面试问题。',
      { suggestions: ['上传职位描述', '开始通用面试', '技术面试', '行为面试'] }
    );
  }

  private async handleInterviewPrediction(
    _userId: string,
    _message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '我可以帮您预测面试题目！请提供职位描述，我将分析可能的面试问题和考察重点。',
      { suggestions: ['上传职位描述', '通用面试题目', '技术面试题目'] }
    );
  }

  private async handleParseJobDescription(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      const jobDescription = message.replace(
        /(职位输入|输入职位|解析职位|JD|职位描述)/gi,
        ''
      );

      if (jobDescription.length < 50) {
        return createTextResponse(
          '请提供完整的职位描述信息，包括职位要求、技能需求、工作职责等，这样我能更好地帮助您分析和匹配。'
        );
      }

      const parsedJobResult = await this.aiService.executeSkill(
        'job-parser',
        { rawJob: { description: jobDescription } },
        userId
      );

      if (!parsedJobResult.success || !parsedJobResult.data) {
        return createTextResponse(
          '解析职位描述时出现问题，请确保提供了完整的职位信息。'
        );
      }

      const parsedJob = parsedJobResult.data as any;
      return createTextResponse(
        `已解析职位信息：\n\n**${parsedJob.title || '未知职位'}** @ ${parsedJob.company || '未知公司'}\n\n**核心要求：**\n${(parsedJob.requirements || []).map((r: string) => `- ${r}`).join('\n')}\n\n**技能需求：**\n${(parsedJob.skills || []).map((s: string) => `- ${s}`).join('\n')}`,
        {
          data: { parsedJob },
          suggestions: ['匹配简历', '优化简历', '模拟面试', '面试预测'],
        }
      );
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      return createTextResponse(
        '解析职位描述时出现问题，请确保提供了完整的职位信息。'
      );
    }
  }

  private async handleCareerAdvice(
    userId: string,
    message: string,
    language: LanguageInput = 'ZH'
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);

      const result = await this.aiService.executeSkill(
        'career-advisor',
        {
          resumeData: resume?.content || '',
          question: message,
        },
        userId
      );

      if (result.success && result.data) {
        const data = result.data as any;
        return createTextResponse(
          typeof data.advice === 'string'
            ? data.advice
            : JSON.stringify(data, null, 2),
          {
            suggestions: ['技能分析', '薪资谈判', '竞争力分析', '职业转型'],
          }
        );
      }

      return createTextResponse(
        '抱歉，无法获取职业建议。请告诉我更多关于您的背景和目标，我会尽力帮助您。'
      );
    } catch (error) {
      this.logger.error('Error handling career advice:', error);
      return createTextResponse('获取职业建议时出现问题，请稍后重试。');
    }
  }

  private async handleSkillAnalysis(
    userId: string,
    _message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);
      if (!resume) {
        return createTextResponse('请先上传简历，我才能分析您的技能。', {
          suggestions: ['上传简历', '帮助'],
        });
      }

      const result = await this.aiService.executeSkill(
        'skill-analyzer',
        { resumeText: resume.content },
        userId
      );

      if (result.success && result.data) {
        const data = result.data as any;
        const coreSkills = data.technicalSkills || data.coreSkills || [];
        const gaps = data.skillGaps || data.gaps || [];

        return createTextResponse(
          `**技能分析结果**\n\n**核心技能：**\n${
            Array.isArray(coreSkills)
              ? coreSkills.map((s: string) => `- ${s}`).join('\n')
              : JSON.stringify(coreSkills, null, 2)
          }\n\n**技能差距：**\n${
            Array.isArray(gaps)
              ? gaps.map((g: string) => `- ${g}`).join('\n')
              : JSON.stringify(gaps, null, 2)
          }`,
          {
            data: { analysis: data },
            suggestions: ['优化简历', '学习建议', '职位匹配'],
          }
        );
      }

      return createTextResponse('技能分析时出现问题，请稍后重试。');
    } catch (error) {
      this.logger.error('Error handling skill analysis:', error);
      return createTextResponse('技能分析时出现问题，请稍后重试。');
    }
  }

  private async handleSalaryNegotiation(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);

      const result = await this.aiService.executeSkill(
        'salary-analyzer',
        {
          jobTitle: this.extractJobTitle(message) || 'Software Engineer',
          location: this.extractLocation(message),
        },
        userId
      );

      if (result.success && result.data) {
        const data = result.data as any;
        const market = data.marketAnalysis?.baseSalary || {};
        const negotiation = data.negotiation || {};

        let response = `**薪资分析结果**\n\n`;
        response += `📊 **市场薪资范围 (${market.currency || 'USD'})**\n`;
        response += `- 最低: ${market.min?.toLocaleString() || 'N/A'}\n`;
        response += `- 中位数: ${market.median?.toLocaleString() || 'N/A'}\n`;
        response += `- 最高: ${market.max?.toLocaleString() || 'N/A'}\n\n`;

        if (negotiation.targetRange) {
          response += `💰 **建议目标薪资**\n`;
          response += `- 最低: ${negotiation.targetRange.min?.toLocaleString() || 'N/A'}\n`;
          response += `- 目标: ${negotiation.targetRange.target?.toLocaleString() || 'N/A'}\n`;
          response += `- 最高: ${negotiation.targetRange.stretch?.toLocaleString() || 'N/A'}\n\n`;
        }

        if (negotiation.strategy?.talkingPoints?.length) {
          response += `📝 **谈判要点**\n`;
          response += negotiation.strategy.talkingPoints
            .slice(0, 3)
            .map((t: string) => `- ${t}`)
            .join('\n');
          response += '\n';
        }

        if (data.recommendations?.length) {
          response += `\n💡 **建议**\n`;
          response += data.recommendations
            .slice(0, 3)
            .map((r: string) => `- ${r}`)
            .join('\n');
        }

        return createTextResponse(response, {
          suggestions: ['模拟谈判', '福利谈判', '了解更多技巧'],
        });
      }

      return createTextResponse(
        '抱歉，无法获取薪资分析。请告诉我您想了解的职位信息。'
      );
    } catch (error) {
      this.logger.error('Error handling salary negotiation:', error);
      return createTextResponse('获取薪资分析时出现问题，请稍后重试。');
    }
  }

  private async handleFullOptimization(
    userId: string,
    _message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);
      const jobDesc = await this.getUserJobDescription(userId);

      if (!resume || !jobDesc) {
        return createTextResponse(
          '完整优化需要简历和职位描述。请先上传简历并提供职位描述。',
          { suggestions: ['上传简历', '输入职位描述'] }
        );
      }

      const suggestions = await this.aiService.executeSkill(
        'jd-matcher',
        {
          resumeText: resume.content,
          jobDescription: jobDesc.content,
        },
        userId
      );

      if (suggestions.success && suggestions.data) {
        const data = suggestions.data as any;
        return createTextResponse(
          `**简历与职位匹配分析**\n\n${typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data, null, 2)}`,
          {
            suggestions: ['查看优化建议', '生成优化版本', '开始模拟面试'],
          }
        );
      }

      return createTextResponse('抱歉，完整优化时出现问题。请稍后重试。');
    } catch (error) {
      this.logger.error('Error handling full optimization:', error);
      return createTextResponse('完整优化时出现问题，请稍后重试。');
    }
  }

  private async handleInterviewPreparation(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);
      const jobDesc = await this.getUserJobDescription(userId);

      const result = await this.aiService.executeSkill(
        'interview-prep',
        {
          jobDescription: jobDesc?.content || message,
          resumeText: resume?.content || '',
          interviewType: 'technical',
        },
        userId
      );

      if (result.success && result.data) {
        const data = result.data as any;
        let response = `**面试准备材料**\n\n`;

        if (data.summary?.keyRequirements?.length) {
          response += `📋 **职位关键要求**\n`;
          response += data.summary.keyRequirements
            .slice(0, 5)
            .map((r: string) => `- ${r}`)
            .join('\n');
          response += '\n\n';
        }

        if (data.technicalQuestions?.length) {
          response += `💻 **技术问题 (${data.technicalQuestions.length}道)**\n`;
          response += data.technicalQuestions
            .slice(0, 3)
            .map((q: any) => `- ${q.question} (${q.difficulty})`)
            .join('\n');
          response += '\n\n';
        }

        if (data.behavioralQuestions?.length) {
          response += `🎯 **行为面试问题**\n`;
          response += data.behavioralQuestions
            .slice(0, 3)
            .map((q: any) => `- ${q.question}`)
            .join('\n');
          response += '\n\n';
        }

        if (data.questionsToAsk?.length) {
          response += `❓ **向面试官提问**\n`;
          response += data.questionsToAsk
            .slice(0, 3)
            .map((q: string) => `- ${q}`)
            .join('\n');
        }

        return createTextResponse(response, {
          suggestions: ['开始模拟面试', '公司研究', '准备自我介绍'],
        });
      }

      return createTextResponse(
        '抱歉，无法生成面试准备材料。请提供简历和职位描述。'
      );
    } catch (error) {
      this.logger.error('Error handling interview preparation:', error);
      return createTextResponse('生成面试准备材料时出现问题，请稍后重试。');
    }
  }

  private extractJobTitle(message: string): string | undefined {
    const patterns = [
      /(?:for|职位|岗位|申请)[：:\s]*([^\s，,。.]+)/i,
      /(?:senior|junior|lead|principal)?\s*(?:工程师|developer|engineer|manager|designer|analyst|scientist)/i,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1] || match[0];
    }
    return undefined;
  }

  private extractLocation(message: string): string | undefined {
    const patterns = [
      /(?:在|地点|location)[：:\s]*([^\s，,。.]+)/i,
      /(北京|上海|深圳|杭州|广州|成都|南京|武汉|西安|硅谷|纽约|伦敦)/,
    ];
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1] || match[0];
    }
    return undefined;
  }

  private async getUserJobDescription(
    userId: string
  ): Promise<{ content: string; parsedData?: any } | null> {
    const cacheKey = `jobdesc:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return { content: cached };
      }
    }

    const latestJob = await this.prisma.job.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestJob?.jobDescription) {
      const data = { content: latestJob.jobDescription };
      await this.redisService.set(
        cacheKey,
        JSON.stringify(data),
        this.RESUME_CACHE_TTL
      );
      return data;
    }

    return null;
  }

  private handleHelp(): ChatResponse {
    return createTextResponse(
      `**IntervAI 智能助手使用指南** 🤖

我可以帮您：

📄 **简历优化**
   - "优化我的简历"
   - "改进简历内容"

🎯 **模拟面试**
   - "开始模拟面试"
   - "面试练习"

🔮 **面试预测**
   - "预测面试题目"
   - "可能的面试问题"

💼 **职位分析**
   - 直接粘贴职位描述
   - "分析这个职位"

💡 **职业建议**
   - "职业规划建议"
   - "如何转行"

🛠️ **技能分析**
   - "分析我的技能"
   - "技能评估"

💰 **薪资谈判**
   - "薪资谈判技巧"
   - "如何谈薪资"

随时告诉我您需要什么帮助！`,
      {
        suggestions: [
          '优化简历',
          '模拟面试',
          '面试预测',
          '职业建议',
          '技能分析',
        ],
      }
    );
  }

  /**
   * Handle general chat
   */
  private async handleGeneralChat(
    userId: string,
    message: string,
    language: LanguageInput = 'ZH'
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = this.promptService.getChatIntentPrompt(
        'generalChat',
        language
      );

      const response = await this.aiService.chat(
        this.aiService.getModel(),
        [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: message },
        ],
        { temperature: 0.7 }
      );

      return createTextResponse(response.content, {
        suggestions: ['优化简历', '模拟面试', '职业建议', '帮助'],
      });
    } catch (error) {
      this.logger.error('Error in general chat:', error);
      return createTextResponse(
        language === 'ZH'
          ? '抱歉，我暂时无法处理您的请求。请尝试其他功能或稍后再试。'
          : 'Sorry, I am unable to process your request at the moment. Please try other features or try again later.',
        { suggestions: ['帮助', '优化简历', '模拟面试'] }
      );
    }
  }

  async analyzeScene(
    content: string,
    context: SceneContext,
    language: LanguageInput = 'EN'
  ): Promise<SceneAnalysisResult> {
    return this.sceneAnalysisService.analyzeScene(content, context, language);
  }
}
