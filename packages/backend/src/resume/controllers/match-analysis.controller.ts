import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MatchAnalysisService } from '../services/match-analysis.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('match-analysis')
@UseGuards(JwtAuthGuard)
export class MatchAnalysisController {
  constructor(private readonly matchAnalysisService: MatchAnalysisService) {}

  @Post('analyze')
  async analyzeMatch(@Body() body: { resumeId: string; jobId: string }) {
    return this.matchAnalysisService.analyzeMatch(body.resumeId, body.jobId);
  }

  @Get(':resumeId/:jobId')
  async getMatchAnalysis(
    @Param('resumeId') resumeId: string,
    @Param('jobId') jobId: string
  ) {
    return this.matchAnalysisService.analyzeMatch(resumeId, jobId);
  }
}
