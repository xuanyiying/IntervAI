import { AIService } from '@/core/ai';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GeneratePitchDto, RefinePitchDto } from '../dto/pitch-perfect.dto';

export interface PitchPerfectOutput {
  introduction: string;
  highlights: string[];
  keywordOverlap: {
    matched: string[];
    missing: string[];
    overlapPercentage: number;
  };
  suggestions: string[];
}

export interface RefinePitchOutput {
  refinedIntroduction: string;
}

@Injectable()
export class PitchPerfectService {
  private readonly logger = new Logger(PitchPerfectService.name);

  constructor(private readonly aiService: AIService) {}

  async generatePitch(
    dto: GeneratePitchDto,
    userId: string
  ): Promise<PitchPerfectOutput> {
    const { resumeData, jobDescription, style, duration } = dto;

    if (!resumeData || !jobDescription) {
      throw new BadRequestException(
        'Resume data and job description are required'
      );
    }

    try {
      const result = await this.aiService.executeSkill(
        'pitch-perfect',
        {
          resumeData: JSON.stringify(resumeData),
          jobDescription,
          style: style || 'technical',
          duration: duration || 30,
        },
        userId
      );

      if (!result.success || !result.data) {
        this.logger.error(
          'Pitch-perfect skill execution failed:',
          result.error
        );
        throw new InternalServerErrorException(
          result.error || 'Failed to generate pitch'
        );
      }

      const output = this.parsePitchOutput(result.data);
      return output;
    } catch (error) {
      this.logger.error('Error generating pitch:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate pitch');
    }
  }

  async refinePitch(
    dto: RefinePitchDto,
    userId: string
  ): Promise<RefinePitchOutput> {
    const { currentIntroduction, feedback } = dto;

    if (!currentIntroduction || !feedback) {
      throw new BadRequestException(
        'Current introduction and feedback are required'
      );
    }

    try {
      const refinementPrompt = this.buildRefinementPrompt(
        currentIntroduction,
        feedback
      );

      const { Models } = await import('@/core/ai/models');
      const refinedIntroduction = await this.aiService.generate(
        Models.Chat,
        refinementPrompt,
        userId
      );

      return { refinedIntroduction };
    } catch (error) {
      this.logger.error('Error refining pitch:', error);
      throw new InternalServerErrorException('Failed to refine pitch');
    }
  }

  private parsePitchOutput(data: unknown): PitchPerfectOutput {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return this.validateOutput(parsed);
      }
      return this.validateOutput(data as Record<string, unknown>);
    } catch {
      this.logger.warn('Failed to parse pitch output, using fallback');
      return this.getFallbackOutput();
    }
  }

  private validateOutput(data: Record<string, unknown>): PitchPerfectOutput {
    const keywordOverlap = data.keywordOverlap as
      | Record<string, unknown>
      | undefined;

    return {
      introduction: String(data.introduction || ''),
      highlights: Array.isArray(data.highlights)
        ? data.highlights.map(String)
        : [],
      keywordOverlap: {
        matched: Array.isArray(keywordOverlap?.matched)
          ? keywordOverlap.matched.map(String)
          : [],
        missing: Array.isArray(keywordOverlap?.missing)
          ? keywordOverlap.missing.map(String)
          : [],
        overlapPercentage:
          typeof keywordOverlap?.overlapPercentage === 'number'
            ? keywordOverlap.overlapPercentage
            : 0,
      },
      suggestions: Array.isArray(data.suggestions)
        ? data.suggestions.map(String)
        : [],
    };
  }

  private buildRefinementPrompt(
    currentIntroduction: string,
    feedback: string
  ): string {
    return `You are an expert career coach. Please refine the following self-introduction based on the user's feedback.

Current Introduction:
"""
${currentIntroduction}
"""

User Feedback:
"""
${feedback}
"""

Please provide an improved version of the introduction that addresses the user's feedback while maintaining a professional tone. Output only the refined introduction text, nothing else.`;
  }

  private getFallbackOutput(): PitchPerfectOutput {
    return {
      introduction: '',
      highlights: [],
      keywordOverlap: {
        matched: [],
        missing: [],
        overlapPercentage: 0,
      },
      suggestions: ['Unable to generate pitch. Please try again.'],
    };
  }
}
