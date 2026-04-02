import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AIService, Models } from '@/core/ai';
import { QuotaService } from '@/core/quota/quota.service';
import {
  InterviewSession,
  InterviewMessage,
  InterviewStatus,
  MessageRole,
} from '@prisma/client';
import { CreateRealtimeSessionDto, AnswerStyle } from '../dto/create-realtime-session.dto';
import { SendRealtimeQuestionDto } from '../dto/send-realtime-question.dto';
import * as fs from 'fs';
import * as path from 'path';

const REALTIME_SESSION_PREFIX = '[Realtime Assistant] ';

@Injectable()
export class RealtimeInterviewService {
  private readonly logger = new Logger(RealtimeInterviewService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private quotaService: QuotaService
  ) {}

  private loadPromptTemplate(name: string): string {
    const promptPath = path.join(process.cwd(), 'prompts', `${name}.st`);
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      this.logger.warn(`Could not load prompt template ${name}, using fallback`);
      return '';
    }
  }

  private formatAnswerStyle(style: AnswerStyle): string {
    const styleMap = {
      [AnswerStyle.CONCISE]: '简洁（约100-200字）',
      [AnswerStyle.DETAILED]: '详细（约300-500字）',
      [AnswerStyle.PROFESSIONAL]: '专业',
      [AnswerStyle.CASUAL]: '轻松',
    };
    return styleMap[style] || styleMap[AnswerStyle.PROFESSIONAL];
  }

  async createSession(
    userId: string,
    dto: CreateRealtimeSessionDto
  ): Promise<InterviewSession> {
    await this.quotaService.enforceInterviewQuota(userId);

    let resumeData = '';
    let jobDescription = '';

    if (dto.resumeId) {
      const resume = await this.prisma.resume.findUnique({
        where: { id: dto.resumeId },
      });
      if (resume && resume.userId === userId) {
        resumeData = resume.extractedText || JSON.stringify(resume.parsedData) || '';
      }
    }

    if (dto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: dto.jobId },
      });
      if (job && job.userId === userId) {
        jobDescription = `职位: ${job.title}\n公司: ${job.company}\n描述: ${job.jobDescription}\n要求: ${job.requirements}`;
      }
    }

    if (dto.resumeData) {
      resumeData = dto.resumeData;
    }

    if (dto.jobDescription) {
      jobDescription = dto.jobDescription;
    }

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        optimizationId: 'realtime-' + Date.now(),
        status: InterviewStatus.IN_PROGRESS,
      },
    });

    await this.quotaService.incrementInterviewCount(userId);

    await this.prisma.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: MessageRole.SYSTEM,
        content: JSON.stringify({
          type: 'realtime_assistant',
          title: dto.title,
          answerStyle: dto.answerStyle || AnswerStyle.PROFESSIONAL,
          resumeData,
          jobDescription,
        }),
      },
    });

    return session;
  }

  async sendQuestion(
    userId: string,
    sessionId: string,
    dto: SendRealtimeQuestionDto
  ): Promise<{ userMessage: InterviewMessage; aiAnswer: string }> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
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

    const systemMessage = session.messages.find(
      (m) => m.role === MessageRole.SYSTEM
    );
    if (!systemMessage) {
      throw new ForbiddenException('Invalid session type');
    }

    const config = JSON.parse(systemMessage.content);
    if (config.type !== 'realtime_assistant') {
      throw new ForbiddenException('This is not a realtime assistant session');
    }

    const userMessage = await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content: dto.question,
        audioUrl: dto.audioUrl,
      },
    });

    const systemPrompt = this.loadPromptTemplate('realtime-interview-assistant-system');
    const userPromptTemplate = this.loadPromptTemplate('realtime-interview-assistant-user');

    const userPrompt = userPromptTemplate
      .replace('{{resumeData}}', config.resumeData || '未提供')
      .replace('{{jobDescription}}', config.jobDescription || '未提供')
      .replace('{{answerStyle}}', this.formatAnswerStyle(config.answerStyle))
      .replace('{{question}}', dto.question);

    const aiResponse = await this.aiService.chat(
      Models.Chat,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, userId }
    );

    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: aiResponse.content,
      },
    });

    return { userMessage, aiAnswer: aiResponse.content };
  }

  async *streamAnswer(
    userId: string,
    sessionId: string,
    question: string
  ): AsyncGenerator<string> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
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

    const systemMessage = session.messages.find(
      (m) => m.role === MessageRole.SYSTEM
    );
    if (!systemMessage) {
      throw new ForbiddenException('Invalid session type');
    }

    const config = JSON.parse(systemMessage.content);
    if (config.type !== 'realtime_assistant') {
      throw new ForbiddenException('This is not a realtime assistant session');
    }

    const systemPrompt = this.loadPromptTemplate('realtime-interview-assistant-system');
    const userPromptTemplate = this.loadPromptTemplate('realtime-interview-assistant-user');

    const userPrompt = userPromptTemplate
      .replace('{{resumeData}}', config.resumeData || '未提供')
      .replace('{{jobDescription}}', config.jobDescription || '未提供')
      .replace('{{answerStyle}}', this.formatAnswerStyle(config.answerStyle))
      .replace('{{question}}', question);

    let fullAnswer = '';

    for await (const chunk of this.aiService.stream(
      Models.Chat,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
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

  async getSession(
    userId: string,
    sessionId: string
  ): Promise<InterviewSession & { messages: InterviewMessage[] }> {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
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

  async getUserSessions(userId: string): Promise<InterviewSession[]> {
    const sessions = await this.prisma.interviewSession.findMany({
      where: { userId },
      include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.filter((session) => {
      const systemMessage = session.messages[0];
      if (systemMessage?.role === MessageRole.SYSTEM) {
        try {
          const config = JSON.parse(systemMessage.content);
          return config.type === 'realtime_assistant';
        } catch {
          return false;
        }
      }
      return false;
    }).map(({ messages, ...session }) => session);
  }

  async endSession(
    userId: string,
    sessionId: string
  ): Promise<InterviewSession> {
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

    return this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: InterviewStatus.COMPLETED,
        endTime: new Date(),
      },
    });
  }
}
