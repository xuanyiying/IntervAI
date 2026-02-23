import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { InterviewService } from './interview.service';
import { InterviewQuestionService } from './services/interview-question.service';
import { InterviewSessionService } from './services/interview-session.service';
import { InterviewReportService } from './services/interview-report.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { InterviewQuestion, InterviewSession } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetPreparationGuideDto } from './dto/get-preparation-guide.dto';

@Controller('interview')
@UseGuards(JwtAuthGuard)
export class InterviewController {
  constructor(
    private interviewService: InterviewService,
    private questionService: InterviewQuestionService,
    private sessionService: InterviewSessionService,
    private reportService: InterviewReportService
  ) {}

  /**
   * Get interview preparation guide or strategy
   * POST /api/v1/interview/preparation-guide
   */
  @Post('preparation-guide')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async getPreparationGuide(
    @Request() req: any,
    @Body() dto: GetPreparationGuideDto
  ): Promise<{ content: string }> {
    const content = await this.interviewService.getPreparationGuide(dto);
    return { content };
  }

  /**
   * Generate interview questions for an optimization
   * POST /api/v1/interview/questions
   */
  @Post('questions')
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async generateQuestions(
    @Request() req: any,
    @Query('optimizationId') optimizationId: string,
    @Query('count') count?: string
  ): Promise<InterviewQuestion[]> {
    const userId = req.user.id;
    const questionCount = count ? parseInt(count, 10) : 12;

    return this.questionService.generateQuestions(
      optimizationId,
      userId,
      questionCount
    );
  }

  /**
   * Get interview questions for an optimization
   * GET /api/v1/interview/questions/:optimizationId
   */
  @Get('questions/:optimizationId')
  async getQuestions(
    @Request() req: any,
    @Param('optimizationId') optimizationId: string
  ): Promise<InterviewQuestion[]> {
    const userId = req.user.id;

    return this.questionService.getQuestions(optimizationId, userId);
  }

  /**
   * Export interview preparation as PDF
   * GET /api/v1/interview/export/:optimizationId
   */
  @Get('export/:optimizationId')
  async exportInterviewPrep(
    @Request() req: any,
    @Param('optimizationId') optimizationId: string
  ): Promise<{ html: string }> {
    const userId = req.user.id;

    const html = await this.interviewService.exportInterviewPrep(
      optimizationId,
      userId
    );

    return { html };
  }

  /**
   * Start a new interview session
   * POST /api/v1/interview/session
   */
  @Post('session')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async startSession(
    @Request() req: any,
    @Body() createSessionDto: CreateSessionDto
  ): Promise<{
    session: InterviewSession;
    firstQuestion: InterviewQuestion | null;
  }> {
    const userId = req.user.id;
    return this.sessionService.startSession(userId, createSessionDto);
  }

  /**
   * Submit answer for current question
   * POST /api/v1/interview/session/:sessionId/answer
   */
  @Post('session/:sessionId/answer')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto
  ): Promise<{ nextQuestion: InterviewQuestion | null; isCompleted: boolean }> {
    const userId = req.user.id;
    return this.sessionService.submitAnswer(
      userId,
      sessionId,
      sendMessageDto.content,
      sendMessageDto.audioUrl
    );
  }

  /**
   * Get current session state
   * GET /api/v1/interview/session/:sessionId/current
   */
  @Get('session/:sessionId/current')
  async getCurrentState(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    const userId = req.user.id;
    return this.sessionService.getSessionState(userId, sessionId);
  }

  /**
   * End interview session (Force complete)
   * POST /api/v1/interview/session/:sessionId/end
   */
  @Post('session/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ): Promise<void> {
    const userId = req.user.id;
    await this.interviewService.endSession(userId, { sessionId });
  }

  /**
   * Get interview session details
   * GET /api/v1/interview/session/:sessionId
   */
  @Get('session/:sessionId')
  async getSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ): Promise<InterviewSession> {
    const userId = req.user.id;
    return this.interviewService.getSession(userId, sessionId);
  }

  /**
   * Get active interview session for an optimization
   * GET /api/v1/interview/active-session/:optimizationId
   */
  @Get('active-session/:optimizationId')
  async getActiveSession(
    @Request() req: any,
    @Param('optimizationId') optimizationId: string
  ): Promise<InterviewSession | null> {
    const userId = req.user.id;
    return this.interviewService.getActiveSessionByOptimization(
      userId,
      optimizationId
    );
  }

  /**
   * Transcribe audio
   * POST /api/v1/interview/audio/transcribe
   */
  @Post('audio/transcribe')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ text: string }> {
    return this.interviewService.transcribeAudio(file);
  }

  @Get('session/:sessionId/report')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async generateReport(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    const userId = req.user.id;
    return this.reportService.generateReport(sessionId, userId);
  }
}
