import { AIEngine, AIService } from '@/core/ai';
import { PromptService } from '@/core/prompts';
import { QuotaService } from '@/core/quota/quota.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { ParsedJobData, ParsedResumeData } from '@/types';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InterviewMessage,
  InterviewMode,
  InterviewQuestion,
  InterviewSession,
  InterviewStatus,
  MessageRole,
} from '@prisma/client';
import {
  CreateSessionDto,
  InterviewMode as InterviewModeEnum,
} from '../dto/create-session.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class InterviewSessionService {
  private readonly logger = new Logger(InterviewSessionService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private quotaService: QuotaService,
    private voiceService: AlibabaVoiceService,
    private promptService: PromptService
  ) { }

  /**
   * Start a new interview session
   */
  async startSession(
    userId: string,
    createSessionDto: CreateSessionDto
  ): Promise<{
    session: InterviewSession;
    firstQuestion: InterviewQuestion | null;
  }> {
    await this.quotaService.enforceInterviewQuota(userId);

    const { optimizationId, voiceId, personaId, mode, language } =
      createSessionDto;

    // Map DTO mode to Prisma enum
    const sessionMode =
      mode === InterviewModeEnum.ASSIST
        ? InterviewMode.ASSIST
        : InterviewMode.MOCK;
    // Map DTO language to Prisma enum
    const sessionLanguage = language === 'zh' ? 'ZH' : 'EN';

    if (voiceId) {
      const voices = await this.voiceService.getVoices(userId);
      const voiceExists = voices.some(
        (v: any) => v.id === voiceId || v.voiceCode === voiceId
      );
      if (!voiceExists) {
        throw new NotFoundException(
          `Voice with ID or Code ${voiceId} not found`
        );
      }
    }

    if (personaId) {
      const persona = await this.prisma.interviewerPersona.findUnique({
        where: { id: personaId },
      });
      if (!persona || !persona.isActive) {
        throw new NotFoundException(
          `Interviewer persona with ID ${personaId} not found or inactive`
        );
      }
    }

    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
      include: {
        resume: true,
        job: true,
      },
    });

    if (!optimization) {
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`
      );
    }

    if (optimization.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this optimization'
      );
    }

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        optimizationId,
        voiceId: createSessionDto.voiceId,
        personaId: createSessionDto.personaId,
        mode: sessionMode,
        language: sessionLanguage,
        status: InterviewStatus.IN_PROGRESS,
      },
      include: {
        messages: true,
      },
    });

    await this.quotaService.incrementInterviewCount(userId);

    if (personaId) {
      await this.prisma.interviewerPersona.update({
        where: { id: personaId },
        data: { usageCount: { increment: 1 } },
      });
    }

    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    // For ASSIST mode, don't return预设 questions - user will input questions
    // For MOCK mode, return the first question
    const firstQuestion =
      sessionMode === InterviewMode.MOCK && questions.length > 0
        ? questions[0]
        : null;

    return {
      session,
      firstQuestion,
    };
  }

  /**
   * Submit an answer and get the next question
   */
  async submitAnswer(
    userId: string,
    sessionId: string,
    content: string,
    audioUrl?: string
  ): Promise<{ nextQuestion: InterviewQuestion | null; isCompleted: boolean }> {
    // Verify session exists and belongs to user
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    if (session.status !== InterviewStatus.IN_PROGRESS) {
      throw new ForbiddenException('Interview session is not in progress');
    }

    // Save user answer
    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content,
        audioUrl,
      },
    });

    // Determine next question
    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId: session.optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    // Count answers (user messages)
    const answerCount =
      session.messages.filter((m) => m.role === MessageRole.USER).length + 1; // +1 for the one just added? No, session.messages is stale.
    // Actually session.messages doesn't include the one we just added.
    // So current count is session.messages (user) + 1.

    if (answerCount < questions.length) {
      return { nextQuestion: questions[answerCount], isCompleted: false };
    } else {
      // Completed all questions
      // Mark session as completed? Or wait for explicit end?
      // Controller says "isCompleted".
      // Maybe we don't close it yet, but return null.
      return { nextQuestion: null, isCompleted: true };
    }
  }

  /**
   * Get current session state
   */
  async getSessionState(
    userId: string,
    sessionId: string
  ): Promise<{
    session: InterviewSession;
    currentQuestion: InterviewQuestion | null;
    progress: number;
    total: number;
  }> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId: session.optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    const answerCount = session.messages.filter(
      (m) => m.role === MessageRole.USER
    ).length;

    return {
      session,
      currentQuestion:
        answerCount < questions.length ? questions[answerCount] : null,
      progress: answerCount,
      total: questions.length,
    };
  }

  /**
   * Handle user message in interview session (Chat Mode)
   */
  async handleMessage(
    userId: string,
    sessionId: string,
    sendMessageDto: SendMessageDto
  ): Promise<{
    userMessage: InterviewMessage;
    aiMessage: InterviewMessage;
  }> {
    const { content, audioUrl } = sendMessageDto;

    // Verify session exists and belongs to user
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        optimization: {
          include: {
            resume: true,
            job: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    if (session.status !== InterviewStatus.IN_PROGRESS) {
      throw new ForbiddenException('Interview session is not in progress');
    }

    // Save user message
    const userMessage = await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content,
        audioUrl,
      },
    });

    // Get resume and job data
    const resumeData = session.optimization.resume
      .parsedData as unknown as ParsedResumeData;
    const jobData = session.optimization.job
      .parsedRequirements as unknown as ParsedJobData;

    let aiResponse: string;

    if (session.mode === InterviewMode.ASSIST) {
      // ASSIST 模式：用户输入面试官问题，AI 生成参考答案
      aiResponse = await this.generateAssistAnswer(
        content, // 用户输入的面试官问题
        resumeData,
        jobData,
        session.language
      );
    } else {
      // MOCK 模式：AI 作为面试官继续提问
      aiResponse = await this.generateMockResponse(
        session,
        content,
        resumeData,
        jobData
      );
    }

    const aiMessage = await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: aiResponse,
      },
    });

    return { userMessage, aiMessage };
  }

  /**
   * 生成辅助面试答案 (ASSIST 模式)
   * 用户输入面试官问题，AI 生成参考答案
   */
  private async generateAssistAnswer(
    question: string,
    resumeData: ParsedResumeData,
    jobData: ParsedJobData,
    language: string
  ): Promise<string> {
    // 使用 PromptService 获取多语言标签
    const labels = this.promptService.getInterviewLabels(language as any);
    const fallbackResponse = this.promptService.getFallbackResponse(language as any);
    const isZh = language === 'ZH';

    try {
      const resumeText = JSON.stringify({
        name: resumeData.personalInfo?.name || 'Candidate',
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
      });

      const jobDescription = JSON.stringify({
        title: jobData.title || '',
        company: jobData.company || '',
        requiredSkills: jobData.requiredSkills || [],
        responsibilities: jobData.responsibilities || [],
      });

      const result = await this.aiService.executeSkill(
        'interview-assistant',
        {
          question,
          resume: resumeText,
          jobDescription,
          selfIntroduction: '',
          interviewType: 'technical',
          language: isZh ? 'zh' : 'en',
        },
        ''
      );

      if (result.success && result.data) {
        const data = result.data as any;
        // 格式化输出为易读的文本
        let formattedAnswer = `📝 **${labels.question}**: ${question}\n\n`;

        if (data.suggestedAnswer) {
          formattedAnswer += `💡 **${labels.referenceAnswer}**:\n${data.suggestedAnswer}\n\n`;
        }

        if (data.keyPoints && data.keyPoints.length > 0) {
          formattedAnswer += `📌 **${labels.keyPoints}**:\n${data.keyPoints.map((p: string) => `• ${p}`).join('\n')}\n\n`;
        }

        if (data.estimatedTime) {
          formattedAnswer += `⏱️ **${labels.estimatedTime}**: ${data.estimatedTime}\n`;
        }

        if (data.tips && data.tips.length > 0) {
          formattedAnswer += `\n💡 **${labels.tips}**: ${data.tips.join(' | ')}`;
        }

        if (data.redFlags && data.redFlags.length > 0) {
          formattedAnswer += `\n⚠️ **${labels.avoid}**: ${data.redFlags.join(' | ')}`;
        }

        return formattedAnswer;
      }

      // 如果 skill 执行失败，返回简单响应
      // 如果 skill 执行失败，返回简单响应
      return language === 'ZH'
        ? `收到问题: ${question}\n\n请稍等，我正在生成参考答案...`
        : `Received question: ${question}\n\nPlease wait, generating reference answer...`;
    } catch (error) {
      this.logger.error('Failed to generate assist answer:', error);
      return fallbackResponse;
    }
  }

  /**
   * 生成模拟面试回答 (MOCK 模式)
   * AI 作为面试官，根据用户回答继续提问
   */
  private async generateMockResponse(
    session: any,
    userAnswer: string,
    resumeData: ParsedResumeData,
    jobData: ParsedJobData
  ): Promise<string> {
    const requirements = [
      ...(jobData.requiredSkills || []),
      ...(jobData.responsibilities || []),
    ].join('; ');

    // 使用多语言提示词
    const language = session.language || 'EN';
    const prompts = this.promptService.getInterviewMockPrompts(language);

    const context = prompts.context({
      candidateName: resumeData.personalInfo?.name || 'Candidate',
      jobTitle: jobData.title || 'Target Position',
      company: jobData.company || 'Target Company',
      requirements: requirements.substring(0, 500),
    });

    const history = session.messages.map((m: any) => ({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const aiEngine = new AIEngine(this.aiService, this.promptService);
      const aiResponse = await aiEngine.chatWithInterviewer(
        prompts.system + '\n\n' + context,
        userAnswer,
        history
      );
      return aiResponse;
    } catch (error) {
      this.logger.error('Failed to generate mock response:', error);
      return language === 'ZH'
        ? '谢谢你的回答。能告诉我更多关于...'
        : 'Thank you for your answer. Could you tell me more about...';
    }
  }

  /**
   * End interview session
   */
  async endSession(
    userId: string,
    endSessionDto: EndSessionDto
  ): Promise<InterviewSession> {
    const { sessionId } = endSessionDto;

    // Verify session exists and belongs to user
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    // Update status
    const completedSession = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: InterviewStatus.COMPLETED,
        endTime: new Date(),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        optimization: {
          include: {
            resume: true,
            job: true,
          },
        },
      },
    });

    // Generate feedback asynchronously
    this.generateFeedback(completedSession).catch((err) =>
      this.logger.error(
        `Failed to generate feedback for session ${sessionId}`,
        err
      )
    );

    return completedSession;
  }

  /**
   * Get session details
   */
  async getSession(
    userId: string,
    sessionId: string
  ): Promise<InterviewSession> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this session'
      );
    }

    return session;
  }

  /**
   * Get active session for an optimization
   */
  async getActiveSessionByOptimization(
    userId: string,
    optimizationId: string
  ): Promise<InterviewSession | null> {
    // Verify user owns the optimization
    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
    });

    if (!optimization) {
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`
      );
    }

    if (optimization.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this optimization'
      );
    }

    // Find most recent IN_PROGRESS session
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        userId,
        optimizationId,
        status: InterviewStatus.IN_PROGRESS,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return session;
  }

  /**
   * Transcribe audio file
   */
  async transcribeAudio(file: Express.Multer.File): Promise<{ text: string }> {
    const text = await this.voiceService.transcribeAudio(file.buffer);
    return { text };
  }

  private async generateFeedback(session: any) {
    const resumeData = session.optimization.resume
      .parsedData as unknown as ParsedResumeData;
    const jobData = session.optimization.job
      .parsedRequirements as unknown as ParsedJobData;

    // Use session.optimization.job.title/company
    const jobTitle = session.optimization.job.title || 'Unknown Role';
    const company = session.optimization.job.company || 'Unknown Company';

    const requirements = [
      ...(jobData.requiredSkills || []),
      ...(jobData.responsibilities || []),
    ].join('; ');

    const transcript = session.messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    // 使用多语言提示词
    const language = session.language || 'EN';
    const prompt = this.promptService.buildFeedbackPrompt(
      {
        jobTitle,
        company,
        requirements: requirements.substring(0, 500),
        candidateName: resumeData.personalInfo?.name || 'Candidate',
        transcript,
      },
      language
    );

    try {
      const { Models } = await import('@/core/ai/models');
      const result = await this.aiService.generate(
        Models.InterviewPrep,
        prompt,
        ''
      );

      // Parse JSON from result
      // Assuming result is a string that might contain JSON
      let parsedResult: { score: number; feedback: string };
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        // Fallback if parsing fails
        parsedResult = {
          score: 70,
          feedback: result,
        };
      }

      await this.prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          score: parsedResult.score,
          feedback: parsedResult.feedback,
        },
      });
    } catch (error) {
      this.logger.error('Error generating feedback:', error);
    }
  }
}
