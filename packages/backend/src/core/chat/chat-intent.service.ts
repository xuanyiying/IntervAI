/**
 * Chat Intent Service
 * Handles intent recognition and dispatches to appropriate handlers
 */

import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIService, Models } from '@/core/ai';
import { ResumeOptimizerService } from '@/features/resume/services/resume-optimizer.service';
import { ChatResponse } from './chat.gateway';
import {
  SceneAnalysisService,
  SceneContext,
  SceneAnalysisResult,
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

// In-memory cache for user's resume content (should use Redis in production)
const userResumeCache = new Map<
  string,
  { resumeId: string; content: string; timestamp: number }
>();

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
    @Inject(forwardRef(() => ResumeOptimizerService))
    private readonly resumeOptimizerService: ResumeOptimizerService,
  ) { }

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'ChatIntentService initialized with AI scene analysis enabled'
    );
  }

  /**
   * Store user's resume content for later use
   */
  async storeUserResumeContent(
    userId: string,
    resumeId: string,
    content: string
  ): Promise<void> {
    userResumeCache.set(userId, {
      resumeId,
      content,
      timestamp: Date.now(),
    });
    this.logger.debug(
      `Stored resume content for user ${userId}, resumeId: ${resumeId}`
    );
  }

  /**
   * Get user's latest resume content
   */
  async getUserResumeContent(
    userId: string
  ): Promise<{ resumeId: string; content: string } | null> {
    // First check cache
    const cached = userResumeCache.get(userId);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      // 1 hour cache
      this.logger.debug(
        `Using cached resume for user ${userId}, content length: ${cached.content.length}`
      );
      return { resumeId: cached.resumeId, content: cached.content };
    }

    // Fallback to database - get user's latest parsed resume
    const resume = await this.prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, extractedText: true },
    });

    if (resume?.extractedText) {
      // Update cache
      userResumeCache.set(userId, {
        resumeId: resume.id,
        content: resume.extractedText,
        timestamp: Date.now(),
      });
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
    // Scene-specific logic can be added here
    return {
      intent: ChatIntent.UNKNOWN,
      confidence: 0,
    };
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
    onComplete: (content: string, metadata?: Record<string, any>) => Promise<void>
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
        content: error instanceof Error ? error.message : 'Failed to process message',
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
    entities?: Record<string, any>
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
    message: string
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
        { data: { suggestions }, suggestions: ['详细分析', '生成优化版本', '模拟面试'] }
      );
    } catch (error) {
      this.logger.error('Error handling optimize resume:', error);
      return createTextResponse('抱歉，优化简历时出现了问题。请稍后重试。');
    }
  }

  private async handleMockInterview(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '我来为您进行模拟面试！请告诉我您面试的职位，或者上传职位描述，我会根据您的简历和职位要求生成针对性的面试问题。',
      { suggestions: ['上传职位描述', '开始通用面试', '技术面试', '行为面试'] }
    );
  }

  private async handleInterviewPrediction(
    userId: string,
    message: string
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
        return createTextResponse('解析职位描述时出现问题，请确保提供了完整的职位信息。');
      }

      const parsedJob = parsedJobResult.data as any;
      return createTextResponse(
        `已解析职位信息：\n\n**${parsedJob.title || '未知职位'}** @ ${parsedJob.company || '未知公司'}\n\n**核心要求：**\n${(parsedJob.requirements || []).map((r: string) => `- ${r}`).join('\n')}\n\n**技能需求：**\n${(parsedJob.skills || []).map((s: string) => `- ${s}`).join('\n')}`,
        { data: { parsedJob }, suggestions: ['匹配简历', '优化简历', '模拟面试', '面试预测'] }
      );
    } catch (error) {
      this.logger.error('Error parsing job description:', error);
      return createTextResponse('解析职位描述时出现问题，请确保提供了完整的职位信息。');
    }
  }

  private async handleCareerAdvice(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);

      const prompt = resume
        ? `基于用户简历：${resume.content.substring(0, 1000)}...\n\n用户问题：${message}`
        : `用户问题：${message}`;

      const response = await this.aiService.chat(
        Models.Chat,
        [
          {
            role: 'system',
            content:
              '你是一位资深的职业规划顾问，擅长根据用户的背景和目标提供个性化的职业发展建议。',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.7 }
      );

      return createTextResponse(response.content, {
        suggestions: ['技能分析', '薪资谈判', '职业转型', '竞争力分析'],
      });
    } catch (error) {
      this.logger.error('Error handling career advice:', error);
      return createTextResponse(
        '获取职业建议时出现问题。请告诉我更多关于您的背景和目标，我会尽力帮助您。'
      );
    }
  }

  private async handleSkillAnalysis(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    try {
      const resume = await this.getUserResumeContent(userId);
      if (!resume) {
        return createTextResponse('请先上传简历，我才能分析您的技能。', {
          suggestions: ['上传简历', '帮助'],
        });
      }

      const analysisResult = await this.aiService.executeSkill(
        'resume-analyzer',
        { resumeText: resume.content },
        userId
      );

      if (!analysisResult.success || !analysisResult.data) {
        return createTextResponse('技能分析时出现问题，请稍后重试。');
      }

      const analysis = analysisResult.data as any;
      const skills = analysis.skills || {};
      const coreSkills = skills.technical || skills.core || [];
      const gaps = analysis.gaps || analysis.matchAnalysis?.gaps || [];

      return createTextResponse(
        `**技能分析结果**\n\n**核心技能：**\n${coreSkills.map((s: string) => `- ${s}`).join('\n') || '未识别'}\n\n**技能差距：**\n${gaps.map((g: string) => `- ${g}`).join('\n') || '暂无分析'}`,
        { data: { analysis }, suggestions: ['优化简历', '学习建议', '职位匹配'] }
      );
    } catch (error) {
      this.logger.error('Error handling skill analysis:', error);
      return createTextResponse('技能分析时出现问题，请稍后重试。');
    }
  }

  private async handleSalaryNegotiation(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '薪资谈判是一个重要话题！我可以帮您：\n\n1. **了解市场行情** - 分析目标职位的薪资范围\n2. **准备谈判策略** - 根据您的背景制定谈判方案\n3. **模拟谈判场景** - 练习常见的薪资谈判对话\n\n请告诉我您想了解哪方面？',
      { suggestions: ['市场行情', '谈判策略', '模拟谈判', '福利谈判'] }
    );
  }

  private async handleFullOptimization(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '完整优化服务将为您提供：\n\n1. **简历深度分析** - 全面评估简历质量\n2. **针对性优化** - 根据目标职位定制优化方案\n3. **内容重写** - AI辅助生成高质量简历内容\n4. **格式美化** - 专业排版和格式调整\n\n请先上传您的简历和目标职位描述，我将为您进行全面优化。',
      { suggestions: ['上传简历', '输入职位描述', '开始优化', '查看示例'] }
    );
  }

  private async handleInterviewPreparation(
    userId: string,
    message: string
  ): Promise<ChatResponse> {
    return createTextResponse(
      '面试准备服务包括：\n\n1. **公司研究** - 了解目标公司背景和文化\n2. **职位分析** - 深入理解职位要求和考察点\n3. **问题预测** - 基于简历和职位预测面试问题\n4. **回答优化** - 准备高质量的回答模板\n5. **模拟面试** - 实战演练和反馈\n\n请提供目标公司和职位信息，我们开始准备吧！',
      { suggestions: ['公司研究', '问题预测', '模拟面试', '面试技巧'] }
    );
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
    message: string
  ): Promise<ChatResponse> {
    try {
      const response = await this.aiService.chat(
        Models.Chat,
        [
          {
            role: 'system',
            content:
              '你是IntervAI智能助手，专门帮助用户进行面试准备和简历优化。保持友好、专业，并主动提供有用的建议。',
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
        '抱歉，我暂时无法处理您的请求。请尝试其他功能或稍后再试。',
        { suggestions: ['帮助', '优化简历', '模拟面试'] }
      );
    }
  }

  async analyzeScene(
    content: string,
    context: SceneContext
  ): Promise<SceneAnalysisResult> {
    return this.sceneAnalysisService.analyzeScene(content, context);
  }
}
