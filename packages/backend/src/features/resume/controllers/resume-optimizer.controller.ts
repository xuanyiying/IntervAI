/**
 * Unified Interview AI Controller
 * Handles both REST API and WebSocket endpoints for resume optimization
 * Enhanced with Git-like diff workflow support
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Optimization } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { ResumeOptimizerService } from '../services/resume-optimizer.service';

@Controller('optimizations')
@UseGuards(JwtAuthGuard)
export class ResumeOptimizerController {
  constructor(private resumeOptimizerService: ResumeOptimizerService) { }

  /**
   * Create a new optimization
   * POST /api/v1/optimizations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOptimization(
    @Request() req: any,
    @Body() body: { resumeId: string; jobId?: string }
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
   * Manual trigger for resume optimization (generates suggestions)
   * POST /api/v1/resumes/:id/optimize
   */
  @Post('resume/:resumeId/optimize')
  @HttpCode(HttpStatus.CREATED)
  async triggerOptimization(
    @Request() req: any,
    @Param('resumeId') resumeId: string,
    @Body() body?: { jobId?: string }
  ): Promise<Optimization> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.triggerOptimization(
      userId,
      resumeId,
      body?.jobId
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
   * List optimizations for a specific resume
   * GET /api/v1/resumes/:id/optimizations
   */
  @Get('resume/:resumeId/list')
  async listResumeOptimizations(
    @Request() req: any,
    @Param('resumeId') resumeId: string
  ): Promise<Optimization[]> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.listResumeOptimizations(
      userId,
      resumeId
    );
  }

  /**
   * Get an optimization by ID with full suggestions
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

    return this.resumeOptimizerService.getOptimization(optimizationId, userId);
  }

  /**
   * Accept a single suggestion
   * PATCH /api/v1/optimizations/:id/suggestions/:suggestionId/accept
   */
  @Patch(':id/suggestions/:suggestionId/accept')
  async acceptSuggestion(
    @Request() req: any,
    @Param('id') optimizationId: string,
    @Param('suggestionId') suggestionId: string
  ): Promise<{ status: string; suggestion: any }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.acceptSuggestion(
      optimizationId,
      userId,
      suggestionId
    );
  }

  /**
   * Reject a single suggestion
   * PATCH /api/v1/optimizations/:id/suggestions/:suggestionId/reject
   */
  @Patch(':id/suggestions/:suggestionId/reject')
  async rejectSuggestion(
    @Request() req: any,
    @Param('id') optimizationId: string,
    @Param('suggestionId') suggestionId: string
  ): Promise<{ status: string; suggestion: any }> {
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

  /**
   * Accept all pending suggestions
   * POST /api/v1/optimizations/:id/accept-all
   */
  @Post(':id/accept-all')
  @HttpCode(HttpStatus.OK)
  async acceptAllSuggestions(
    @Request() req: any,
    @Param('id') optimizationId: string
  ): Promise<{ accepted: number; total: number }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.acceptAllSuggestions(
      optimizationId,
      userId
    );
  }

  /**
   * Reject all pending suggestions
   * POST /api/v1/optimizations/:id/reject-all
   */
  @Post(':id/reject-all')
  @HttpCode(HttpStatus.OK)
  async rejectAllSuggestions(
    @Request() req: any,
    @Param('id') optimizationId: string
  ): Promise<{ rejected: number; total: number }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.rejectAllSuggestions(
      optimizationId,
      userId
    );
  }

  /**
   * Apply accepted suggestions to create a new version
   * POST /api/v1/optimizations/:id/apply
   */
  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  async applyChanges(
    @Request() req: any,
    @Param('id') optimizationId: string
  ): Promise<any> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.applyChanges(optimizationId, userId);
  }

  /**
   * Get version history for a resume
   * GET /api/v1/resumes/:id/versions
   */
  @Get('resume/:resumeId/versions')
  async getVersions(
    @Request() req: any,
    @Param('resumeId') resumeId: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.getVersions(userId, resumeId);
  }

  /**
   * Restore to a specific version
   * POST /api/v1/resumes/:id/versions/:versionId/restore
   */
  @Post('resume/:resumeId/versions/:versionId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreVersion(
    @Request() req: any,
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    return this.resumeOptimizerService.restoreVersion(
      userId,
      resumeId,
      versionId
    );
  }
}
