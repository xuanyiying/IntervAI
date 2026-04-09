import { AIService } from '@/core/ai/ai.service';
import { PromptService } from '@/core/prompts';
import { QuotaService } from '@/core/quota/quota.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { ParsedJobData, ParsedResumeData } from '@/types';
import { InterviewAIService } from './interview-ai.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private promptService: PromptService,
    private interviewAI: InterviewAIService,
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

    const sessionMode =
      mode === InterviewModeEnum.ASSIST
        ? InterviewMode.ASSIST
        : InterviewMode.MOCK;
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

    if (!optimizationId && sessionMode === InterviewMode.MOCK) {
      throw new BadRequestException(
        'optimizationId is required for mock interview mode'
      );
    }

    let effectiveOptimizationId = optimizationId;
    if (optimizationId) {
      const optimization = await this.prisma.optimization.findUnique({
        where: { id: optimizationId },
        include: { resume: true, job: true },
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
    }

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        optimizationId: effectiveOptimizationId ?? null,
        voiceId: createSessionDto.voiceId,
        personaId: createSessionDto.personaId,
        mode: sessionMode,
        language: sessionLanguage,
        status: InterviewStatus.IN_PROGRESS,
      },
      include: { messages: true },
    });

    await this.quotaService.incrementInterviewCount(userId);

    if (personaId) {
      await this.prisma.interviewerPersona.update({
        where: { id: personaId },
        data: { usageCount: { increment: 1 } },
      });
    }

    let firstQuestion: InterviewQuestion | null = null;
    if (effectiveOptimizationId) {
      const questions = await this.prisma.interviewQuestion.findMany({
        where: { optimizationId: effectiveOptimizationId },
        orderBy: { createdAt: 'asc' },
      });

      if (sessionMode === InterviewMode.MOCK && questions.length > 0) {
        firstQuestion = questions[0];
      }
    }

    return { session, firstQuestion };
  }

  /**
   * Submit an answer and get the next question
   */
  async submitAnswer(
    userId: string,
    sessionId: string,
    content: string,
    audioUrl?: string
  ): Promise<{
    nextQuestion: InterviewQuestion | null;
    isCompleted: boolean;
    evaluation?: { score: number; feedback: string };
  }> {
    // Verify session exists and belongs to user
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: true,
        optimization: {
          include: {
            resume: true,
            job: true,
          },
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

    // Save user answer
    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content,
        audioUrl,
      },
    });

    // Trigger evaluation asynchronously to avoid blocking the WS gateway response
    this.triggerAsyncEvaluation(session, content, sessionId);

    const questions = session.optimizationId
      ? await this.prisma.interviewQuestion.findMany({
        where: { optimizationId: session.optimizationId },
        orderBy: { createdAt: 'asc' },
      })
      : [];

    const answerCount =
      session.messages.filter((m) => m.role === MessageRole.USER).length + 1;

    if (answerCount < questions.length) {
      return {
        nextQuestion: questions[answerCount],
        isCompleted: false,
      };
    } else {
      return {
        nextQuestion: null,
        isCompleted: true,
      };
    }
  }

  /**
   * Run evaluation in background without blocking response
   */
  private async triggerAsyncEvaluation(session: any, content: string, sessionId: string) {
    try {
      const resumeData = session.optimization.resume?.parsedData as unknown as
        | ParsedResumeData
        | undefined;
      const jobData = session.optimization.job
        ?.parsedRequirements as unknown as ParsedJobData | undefined;

      const questions = await this.prisma.interviewQuestion.findMany({
        where: { optimizationId: session.optimizationId },
        orderBy: { createdAt: 'asc' },
      });

      const answerCount =
        session.messages.filter((m: any) => m.role === MessageRole.USER).length;
      const questionText =
        questions[answerCount - 1]?.question || 'Unknown question';

      if (resumeData && jobData && questionText !== 'Unknown question') {
        const evalResult = await this.aiService.executeSkill(
          'answer-evaluator',
          {
            question: questionText,
            answer: content,
            resumeData: JSON.stringify({
              skills: resumeData?.skills || [],
              experience: resumeData?.experience || [],
              projects: resumeData?.projects || [],
            }),
            jobDescription: JSON.stringify({
              title: jobData?.title || '',
              company: jobData?.company || '',
              requiredSkills: jobData?.requiredSkills || [],
              responsibilities: jobData?.responsibilities || [],
            }),
            language: session.language === 'ZH' ? 'zh' : 'en',
          },
          ''
        );

        if (evalResult.success && evalResult.data) {
          const evalData = evalResult.data as any;
          const evaluationScore = evalData.overallScore ?? evalData.score ?? null;
          const evaluationFeedback =
            evalData.feedback ??
            evalData.detailedFeedback ??
            JSON.stringify(evalData);

          await this.prisma.interviewMessage.create({
            data: {
              sessionId,
              role: MessageRole.ASSISTANT,
              content: `📊 **评分**: ${evaluationScore}/100\n\n${evaluationFeedback}`,
            },
          });
        }
      }
    } catch (evalError) {
      this.logger.warn(`Async evaluation failed for session ${sessionId}`, evalError);
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

    const questions = session.optimizationId
      ? await this.prisma.interviewQuestion.findMany({
        where: { optimizationId: session.optimizationId },
        orderBy: { createdAt: 'asc' },
      })
      : [];

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
    const optimization = session.optimization;
    const resumeData = optimization?.resume
      ?.parsedData as unknown as ParsedResumeData | undefined;
    const jobData = optimization?.job
      ?.parsedRequirements as unknown as ParsedJobData | undefined;

    let aiResponse: string;

    if (session.mode === InterviewMode.ASSIST) {
      aiResponse = await this.generateAssistAnswer(
        content,
        resumeData ?? {} as ParsedResumeData,
        jobData ?? {} as ParsedJobData,
        session.language
      );
    } else {
      aiResponse = await this.generateMockResponse(
        session,
        content,
        resumeData ?? {} as ParsedResumeData,
        jobData ?? {} as ParsedJobData
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
    const fallbackResponse = this.promptService.getFallbackResponse(
      language as any
    );
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

      // Use summary or markdown from parsedData as self-introduction context
      const selfIntroduction =
        resumeData.summary || resumeData.markdown || '';

      const result = await this.aiService.executeSkill(
        'interview-assistant',
        {
          question,
          resume: resumeText,
          jobDescription,
          selfIntroduction,
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
      const aiResponse = await this.interviewAI.chatWithInterviewer(
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
      const { AI_MODEL } = await import('@/core/ai/models');
      const result = await this.aiService.generate(
        AI_MODEL,
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

  async *streamAnswer(
    userId: string,
    sessionId: string,
    question: string
  ): AsyncGenerator<string> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        optimization: {
          include: {
            resume: true,
            job: true,
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
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
      throw new ForbiddenException('Session is not in progress');
    }

    const resumeData = session.optimization?.resume
      ?.parsedData as unknown as ParsedResumeData;
    const jobData = session.optimization?.job
      ?.parsedRequirements as unknown as ParsedJobData;

    const resumeText = JSON.stringify({
      name: resumeData?.personalInfo?.name || 'Candidate',
      skills: resumeData?.skills || [],
      experience: resumeData?.experience || [],
      projects: resumeData?.projects || [],
    });

    const jobDescription = JSON.stringify({
      title: jobData?.title || '',
      company: jobData?.company || '',
      requiredSkills: jobData?.requiredSkills || [],
      responsibilities: jobData?.responsibilities || [],
    });

    const isZh = session.language === 'ZH';

    let fullAnswer = '';

    const { AI_MODEL } = await import('@/core/ai/models');
    const systemPrompt = isZh
      ? '你是一位经验丰富的面试辅导专家。根据候选人的简历和目标职位，为面试问题提供专业、有深度的参考答案。'
      : "You are an experienced interview coach. Based on the candidate's resume and target position, provide professional and insightful reference answers to interview questions.";

    const userPrompt = isZh
      ? `简历信息：${resumeText}\n\n目标职位：${jobDescription}\n\n面试官问题：${question}\n\n请提供参考答案：`
      : `Resume: ${resumeText}\n\nTarget Position: ${jobDescription}\n\nInterviewer Question: ${question}\n\nPlease provide a reference answer:`;

    const chatHistory = session.messages.map((m: any) => ({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content
    }));

    // Prevent malicious infinite loops on Free tier or unlimited tier (protects memory)
    if (chatHistory.length > 30) {
      this.logger.warn(`Session ${sessionId} reached 30 turns. Terminating stream.`);
      yield isZh ? "本次会话已达到最大对话回合限制，请开启新一轮面试。" : "This session has reached the maximum turn limit. Please start a new interview.";
      return;
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userPrompt }
    ];

    for await (const chunk of this.aiService.stream(
      AI_MODEL,
      messages,
      { userId }
    )) {
      fullAnswer += chunk;
      yield chunk;
    }

    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content: question,
      },
    });

    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: fullAnswer,
      },
    });
  }

  private getEvaluationFeedback(feedback: string | null): string {
    return feedback || 'No feedback available';
  }
}
