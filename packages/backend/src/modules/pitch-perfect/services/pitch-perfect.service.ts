import { AIService } from '@/modules/ai';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GeneratePitchDto, RefinePitchDto } from '../dto/pitch-perfect.dto';

export interface PitchVersion {
  text: string;
  keyPoints: string[];
  wordCount: number;
  useScenario: string;
}

export interface PitchPerfectOutput {
  versions: {
    oneMinute: PitchVersion;
    threeMinute: PitchVersion;
    fiveMinute: PitchVersion;
  };
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
    const { resumeData, jobDescription, style, matchAnalysis } = dto;

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
          ...(matchAnalysis ? { matchAnalysis } : {}),
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

      return this.parsePitchOutput(result.data);
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

      const { AI_MODEL } = await import('@/modules/ai/constants/models');
      const refinedIntroduction = await this.aiService.generate(
        AI_MODEL,
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
      const parsed =
        typeof data === 'string'
          ? JSON.parse(data)
          : (data as Record<string, unknown>);
      return this.validateOutput(parsed);
    } catch {
      this.logger.warn('Failed to parse pitch output, using fallback');
      return this.getFallbackOutput();
    }
  }

  private validateVersion(value: unknown): PitchVersion {
    const v = (value ?? {}) as Record<string, unknown>;
    return {
      text: String(v.text || ''),
      keyPoints: Array.isArray(v.keyPoints) ? v.keyPoints.map(String) : [],
      wordCount:
        typeof v.wordCount === 'number'
          ? v.wordCount
          : String(v.text || '').length,
      useScenario: String(v.useScenario || ''),
    };
  }

  private validateOutput(data: Record<string, unknown>): PitchPerfectOutput {
    const versions = (data.versions ?? {}) as Record<string, unknown>;
    const keywordOverlap = data.keywordOverlap as
      Record<string, unknown> | undefined;

    return {
      versions: {
        oneMinute: this.validateVersion(versions.oneMinute),
        threeMinute: this.validateVersion(versions.threeMinute),
        fiveMinute: this.validateVersion(versions.fiveMinute),
      },
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
    return `你是一位资深的面试辅导教练。请根据用户的反馈优化以下自我介绍，使其更自然、更有说服力，符合国内职场面试的表达习惯。

当前自我介绍：
"""
${currentIntroduction}
"""

用户反馈：
"""
${feedback}
"""

只输出优化后的自我介绍正文，不要任何解释。`;
  }

  private getFallbackOutput(): PitchPerfectOutput {
    const empty: PitchVersion = {
      text: '',
      keyPoints: [],
      wordCount: 0,
      useScenario: '',
    };
    return {
      versions: {
        oneMinute: empty,
        threeMinute: { ...empty },
        fiveMinute: { ...empty },
      },
      highlights: [],
      keywordOverlap: {
        matched: [],
        missing: [],
        overlapPercentage: 0,
      },
      suggestions: ['生成失败，请稍后重试。'],
    };
  }
}
