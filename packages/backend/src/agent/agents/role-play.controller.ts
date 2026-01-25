import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpException,
  HttpStatus,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  RolePlayAgent,
  RolePlayAgentConfig,
  RolePlayAgentState,
  InterviewFeedback,
} from '@/agent';
import { ParsedResumeData } from '@/types';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Request DTO for starting interview
 */
export class StartInterviewRequest {
  @IsString()
  jobDescription: string;

  @IsEnum(['strict', 'friendly', 'stress-test'])
  interviewerStyle: 'strict' | 'friendly' | 'stress-test';

  @IsArray()
  @IsString({ each: true })
  focusAreas: string[];

  @IsOptional()
  @IsObject()
  resumeData?: ParsedResumeData;
}

/**
 * Request DTO for processing user response
 */
export class ProcessResponseRequest {
  @IsString()
  sessionId: string;

  @IsString()
  userResponse: string;
}

/**
 * Request DTO for concluding interview
 */
export class ConcludeInterviewRequest {
  @IsString()
  sessionId: string;
}

/**
 * Role-Play Agent Controller
 * Handles HTTP requests for mock interview simulation
 * Requirements: 4.1-4.7
 */
@Controller('agents/role-play')
@UseGuards(JwtAuthGuard)
export class RolePlayController {
  private readonly logger = new Logger(RolePlayController.name);

  constructor(
    private rolePlayAgent: RolePlayAgent,
    private prisma: PrismaService
  ) {}

  /**
   * Start a new mock interview session
   * POST /api/agents/role-play/start
   */
  @Post('start')
  async startInterview(
    @Body() request: StartInterviewRequest,
    @Request() req: { user: { id: string } }
  ): Promise<RolePlayAgentState> {
    try {
      this.logger.log(
        `Starting interview for user ${req.user.id} with style ${request.interviewerStyle}`
      );

      const config: RolePlayAgentConfig = {
        jobDescription: request.jobDescription,
        interviewerStyle: request.interviewerStyle,
        focusAreas: request.focusAreas,
        resumeData: request.resumeData,
      };

      const state = await this.rolePlayAgent.startInterview(
        config,
        req.user.id
      );

      this.logger.log(
        `Interview session ${state.sessionId} started for user ${req.user.id}`
      );

      return state;
    } catch (error) {
      this.logger.error(
        `Failed to start interview: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to start interview',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Process user response and generate follow-up
   * POST /api/agents/role-play/respond
   */
  @Post('respond')
  async processResponse(
    @Body() request: ProcessResponseRequest,
    @Request() req: { user: { id: string } }
  ): Promise<{
    followUpQuestion: string;
    realTimeAnalysis: {
      keywords: string[];
      sentiment: string;
      suggestions: string[];
      relevanceScore: number;
    };
  }> {
    try {
      this.logger.debug(
        `Processing response for session ${request.sessionId} from user ${req.user.id}`
      );

      const result = await this.rolePlayAgent.processUserResponse(
        request.sessionId,
        request.userResponse,
        req.user.id
      );

      this.logger.debug(
        `Successfully processed response for session ${request.sessionId}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process response: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to process response',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Conclude interview and generate feedback
   * POST /api/agents/role-play/conclude
   */
  @Post('conclude')
  async concludeInterview(
    @Body() request: ConcludeInterviewRequest,
    @Request() req: { user: { id: string } }
  ): Promise<InterviewFeedback> {
    try {
      this.logger.log(
        `Concluding interview session ${request.sessionId} for user ${req.user.id}`
      );

      const feedback = await this.rolePlayAgent.concludeInterview(
        request.sessionId,
        req.user.id
      );

      this.logger.log(
        `Interview session ${request.sessionId} concluded for user ${req.user.id}`
      );

      return feedback;
    } catch (error) {
      this.logger.error(
        `Failed to conclude interview: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to conclude interview',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get interview feedback
   * GET /api/agents/role-play/feedback/:sessionId
   */
  @Get('feedback/:sessionId')
  async getFeedback(
    @Param('sessionId') sessionId: string,
    @Request() req: { user: { id: string } }
  ): Promise<InterviewFeedback> {
    try {
      this.logger.debug(
        `Retrieving feedback for session ${sessionId} for user ${req.user.id}`
      );

      const session = await this.prisma.interviewSession.findFirst({
        where: {
          id: sessionId,
          userId: req.user.id,
        },
      });

      if (!session || !session.feedback) {
        throw new NotFoundException('Feedback not found for this session');
      }

      // Parse the feedback string back into InterviewFeedback object
      // Assuming feedback was stored as a JSON string
      try {
        return JSON.parse(session.feedback) as InterviewFeedback;
      } catch (e) {
        // If not JSON, it might be legacy or simple text
        this.logger.warn(`Feedback for session ${sessionId} is not valid JSON`);
        throw new HttpException(
          'Feedback format is invalid',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `Failed to get feedback: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to get feedback',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
