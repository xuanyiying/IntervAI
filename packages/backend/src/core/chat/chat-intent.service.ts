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
import { AIEngineService } from '@/core/ai-provider/ai-engine.service';
import { ResumeOptimizerService } from '@/features/resume/services/resume-optimizer.service';
import { AIRequest } from '@/core/ai-provider/interfaces';
import { PromptScenario } from '@/core/ai-provider/interfaces/prompt-template.interface';
import { ChatResponse } from './chat.gateway';
import {
  SceneAnalysisService,
  SceneContext,
  SceneAnalysisResult,
} from './scene-analysis.service';
import {
  TeamTaskService,
  ComplexTaskType,
  ComplexTaskResult,
} from '@/core/agent/team/team-task.service';

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

@Injectable()
export class ChatIntentService implements OnModuleInit {
  private readonly logger = new Logger(ChatIntentService.name);
  private useAISceneAnalysis: boolean = true;
  private useTeamAgents: boolean = true;

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
    private readonly aiEngineService: AIEngineService,
    private readonly sceneAnalysisService: SceneAnalysisService,
    @Inject(forwardRef(() => ResumeOptimizerService))
    private readonly resumeOptimizerService: ResumeOptimizerService,
    @Optional() private readonly teamTaskService: TeamTaskService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'ChatIntentService initialized with AI scene analysis enabled'
    );
    if (this.teamTaskService?.isEnabled()) {
      this.logger.log('Team Agent integration enabled');
    }
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
      where: {
        userId,
        parseStatus: 'COMPLETED',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (resume?.parsedData) {
      const content = this.convertParsedDataToMarkdown(
        resume.parsedData as any
      );

      if (!content || content.trim().length === 0) {
        this.logger.warn(
          `Converted resume content is empty for user ${userId}, resumeId: ${resume.id}`
        );
        this.logger.debug(
          `ParsedData structure: ${JSON.stringify(resume.parsedData).substring(0, 200)}`
        );
        return null;
      }

      this.logger.debug(
        `Converted resume to markdown for user ${userId}, content length: ${content.length}`
      );

      userResumeCache.set(userId, {
        resumeId: resume.id,
        content,
        timestamp: Date.now(),
      });
      return { resumeId: resume.id, content };
    }

    this.logger.warn(`No parsed resume found for user ${userId}`);
    return null;
  }

  /**
   * Process incoming message and dispatch to appropriate handler
   */
  async processMessage(
    userId: string,
    conversationId: string,
    content: string,
    metadata: Record<string, any> | undefined,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    try {
      const resumeData = await this.getUserResumeContent(userId);

      const sceneContext: SceneContext = {
        userId,
        conversationId,
        previousMessages: metadata?.previousMessages || [],
        userMetadata: metadata?.userMetadata,
        hasResume: !!resumeData,
        hasJobDescription: !!metadata?.hasJobDescription,
      };

      let intentResult: IntentResult;

      if (this.useAISceneAnalysis) {
        try {
          const sceneResult = await this.sceneAnalysisService.analyzeScene(
            content,
            sceneContext
          );
          intentResult = this.convertSceneResultToIntent(sceneResult);
          this.logger.debug(
            `AI scene analysis: ${intentResult.intent} (confidence: ${intentResult.confidence}, reasoning: ${intentResult.reasoning})`
          );
        } catch (error) {
          this.logger.warn(
            `AI scene analysis failed, falling back to keyword matching: ${error instanceof Error ? error.message : String(error)}`
          );
          intentResult = this.recognizeIntent(content);
        }
      } else {
        intentResult = this.recognizeIntent(content);
        this.logger.debug(
          `Keyword-based intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`
        );
      }

      switch (intentResult.intent) {
        case ChatIntent.OPTIMIZE_RESUME:
          await this.handleOptimizeResume(
            userId,
            conversationId,
            content,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.MOCK_INTERVIEW:
          await this.handleMockInterview(
            userId,
            conversationId,
            content,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.INTERVIEW_PREDICTION:
          await this.handleInterviewPrediction(
            userId,
            conversationId,
            content,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.PARSE_JOB_DESCRIPTION:
          await this.handleParseJobDescription(
            userId,
            conversationId,
            content,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.CAREER_ADVICE:
          await this.handleCareerAdvice(userId, content, onChunk, onComplete);
          break;

        case ChatIntent.SKILL_ANALYSIS:
          await this.handleSkillAnalysis(userId, content, onChunk, onComplete);
          break;

        case ChatIntent.SALARY_NEGOTIATION:
          await this.handleSalaryNegotiation(
            userId,
            content,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.FULL_OPTIMIZATION:
          await this.handleFullOptimization(
            userId,
            content,
            metadata,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.INTERVIEW_PREPARATION:
          await this.handleInterviewPreparation(
            userId,
            content,
            metadata,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.CAREER_TRANSITION:
          await this.handleCareerTransition(
            userId,
            content,
            metadata,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.COMPETITIVE_ANALYSIS:
          await this.handleCompetitiveAnalysis(
            userId,
            content,
            metadata,
            onChunk,
            onComplete
          );
          break;

        case ChatIntent.HELP:
          await this.handleHelp(onChunk, onComplete);
          break;

        case ChatIntent.GENERAL_CHAT:
        default:
          await this.handleGeneralChat(userId, content, onChunk, onComplete);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Intent processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : '处理消息时发生错误，请稍后重试。';
      await onComplete(errorMessage, { error: true });
    }
  }

  private convertSceneResultToIntent(
    sceneResult: SceneAnalysisResult
  ): IntentResult {
    const sceneToIntentMap: Record<string, ChatIntent> = {
      optimize_resume: ChatIntent.OPTIMIZE_RESUME,
      parse_resume: ChatIntent.PARSE_RESUME,
      mock_interview: ChatIntent.MOCK_INTERVIEW,
      interview_prediction: ChatIntent.INTERVIEW_PREDICTION,
      parse_job_description: ChatIntent.PARSE_JOB_DESCRIPTION,
      career_advice: ChatIntent.CAREER_ADVICE,
      skill_analysis: ChatIntent.SKILL_ANALYSIS,
      salary_negotiation: ChatIntent.SALARY_NEGOTIATION,
      full_optimization: ChatIntent.FULL_OPTIMIZATION,
      interview_preparation: ChatIntent.INTERVIEW_PREPARATION,
      career_transition: ChatIntent.CAREER_TRANSITION,
      competitive_analysis: ChatIntent.COMPETITIVE_ANALYSIS,
      general_chat: ChatIntent.GENERAL_CHAT,
      help: ChatIntent.HELP,
      unknown: ChatIntent.UNKNOWN,
    };

    return {
      intent: sceneToIntentMap[sceneResult.scene] || ChatIntent.GENERAL_CHAT,
      confidence: sceneResult.confidence,
      entities: sceneResult.entities,
      reasoning: sceneResult.reasoning,
      suggestedActions: sceneResult.suggestedActions,
    };
  }

  /**
   * Recognize user intent from message content
   */
  private recognizeIntent(content: string): IntentResult {
    const lowerContent = content.toLowerCase();

    // Check each intent's keywords
    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      if (keywords.length === 0) continue;

      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          return {
            intent: intent as ChatIntent,
            confidence: 0.9,
          };
        }
      }
    }

    // Default to general chat
    return {
      intent: ChatIntent.GENERAL_CHAT,
      confidence: 0.5,
    };
  }

  /**
   * Handle resume optimization request
   */
  private async handleOptimizeResume(
    userId: string,
    conversationId: string,
    userMessage: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    // Get user's resume content
    const resumeData = await this.getUserResumeContent(userId);

    if (!resumeData) {
      await onComplete(
        '请先上传您的简历文件，我才能帮您优化简历内容。您可以点击上传按钮或直接拖拽文件到聊天窗口。',
        { action: 'request_upload' }
      );
      return;
    }

    // Validate resume content
    if (!resumeData.content || resumeData.content.trim().length === 0) {
      this.logger.error(
        `Resume content is empty for user ${userId}, resumeId: ${resumeData.resumeId}`
      );
      await onComplete(
        '简历内容为空，无法进行优化。请重新上传简历或联系技术支持。',
        { error: true, action: 'content_empty' }
      );
      return;
    }

    this.logger.log(
      `Starting resume optimization for user ${userId}, content length: ${resumeData.content.length}`
    );

    // Send initial message
    onChunk({
      type: 'chunk',
      content: '收到！正在为您优化简历内容...\n\n',
      timestamp: Date.now(),
    });

    // Stream optimization
    let fullContent = '';

    try {
      const stream = this.resumeOptimizerService.optimizeResume(
        resumeData.content,
        userId,
        { language: 'zh-CN' }
      );

      for await (const chunk of stream) {
        if (chunk.type === 'chunk' && chunk.content) {
          fullContent += chunk.content;
          onChunk({
            type: 'chunk',
            content: chunk.content,
            timestamp: Date.now(),
          });
        } else if (chunk.type === 'error') {
          throw new Error(chunk.message || 'Optimization failed');
        }
      }

      // Add completion tips
      const tips = this.generateOptimizationTips(fullContent);
      const finalContent = fullContent + tips;

      this.logger.log(
        `Resume optimization completed for user ${userId}, output length: ${fullContent.length}`
      );

      await onComplete(finalContent, {
        type: 'optimization_result',
        resumeId: resumeData.resumeId,
        optimizedContent: fullContent,
      });
    } catch (error) {
      this.logger.error(
        `Resume optimization failed: ${error instanceof Error ? error.message : String(error)}`
      );
      await onComplete(
        `简历优化过程中出现错误：${error instanceof Error ? error.message : '未知错误'}。请稍后重试。`,
        { error: true }
      );
    }
  }

  /**
   * Handle mock interview request
   */
  private async handleMockInterview(
    userId: string,
    conversationId: string,
    userMessage: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个资深的面试官。请根据用户的简历内容，为用户进行一次模拟面试。你可以先提出一个面试问题，然后根据用户的回答进行追问或点评。';

    if (resumeData) {
      systemPrompt += `\n\n用户的简历内容如下：\n${resumeData.content}`;
    } else {
      systemPrompt +=
        '\n\n用户尚未上传简历。你可以先建议用户上传简历，或者先进行一些通用的面试准备问题。';
    }

    onChunk({
      type: 'chunk',
      content: '准备好了！让我们开始模拟面试吧。\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      userMessage,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'mock_interview' });
      }
    );
  }

  /**
   * Handle interview prediction request
   */
  private async handleInterviewPrediction(
    userId: string,
    conversationId: string,
    userMessage: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个专业的职业顾问和面试专家。请根据用户的简历内容，预测面试中可能出现的问题，并提供相应的回答建议和核心考点分析。';

    if (resumeData) {
      systemPrompt += `\n\n用户的简历内容如下：\n${resumeData.content}`;
    } else {
      systemPrompt +=
        '\n\n用户尚未上传简历。你可以先提供一些常见的通用面试问题预测，并建议用户上传简历以获取更精准的预测。';
    }

    onChunk({
      type: 'chunk',
      content: '正在为您分析简历并预测面试问题...\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      userMessage,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'interview_prediction' });
      }
    );
  }

  /**
   * Handle job description parsing request
   */
  private async handleParseJobDescription(
    userId: string,
    conversationId: string,
    userMessage: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const systemPrompt =
      '你是一个专业的职位分析专家。请帮用户解析职位描述（JD），提取出核心职责、技能要求、任职资格等关键信息，并给出简历投递的建议。';

    onChunk({
      type: 'chunk',
      content: '好的，请提供职位描述信息，我将为您进行深度解析。\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      userMessage,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'parse_job_description' });
      }
    );
  }

  private async handleCareerAdvice(
    userId: string,
    content: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个资深的职业发展顾问。请根据用户的背景和需求，提供专业的职业规划建议、行业发展趋势分析、职业转型指导等。';

    if (resumeData) {
      systemPrompt += `\n\n用户的简历内容摘要：\n${resumeData.content.substring(0, 800)}...`;
    }

    onChunk({
      type: 'chunk',
      content: '让我来为您提供职业发展建议...\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      content,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'career_advice' });
      }
    );
  }

  private async handleSkillAnalysis(
    userId: string,
    content: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个专业的技能评估专家。请分析用户的技能组合，识别优势和待提升领域，并提供针对性的技能发展建议。';

    if (resumeData) {
      systemPrompt += `\n\n用户的简历内容：\n${resumeData.content}`;
    } else {
      systemPrompt +=
        '\n\n用户尚未上传简历。请建议用户上传简历以获取更精准的技能分析。';
    }

    onChunk({
      type: 'chunk',
      content: '正在分析您的技能组合...\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      content,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'skill_analysis' });
      }
    );
  }

  private async handleSalaryNegotiation(
    userId: string,
    content: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个薪资谈判专家。请帮助用户了解市场薪资水平，制定薪资谈判策略，准备谈判话术，并提供应对不同情况的建议。';

    if (resumeData) {
      systemPrompt += `\n\n用户的简历内容摘要：\n${resumeData.content.substring(0, 500)}...`;
    }

    onChunk({
      type: 'chunk',
      content: '让我来帮您准备薪资谈判...\n\n',
      timestamp: Date.now(),
    });

    await this.streamAIResponse(
      userId,
      systemPrompt,
      content,
      onChunk,
      async (finalContent) => {
        await onComplete(finalContent, { type: 'salary_negotiation' });
      }
    );
  }

  private async handleFullOptimization(
    userId: string,
    content: string,
    metadata: Record<string, any> | undefined,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    onChunk({
      type: 'chunk',
      content: '正在启动多智能体团队进行深度简历优化...\n\n',
      timestamp: Date.now(),
    });

    if (this.useTeamAgents && this.teamTaskService?.isEnabled()) {
      try {
        const resumeData = await this.getUserResumeContent(userId);
        const jd = metadata?.jobDescription || metadata?.jd;

        if (!resumeData) {
          onChunk({
            type: 'chunk',
            content: '⚠️ 请先上传您的简历，以便进行深度优化分析。\n\n',
            timestamp: Date.now(),
          });
          await onComplete('请先上传简历后再进行深度优化。', {
            type: 'full_optimization',
            requiresResume: true,
          });
          return;
        }

        if (!jd) {
          onChunk({
            type: 'chunk',
            content: '⚠️ 请提供目标职位描述（JD），以便进行针对性优化。\n\n',
            timestamp: Date.now(),
          });
          await onComplete('请提供职位描述后再进行深度优化。', {
            type: 'full_optimization',
            requiresJD: true,
          });
          return;
        }

        onChunk({
          type: 'chunk',
          content: '📋 正在分析您的简历...\n',
          timestamp: Date.now(),
        });

        const result = await this.teamTaskService.executeFullResumeOptimization(
          {
            userId,
            taskType: ComplexTaskType.FULL_RESUME_OPTIMIZATION,
            resumeContent: resumeData.content,
            jobDescription: jd,
          }
        );

        if (result.success && result.data) {
          onChunk({
            type: 'chunk',
            content: '\n✅ 深度优化分析完成！\n\n',
            timestamp: Date.now(),
          });

          const output = this.formatTeamResult(result.data);
          await onComplete(output, {
            type: 'full_optimization',
            teamExecutionTime: result.executionTimeMs,
          });
        } else {
          await onComplete(
            `优化过程中遇到问题：${result.error || '未知错误'}，请稍后重试。`,
            {
              type: 'full_optimization',
              error: true,
            }
          );
        }
      } catch (error) {
        this.logger.error(
          `Full optimization failed: ${error instanceof Error ? error.message : String(error)}`
        );
        await onComplete(`深度优化失败，正在切换到标准模式...\n\n`, {
          type: 'full_optimization',
          fallback: true,
        });
      }
    } else {
      onChunk({
        type: 'chunk',
        content: '多智能体团队暂不可用，正在使用标准优化模式...\n\n',
        timestamp: Date.now(),
      });
      await this.handleOptimizeResume(userId, '', content, onChunk, onComplete);
    }
  }

  private async handleInterviewPreparation(
    userId: string,
    content: string,
    metadata: Record<string, any> | undefined,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    onChunk({
      type: 'chunk',
      content: '正在启动多智能体团队进行面试准备分析...\n\n',
      timestamp: Date.now(),
    });

    if (this.useTeamAgents && this.teamTaskService?.isEnabled()) {
      try {
        const resumeData = await this.getUserResumeContent(userId);
        const jd = metadata?.jobDescription || metadata?.jd;

        onChunk({
          type: 'chunk',
          content: '🎯 正在分析您的背景和目标职位...\n',
          timestamp: Date.now(),
        });

        const result = await this.teamTaskService.executeInterviewPreparation({
          userId,
          taskType: ComplexTaskType.INTERVIEW_PREPARATION,
          resumeContent: resumeData?.content,
          jobDescription: jd,
          additionalContext: metadata,
        });

        if (result.success && result.data) {
          onChunk({
            type: 'chunk',
            content: '\n✅ 面试准备分析完成！\n\n',
            timestamp: Date.now(),
          });

          const output = this.formatTeamResult(result.data);
          await onComplete(output, {
            type: 'interview_preparation',
            teamExecutionTime: result.executionTimeMs,
          });
        } else {
          await onComplete(
            `面试准备分析遇到问题：${result.error || '未知错误'}，请稍后重试。`,
            {
              type: 'interview_preparation',
              error: true,
            }
          );
        }
      } catch (error) {
        this.logger.error(
          `Interview preparation failed: ${error instanceof Error ? error.message : String(error)}`
        );
        await onComplete(`面试准备分析失败，请稍后重试。`, {
          type: 'interview_preparation',
          error: true,
        });
      }
    } else {
      await this.handleMockInterview(userId, '', content, onChunk, onComplete);
    }
  }

  private async handleCareerTransition(
    userId: string,
    content: string,
    metadata: Record<string, any> | undefined,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    onChunk({
      type: 'chunk',
      content: '正在启动多智能体团队进行职业转型分析...\n\n',
      timestamp: Date.now(),
    });

    if (this.useTeamAgents && this.teamTaskService?.isEnabled()) {
      try {
        const resumeData = await this.getUserResumeContent(userId);

        onChunk({
          type: 'chunk',
          content: '🔄 正在分析您的技能和转型路径...\n',
          timestamp: Date.now(),
        });

        const result =
          await this.teamTaskService.executeCareerTransitionAnalysis({
            userId,
            taskType: ComplexTaskType.CAREER_TRANSITION_ANALYSIS,
            resumeContent: resumeData?.content,
            additionalContext: {
              currentField: metadata?.currentField,
              targetField: metadata?.targetField,
            },
          });

        if (result.success && result.data) {
          onChunk({
            type: 'chunk',
            content: '\n✅ 职业转型分析完成！\n\n',
            timestamp: Date.now(),
          });

          const output = this.formatTeamResult(result.data);
          await onComplete(output, {
            type: 'career_transition',
            teamExecutionTime: result.executionTimeMs,
          });
        } else {
          await onComplete(
            `职业转型分析遇到问题：${result.error || '未知错误'}，请稍后重试。`,
            {
              type: 'career_transition',
              error: true,
            }
          );
        }
      } catch (error) {
        this.logger.error(
          `Career transition analysis failed: ${error instanceof Error ? error.message : String(error)}`
        );
        await onComplete(`职业转型分析失败，请稍后重试。`, {
          type: 'career_transition',
          error: true,
        });
      }
    } else {
      await this.handleCareerAdvice(userId, content, onChunk, onComplete);
    }
  }

  private async handleCompetitiveAnalysis(
    userId: string,
    content: string,
    metadata: Record<string, any> | undefined,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    onChunk({
      type: 'chunk',
      content: '正在启动多智能体团队进行竞争力分析...\n\n',
      timestamp: Date.now(),
    });

    if (this.useTeamAgents && this.teamTaskService?.isEnabled()) {
      try {
        const resumeData = await this.getUserResumeContent(userId);
        const jd = metadata?.jobDescription || metadata?.jd;

        if (!resumeData || !jd) {
          await onComplete(
            '竞争力分析需要您的简历和目标职位描述，请确保已上传简历并提供JD。',
            { type: 'competitive_analysis', requiresData: true }
          );
          return;
        }

        onChunk({
          type: 'chunk',
          content: '📊 正在分析您的竞争力...\n',
          timestamp: Date.now(),
        });

        const result = await this.teamTaskService.executeCompetitiveAnalysis({
          userId,
          taskType: ComplexTaskType.COMPETITIVE_ANALYSIS,
          resumeContent: resumeData.content,
          jobDescription: jd,
        });

        if (result.success && result.data) {
          onChunk({
            type: 'chunk',
            content: '\n✅ 竞争力分析完成！\n\n',
            timestamp: Date.now(),
          });

          const output = this.formatTeamResult(result.data);
          await onComplete(output, {
            type: 'competitive_analysis',
            teamExecutionTime: result.executionTimeMs,
          });
        } else {
          await onComplete(
            `竞争力分析遇到问题：${result.error || '未知错误'}，请稍后重试。`,
            {
              type: 'competitive_analysis',
              error: true,
            }
          );
        }
      } catch (error) {
        this.logger.error(
          `Competitive analysis failed: ${error instanceof Error ? error.message : String(error)}`
        );
        await onComplete(`竞争力分析失败，请稍后重试。`, {
          type: 'competitive_analysis',
          error: true,
        });
      }
    } else {
      await this.handleSkillAnalysis(userId, content, onChunk, onComplete);
    }
  }

  private formatTeamResult(data: any): string {
    const parts: string[] = [];

    if (data.analysis) {
      parts.push('## 📋 分析结果\n');
      if (data.analysis.resumeAnalysis) {
        parts.push('### 简历分析');
        parts.push(this.formatAnalysisSection(data.analysis.resumeAnalysis));
      }
      if (data.analysis.jdAnalysis) {
        parts.push('\n### 职位分析');
        parts.push(this.formatAnalysisSection(data.analysis.jdAnalysis));
      }
    }

    if (data.suggestions) {
      parts.push('\n## 💡 优化建议\n');
      parts.push(this.formatSuggestions(data.suggestions));
    }

    if (data.validation) {
      parts.push('\n## ✅ 质量检查\n');
      parts.push(this.formatValidation(data.validation));
    }

    if (data.finalOutput && typeof data.finalOutput === 'string') {
      parts.push('\n## 📝 详细内容\n');
      parts.push(data.finalOutput);
    }

    return parts.join('\n');
  }

  private formatAnalysisSection(data: any): string {
    if (typeof data === 'string') return data;
    const lines: string[] = [];
    if (data.skills) {
      lines.push(
        `- **技能**: ${Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}`
      );
    }
    if (data.strengths) {
      lines.push(
        `- **优势**: ${Array.isArray(data.strengths) ? data.strengths.join(', ') : data.strengths}`
      );
    }
    if (data.requiredSkills) {
      lines.push(
        `- **要求技能**: ${Array.isArray(data.requiredSkills) ? data.requiredSkills.join(', ') : data.requiredSkills}`
      );
    }
    return lines.join('\n');
  }

  private formatSuggestions(data: any): string {
    if (typeof data === 'string') return data;
    if (Array.isArray(data.suggestions)) {
      return data.suggestions
        .map(
          (s: any, i: number) =>
            `${i + 1}. ${typeof s === 'string' ? s : s.suggestion || s.message || JSON.stringify(s)}`
        )
        .join('\n');
    }
    if (data.improvedContent) {
      return data.improvedContent;
    }
    return JSON.stringify(data, null, 2);
  }

  private formatValidation(data: any): string {
    if (typeof data === 'string') return data;
    const lines: string[] = [];
    if (data.overallScore !== undefined) {
      lines.push(`- **综合评分**: ${data.overallScore}/100`);
    }
    if (data.isValid !== undefined) {
      lines.push(`- **验证结果**: ${data.isValid ? '✅ 通过' : '⚠️ 需要改进'}`);
    }
    if (Array.isArray(data.issues) && data.issues.length > 0) {
      lines.push(`- **发现的问题**: ${data.issues.length} 个`);
    }
    return lines.join('\n');
  }

  private async streamAIResponse(
    userId: string,
    systemPrompt: string,
    userMessage: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (finalContent: string) => Promise<void>
  ): Promise<void> {
    const prompt = `${systemPrompt}\n\n用户消息：${userMessage}\n\n请用中文回复：`;

    try {
      const aiRequest: AIRequest = {
        model: '',
        prompt,
        temperature: 0.7,
        maxTokens: 1500,
      };

      let fullContent = '';
      const stream = this.aiEngineService.stream(
        aiRequest,
        userId,
        PromptScenario.RESUME_OPTIMIZATION,
        'zh-CN'
      );

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
          onChunk({
            type: 'chunk',
            content: chunk.content,
            timestamp: Date.now(),
          });
        }
      }

      await onComplete(fullContent);
    } catch (error) {
      this.logger.error(
        `AI streaming failed: ${error instanceof Error ? error.message : String(error)}`
      );
      await onComplete('抱歉，处理您的请求时出现了问题，请稍后再试。');
    }
  }

  /**
   * Handle help request
   */
  private async handleHelp(
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    const helpContent = `
## 🎯 我可以帮您做什么？

### 📄 简历优化
- 上传您的简历，说"优化简历"或"简历优化"，我会帮您润色内容，提升竞争力。

### 📈 面试预测
- 基于您的背景和目标职位，预测面试中可能出现的问题，并提供核心考点分析。

### 🎭 模拟面试
- 进入实战演练，我将作为面试官与您对话，提供即时反馈和改进建议。

### 💼 职位输入
- 粘贴职位描述（JD），我将为您深度解析核心需求，并给出针对性的投递建议。

### 💡 使用技巧
1. **上传简历**：点击上传按钮或拖拽文件开始。
2. **选择功能**：点击欢迎卡片上的功能图标，或直接在输入框中说明您的需求。
3. **深度对话**：您可以对我的回答进行追问，获取更详细的建议。

有任何问题，随时问我！
`;

    await onComplete(helpContent, { type: 'help' });
  }

  /**
   * Handle general chat with AI
   */
  private async handleGeneralChat(
    userId: string,
    content: string,
    onChunk: (chunk: ChatResponse) => void,
    onComplete: (
      finalContent: string,
      metadata?: Record<string, any>
    ) => Promise<void>
  ): Promise<void> {
    // Check if user has resume context
    const resumeData = await this.getUserResumeContent(userId);

    let systemPrompt =
      '你是一个专业的简历优化助手，帮助用户改进简历内容、提供求职建议。';

    if (resumeData) {
      systemPrompt += `\n\n用户已上传简历，以下是简历内容摘要：\n${resumeData.content.substring(0, 500)}...`;
    } else {
      systemPrompt +=
        '\n\n用户尚未上传简历。如果用户询问简历相关问题，建议他们先上传简历。';
    }

    const prompt = `${systemPrompt}\n\n用户消息：${content}\n\n请用中文回复：`;

    try {
      const aiRequest: AIRequest = {
        model: '',
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
      };

      let fullContent = '';
      const stream = this.aiEngineService.stream(
        aiRequest,
        userId,
        PromptScenario.RESUME_OPTIMIZATION,
        'zh-CN'
      );

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;
          onChunk({
            type: 'chunk',
            content: chunk.content,
            timestamp: Date.now(),
          });
        }
      }

      await onComplete(fullContent, { type: 'general_chat' });
    } catch (error) {
      this.logger.error(
        `General chat failed: ${error instanceof Error ? error.message : String(error)}`
      );

      // Fallback response
      let fallbackResponse = '抱歉，我暂时无法处理您的请求。';

      if (!resumeData) {
        fallbackResponse =
          '您好！我是您的简历优化助手。请先上传您的简历，然后我可以帮您：\n\n1. 📝 优化简历内容\n2. 💡 提供求职建议\n3. 🎯 分析简历亮点\n\n请点击上传按钮开始吧！';
      }

      await onComplete(fallbackResponse, { type: 'fallback' });
    }
  }

  /**
   * Generate optimization tips based on content
   */
  private generateOptimizationTips(content: string): string {
    const sections = [
      { key: '基本信息', tip: '✅ 已优化基本信息，增强了个人联系方式的排版' },
      { key: '专业总结', tip: '✅ 已优化专业总结，提升了核心竞争力的表达' },
      { key: '工作经历', tip: '✅ 已优化工作经历，强化了量化成果和技术关键词' },
      { key: '教育背景', tip: '✅ 已优化教育背景，整理了学术成就和荣誉' },
      {
        key: '项目经验',
        tip: '✅ 已优化项目经验，突出了个人在项目中的核心贡献',
      },
      { key: '技能列表', tip: '✅ 已优化技能列表，按专业类别进行了结构化分类' },
    ];

    const activeTips: string[] = [];
    sections.forEach((section) => {
      if (content.includes(section.key)) {
        activeTips.push(section.tip);
      }
    });

    if (activeTips.length === 0) return '';

    return (
      '\n\n---\n' +
      activeTips.join('\n') +
      '\n\n**✨ 简历优化完成！您可以点击下方按钮查看对比或下载结果。**'
    );
  }

  /**
   * Convert parsed resume data to markdown
   */
  private convertParsedDataToMarkdown(parsedData: any): string {
    if (!parsedData) return '';

    const parts: string[] = [];

    // Handle different parsedData formats
    // Some resumes might have markdown field directly
    if (typeof parsedData === 'string') {
      return parsedData;
    }

    if (parsedData.markdown && typeof parsedData.markdown === 'string') {
      return parsedData.markdown;
    }

    if (
      parsedData.extractedText &&
      typeof parsedData.extractedText === 'string'
    ) {
      return parsedData.extractedText;
    }

    // Personal Info
    if (parsedData.personalInfo) {
      const info = parsedData.personalInfo;
      parts.push(`# ${info.name || '简历'}\n`);
      if (info.email) parts.push(`📧 ${info.email}`);
      if (info.phone) parts.push(`📱 ${info.phone}`);
      if (info.location) parts.push(`📍 ${info.location}`);
      parts.push('');
    }

    // Summary
    if (parsedData.summary) {
      parts.push('## 专业总结\n');
      parts.push(parsedData.summary);
      parts.push('');
    }

    // Experience
    if (parsedData.experience?.length > 0) {
      parts.push('## 工作经历\n');
      parsedData.experience.forEach((exp: any) => {
        parts.push(`### ${exp.position} @ ${exp.company}`);
        parts.push(`*${exp.startDate} - ${exp.endDate || '至今'}*\n`);
        if (exp.description?.length > 0) {
          exp.description.forEach((desc: string) => parts.push(`- ${desc}`));
        }
        parts.push('');
      });
    }

    // Education
    if (parsedData.education?.length > 0) {
      parts.push('## 教育背景\n');
      parsedData.education.forEach((edu: any) => {
        parts.push(`### ${edu.degree} - ${edu.field}`);
        parts.push(`${edu.institution} | ${edu.startDate} - ${edu.endDate}`);
        parts.push('');
      });
    }

    // Skills
    if (parsedData.skills?.length > 0) {
      parts.push('## 技能列表\n');
      parts.push(parsedData.skills.join('、'));
      parts.push('');
    }

    // Projects
    if (parsedData.projects?.length > 0) {
      parts.push('## 项目经验\n');
      parsedData.projects.forEach((proj: any) => {
        parts.push(`### ${proj.name}`);
        parts.push(proj.description);
        if (proj.technologies?.length > 0) {
          parts.push(`**技术栈**: ${proj.technologies.join(', ')}`);
        }
        parts.push('');
      });
    }

    const result = parts.join('\n');

    // If we couldn't extract any content, try to stringify the data
    if (!result || result.trim().length === 0) {
      this.logger.warn(
        'Could not convert parsedData to markdown, using JSON fallback'
      );
      return JSON.stringify(parsedData, null, 2);
    }

    return result;
  }
}
