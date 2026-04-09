import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { CareerToolsService } from '../services/career-tools.service';

@UseGuards(JwtAuthGuard)
@Controller('api/career-tools')
export class CareerToolsController {
  constructor(
    private readonly careerToolsService: CareerToolsService
  ) {}

  @Post('skills/analyze')
  async analyzeSkills(
    @Body() body: {
      currentSkills: string[];
      targetRole: string;
      experience?: Record<string, any>;
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.analyzeSkills(userId, body);
  }

  @Post('salary/analyze')
  async analyzeSalary(
    @Body() body: {
      jobTitle: string;
      location?: string;
      experience?: Record<string, any>;
      skills?: string[];
      currentOffer?: Record<string, any>;
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.analyzeSalary(userId, body);
  }

  @Post('linkedin/optimize')
  async optimizeLinkedIn(
    @Body() body: {
      profileData: Record<string, any>;
      targetRole?: string;
      industry?: string;
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.optimizeLinkedIn(userId, body);
  }

  @Post('cover-letter/generate')
  async writeCoverLetter(
    @Body() body: {
      resumeData: Record<string, any>;
      jobDescription: string;
      companyName: string;
      hiringManager?: string;
      tone?: 'professional' | 'conversational' | 'enthusiastic' | 'formal';
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.writeCoverLetter(userId, body);
  }

  @Post('company/research')
  async researchCompany(
    @Body() body: {
      companyName: string;
      role?: string;
      researchDepth?: 'quick' | 'standard' | 'comprehensive';
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.researchCompany(userId, body);
  }

  @Post('career/advise')
  async adviseCareer(
    @Body() body: {
      userProfile: Record<string, any>;
      careerGoal?: string;
      currentSituation?: string;
      question?: string;
    },
    @Query('userId') userId: string
  ) {
    return this.careerToolsService.adviseCareer(userId, body);
  }

  @Get('skills/list')
  listAvailableSkills() {
    return [
      { name: 'skill-analyzer', description: 'Analyze skills against job requirements and provide learning recommendations' },
      { name: 'salary-analyzer', description: 'Analyze salary data and provide negotiation guidance' },
      { name: 'linkedin-optimizer', description: 'Optimize LinkedIn profile for job search and networking' },
      { name: 'cover-letter-writer', description: 'Generate personalized cover letters tailored to job descriptions' },
      { name: 'company-researcher', description: 'Research companies and provide comprehensive insights for interview preparation' },
      { name: 'career-advisor', description: 'Provide personalized career development advice based on user profile and goals' },
    ];
  }
}
