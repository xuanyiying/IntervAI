import { AIService } from '@/core/ai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CareerToolsService {
  private readonly logger = new Logger(CareerToolsService.name);

  constructor(private readonly aiService: AIService) {}

  async analyzeSkills(
    userId: string,
    inputs: {
      currentSkills: string[];
      targetRole: string;
      experience?: Record<string, any>;
    }
  ) {
    this.logger.log(`Analyzing skills for role: ${inputs.targetRole}`);
    return this.aiService.executeSkill('skill-analyzer', inputs, userId);
  }

  async analyzeSalary(
    userId: string,
    inputs: {
      jobTitle: string;
      location?: string;
      experience?: Record<string, any>;
      skills?: string[];
      currentOffer?: Record<string, any>;
    }
  ) {
    this.logger.log(`Analyzing salary for: ${inputs.jobTitle}`);
    return this.aiService.executeSkill('salary-analyzer', inputs, userId);
  }

  async optimizeLinkedIn(
    userId: string,
    inputs: {
      profileData: Record<string, any>;
      targetRole?: string;
      industry?: string;
    }
  ) {
    this.logger.log('Optimizing LinkedIn profile');
    return this.aiService.executeSkill('linkedin-optimizer', inputs, userId);
  }

  async writeCoverLetter(
    userId: string,
    inputs: {
      resumeData: Record<string, any>;
      jobDescription: string;
      companyName: string;
      hiringManager?: string;
      tone?: 'professional' | 'conversational' | 'enthusiastic' | 'formal';
    }
  ) {
    this.logger.log(`Writing cover letter for: ${inputs.companyName}`);
    return this.aiService.executeSkill('cover-letter-writer', inputs, userId);
  }

  async researchCompany(
    userId: string,
    inputs: {
      companyName: string;
      role?: string;
      researchDepth?: 'quick' | 'standard' | 'comprehensive';
    }
  ) {
    this.logger.log(`Researching company: ${inputs.companyName}`);
    return this.aiService.executeSkill('company-researcher', inputs, userId);
  }

  async adviseCareer(
    userId: string,
    inputs: {
      userProfile: Record<string, any>;
      careerGoal?: string;
      currentSituation?: string;
      question?: string;
    }
  ) {
    this.logger.log('Providing career advice');
    return this.aiService.executeSkill('career-advisor', inputs, userId);
  }
}
