import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MatchAnalysisService } from '../services/match-analysis.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';

@Controller('match-analysis')
@UseGuards(JwtAuthGuard)
export class MatchAnalysisController {
  constructor(private readonly matchAnalysisService: MatchAnalysisService) {}

  @Post('analyze')
  async analyzeMatch(
    @Body() body: { resumeId: string; jobId: string },
    @Request() req: any
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.matchAnalysisService.analyzeMatch(body.resumeId, body.jobId, userId);
  }

  @Get(':resumeId/:jobId')
  async getMatchAnalysis(
    @Param('resumeId') resumeId: string,
    @Param('jobId') jobId: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.matchAnalysisService.analyzeMatch(resumeId, jobId, userId);
  }
}
