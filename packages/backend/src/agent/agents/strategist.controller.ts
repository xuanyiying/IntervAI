import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsEnum, IsObject } from 'class-validator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  StrategistAgent,
  StrategistAgentInput,
  StrategistAgentOutput,
  InterviewPerformance,
  InterviewQuestionWithMetadata,
} from './strategist.agent';
import { ParsedResumeData } from '@/types';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Request DTO for question bank generation
 */
export class GenerateQuestionBankRequest {
  @IsObject()
  resumeData: ParsedResumeData;

  @IsString()
  jobDescription: string;

  @IsEnum(['junior', 'mid', 'senior'])
  experienceLevel: 'junior' | 'mid' | 'senior';
}

/**
 * Request DTO for performance-based updates
 */
export class UpdateQuestionBankRequest {
  @IsObject()
  performance: InterviewPerformance;
}

/**
 * Strategist Agent Controller
 * Handles HTTP requests for interview question bank generation
 * Requirements: 3.1-3.7
 */
@Controller('agents/strategist')
@UseGuards(JwtAuthGuard)
export class StrategistController {
  private readonly logger = new Logger(StrategistController.name);

  constructor(
    private strategistAgent: StrategistAgent,
    private prisma: PrismaService
  ) {}

  /**
   * Generate customized question bank
   * POST /api/agents/strategist/generate
   */
  @Post('generate')
  async generateQuestionBank(
    @Body() request: GenerateQuestionBankRequest,
    @Request() req: { user: { id: string } }
  ): Promise<StrategistAgentOutput> {
    try {
      this.logger.log(
        `Generating question bank for user ${req.user.id} with experience level ${request.experienceLevel}`
      );

      const input: StrategistAgentInput = {
        resumeData: request.resumeData,
        jobDescription: request.jobDescription,
        experienceLevel: request.experienceLevel,
      };

      const result = await this.strategistAgent.buildQuestionBank(
        input,
        req.user.id
      );

      this.logger.log(
        `Successfully generated question bank for user ${req.user.id} with ${result.totalQuestions} questions`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to generate question bank: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to generate question bank',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update question bank based on interview performance
   * POST /api/agents/strategist/update-performance
   */
  @Post('update-performance')
  async updateBasedOnPerformance(
    @Body() request: UpdateQuestionBankRequest,
    @Request() req: { user: { id: string } }
  ): Promise<StrategistAgentOutput> {
    try {
      this.logger.log(
        `Updating question bank for user ${req.user.id} based on performance`
      );

      // Fetch the most recent successful strategist session to get the current question bank
      const lastSession = await this.prisma.agentSession.findFirst({
        where: {
          userId: req.user.id,
          agentType: 'strategist',
          status: 'COMPLETED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let currentQuestions: InterviewQuestionWithMetadata[] = [];
      if (lastSession && lastSession.output) {
        const output = lastSession.output as any;
        if (Array.isArray(output.questions)) {
          currentQuestions = output.questions;
        }
      }

      const updatedQuestions =
        await this.strategistAgent.updateBasedOnPerformance(
          req.user.id,
          currentQuestions,
          request.performance
        );

      const categorization =
        this.strategistAgent['categorizeQuestions'](updatedQuestions);

      const result: StrategistAgentOutput = {
        questions: updatedQuestions,
        categorization,
        totalQuestions: updatedQuestions.length,
        focusAreas: request.performance.weakAreas,
      };

      this.logger.log(
        `Successfully updated question bank for user ${req.user.id}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update question bank: ${error instanceof Error ? error.message : String(error)}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to update question bank',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
