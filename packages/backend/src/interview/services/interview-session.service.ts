import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngine } from '@/ai';
import { QuotaService } from '@/quota/quota.service';
import {
  InterviewSession,
  InterviewMessage,
  InterviewStatus,
  MessageRole,
  InterviewQuestion,
} from '@prisma/client';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { EndSessionDto } from '../dto/end-session.dto';
import { ParsedJobData, ParsedResumeData } from '@/types';
import { AlibabaVoiceService } from '@/voice/voice.service';

@Injectable()
export class InterviewSessionService {
  private readonly logger = new Logger(InterviewSessionService.name);

  constructor(
    private prisma: PrismaService,
    private aiEngine: AIEngine,
    private quotaService: QuotaService,
    private voiceService: AlibabaVoiceService
  ) {}

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
    // Check interview quota
    await this.quotaService.enforceInterviewQuota(userId);

    const { optimizationId, voiceId } = createSessionDto;

    // Verify voiceId if provided
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

    // Verify user owns the optimization
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

    // Create session
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        optimizationId,
        voiceId: createSessionDto.voiceId,
        status: InterviewStatus.IN_PROGRESS,
      },
      include: {
        messages: true,
      },
    });

    // Increment interview count
    await this.quotaService.incrementInterviewCount(userId);

    // Get first question
    const questions = await this.prisma.interviewQuestion.findMany({
      where: { optimizationId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      session,
      firstQuestion: questions.length > 0 ? questions[0] : null,
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

    // Generate AI response
    const resumeData = session.optimization.resume
      .parsedData as unknown as ParsedResumeData;
    const jobData = session.optimization.job
      .parsedRequirements as unknown as ParsedJobData;

    const requirements = [
      ...(jobData.requiredSkills || []),
      ...(jobData.responsibilities || []),
    ].join('; ');

    const context = `
You are an experienced interviewer conducting a job interview.
Candidate Name: ${resumeData.personalInfo.name}
Job Title: ${session.optimization.job.title}
Company: ${session.optimization.job.company}
Job Requirements: ${requirements.substring(0, 500)}...

Your goal is to assess the candidate's fit for the role based on their resume and the job description.
Be professional, encouraging, but thorough. Ask follow-up questions when appropriate.
Keep your responses concise (under 100 words) to maintain a natural conversation flow.
`;

    const history = session.messages.map((m) => ({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content,
    }));

    const aiResponse = await this.aiEngine.chatWithInterviewer(
      context,
      content,
      history
    );

    // Save AI message
    const aiMessage = await this.prisma.interviewMessage.create({
      data: {
        sessionId,
        role: MessageRole.ASSISTANT,
        content: aiResponse.content,
        audioUrl: aiResponse.audioUrl,
      },
    });

    return { userMessage, aiMessage };
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
    const text = await this.aiEngine.transcribeAudio(file.buffer);
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

    const prompt = `
You are an expert interview coach. Review the following interview transcript for a ${jobTitle} position at ${company}.
Job Requirements: ${requirements.substring(0, 500)}...
Candidate: ${resumeData.personalInfo.name}

Transcript:
${transcript}

Provide a comprehensive evaluation including:
1. Overall Score (0-100)
2. Key Strengths (bullet points)
3. Areas for Improvement (bullet points)
4. Detailed Feedback on specific answers

Format the output as JSON:
{
  "score": number,
  "feedback": "markdown string"
}
`;

    try {
      const result = await this.aiEngine.generate(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });

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
