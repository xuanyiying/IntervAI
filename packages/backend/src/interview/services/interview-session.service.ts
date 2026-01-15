import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { InterviewQuestionService } from './interview-question.service';
import { QuotaService } from '@/quota/quota.service';
import {
  InterviewSession,
  InterviewStatus,
  MessageRole,
  InterviewQuestion,
} from '@prisma/client';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class InterviewSessionService {
  private readonly logger = new Logger(InterviewSessionService.name);
  private readonly CACHE_TTL = 3600 * 24; // 24 hours

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private questionService: InterviewQuestionService,
    private quotaService: QuotaService,
    @InjectQueue('interview-evaluation') private evaluationQueue: Queue
  ) {}

  /**
   * Start a new interview session
   * Generates questions and initializes Redis cache
   */
  async startSession(
    userId: string,
    createSessionDto: CreateSessionDto
  ): Promise<{ session: InterviewSession; firstQuestion: InterviewQuestion }> {
    // Check quota
    await this.quotaService.enforceInterviewQuota(userId);

    const { optimizationId } = createSessionDto;

    // Verify ownership
    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
    });

    if (!optimization) {
      throw new NotFoundException(`Optimization ${optimizationId} not found`);
    }
    if (optimization.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Generate questions
    const questions = await this.questionService.generateQuestions(
      optimizationId,
      userId
    );

    if (!questions || questions.length === 0) {
      throw new BadRequestException('Failed to generate interview questions');
    }

    // Create Session in DB
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        optimizationId,
        status: InterviewStatus.IN_PROGRESS,
        startTime: new Date(),
      },
    });

    // Initialize Redis Cache
    const cacheKey = `interview:session:${session.id}`;
    const sessionState = {
      currentIndex: 0,
      totalQuestions: questions.length,
      questions: JSON.stringify(questions),
      status: InterviewStatus.IN_PROGRESS,
    };

    await this.redisService.set(
      cacheKey,
      JSON.stringify(sessionState),
      this.CACHE_TTL
    );

    // Increment usage
    await this.quotaService.incrementInterviewCount(userId);

    return {
      session,
      firstQuestion: questions[0],
    };
  }

  /**
   * Submit an answer and get the next question
   */
  async submitAnswer(
    userId: string,
    sessionId: string,
    answerContent: string,
    audioUrl?: string
  ): Promise<{ nextQuestion: InterviewQuestion | null; isCompleted: boolean }> {
    // Validate Session from Redis (Fast path)
    const cacheKey = `interview:session:${sessionId}`;
    const cachedState = await this.redisService.get(cacheKey);

    if (!cachedState) {
      // Fallback to DB check (restore session) if cache missing
      // For now, simple throw or basic restore could go here.
      throw new NotFoundException('Session expired or not found');
    }

    const state = JSON.parse(cachedState);
    const questions: InterviewQuestion[] = JSON.parse(state.questions);
    const currentIndex = state.currentIndex;

    // Verify User (DB check needed for security unless we cache userId too)
    // Optimizing: We can cache userId in Redis state to avoid DB hit.
    // For now, let's do a quick DB check or assume session ID is secret enough.
    // Better: Check DB ownership once.
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, status: true },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId)
      throw new ForbiddenException('Access denied');
    if (session.status !== InterviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    // Save Answer to DB
    // We save it as a Message with Role USER
    await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content: answerContent,
        audioUrl,
      },
    });

    // Move to next question
    const nextIndex = currentIndex + 1;
    state.currentIndex = nextIndex;

    // Check completion
    if (nextIndex >= questions.length) {
      // Complete Session
      await this.completeSession(sessionId);
      await this.redisService.del(cacheKey); // Clear cache
      return { nextQuestion: null, isCompleted: true };
    }

    // Update Redis
    await this.redisService.set(
      cacheKey,
      JSON.stringify(state),
      this.CACHE_TTL
    );

    return {
      nextQuestion: questions[nextIndex],
      isCompleted: false,
    };
  }

  /**
   * Complete the session and trigger evaluation
   */
  private async completeSession(sessionId: string): Promise<void> {
    // Update DB Status
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: InterviewStatus.COMPLETED,
        endTime: new Date(),
      },
    });

    // Add to Evaluation Queue
    await this.evaluationQueue.add('evaluate', { sessionId });
    this.logger.log(`Session ${sessionId} queued for evaluation`);
  }

  /**
   * Get current session state (for resuming)
   */
  async getSessionState(userId: string, sessionId: string) {
    const cacheKey = `interview:session:${sessionId}`;
    const cachedState = await this.redisService.get(cacheKey);

    if (cachedState) {
      const state = JSON.parse(cachedState);
      const questions = JSON.parse(state.questions);
      return {
        currentIndex: state.currentIndex,
        currentQuestion: questions[state.currentIndex],
        totalQuestions: state.totalQuestions,
        status: state.status,
      };
    }

    // Fallback: Reconstruct from DB
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    // Re-fetch questions (assuming they are stored in InterviewQuestion table)
    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId: session.optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    // Determine index based on messages count (assuming 1 message per answer)
    // Note: This logic assumes structured flow strictly.
    const userMessagesCount = session.messages.filter(
      (m) => m.role === MessageRole.USER
    ).length;

    const currentIndex = userMessagesCount;
    const isCompleted = session.status === InterviewStatus.COMPLETED;

    if (!isCompleted && currentIndex < questions.length) {
      // Restore Cache
      const sessionState = {
        currentIndex,
        totalQuestions: questions.length,
        questions: JSON.stringify(questions),
        status: session.status,
      };
      await this.redisService.set(
        cacheKey,
        JSON.stringify(sessionState),
        this.CACHE_TTL
      );

      return {
        currentIndex,
        currentQuestion: questions[currentIndex],
        totalQuestions: questions.length,
        status: session.status,
      };
    }

    return {
      status: session.status,
      isCompleted: true,
    };
  }
}
