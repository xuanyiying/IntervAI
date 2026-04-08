/**
 * Unified Interview AI Controller
 * Handles both REST API and WebSocket endpoints for resume optimization
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ResumeOptimizerService } from '../services/resume-optimizer.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { Optimization } from '@prisma/client';

@Controller('optimizations')
@UseGuards(JwtAuthGuard)
export class ResumeOptimizerController {
  constructor(private resumeOptimizerService: ResumeOptimizerService) {}

  /**
   * Create a new optimization
   * POST /api/v1/optimizations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOptimization(
    @Request() req: any,
    @Body() body: { resumeId: string; jobId: string }
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.createOptimization(
      userId,
      body.resumeId,
      body.jobId
    );
  }

  /**
   * List all optimizations for the user
   * GET /api/v1/optimizations
   */
  @Get()
  async listOptimizations(@Request() req: any): Promise<Optimization[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.listOptimizations(userId);
  }

  /**
   * Get an optimization by ID
   * GET /api/v1/optimizations/:id
   */
  @Get(':id')
  async getOptimization(
    @Request() req: any,
    @Param('id') optimizationId: string
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.getOptimization(
      optimizationId,
      userId
    );
  }

  /**
   * Apply a single suggestion
   * POST /api/v1/optimizations/:id/suggestions/:suggestionId/accept
   */
  @Post(':id/suggestions/:suggestionId/accept')
  @HttpCode(HttpStatus.OK)
  async applySuggestion(
    @Request() req: any,
    @Param('id') optimizationId: string,
    @Param('suggestionId') suggestionId: string
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.applySuggestion(
      optimizationId,
      userId,
      suggestionId
    );
  }

  /**
   * Apply multiple suggestions in batch
   * POST /api/v1/optimizations/:id/suggestions/accept-batch
   */
  @Post(':id/suggestions/accept-batch')
  @HttpCode(HttpStatus.OK)
  async applyBatchSuggestions(
    @Request() req: any,
    @Param('id') optimizationId: string,
    @Body() body: { suggestionIds: string[] }
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.applyBatchSuggestions(
      optimizationId,
      userId,
      body.suggestionIds
    );
  }

  /**
   * Reject a suggestion
   * POST /api/v1/optimizations/:id/suggestions/:suggestionId/reject
   */
  @Post(':id/suggestions/:suggestionId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectSuggestion(
    @Request() req: any,
    @Param('id') optimizationId: string,
    @Param('suggestionId') suggestionId: string
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.resumeOptimizerService.rejectSuggestion(
      optimizationId,
      userId,
      suggestionId
    );
  }
}
