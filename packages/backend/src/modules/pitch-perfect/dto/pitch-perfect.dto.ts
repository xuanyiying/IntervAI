import {
  IsObject,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNotEmptyObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePitchDto {
  @ApiProperty({
    description:
      'Parsed resume data (opaque JSON from the resume parser, passed through to the AI skill)',
  })
  @IsObject()
  @IsNotEmptyObject()
  resumeData: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Target job description. When omitted or empty, a generic self-introduction is generated from the resume alone.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30000)
  jobDescription?: string;

  @ApiPropertyOptional({
    enum: ['technical', 'managerial', 'sales'],
    default: 'technical',
  })
  @IsOptional()
  @IsEnum(['technical', 'managerial', 'sales'])
  style?: 'technical' | 'managerial' | 'sales' = 'technical';

  @ApiPropertyOptional({
    description:
      'JD match analysis result (radar, gaps, strengths) used to emphasize advantages',
  })
  @IsOptional()
  @IsObject()
  matchAnalysis?: Record<string, unknown>;
}

export class RefinePitchDto {
  @ApiProperty({ description: 'Current introduction text to refine' })
  @IsString()
  @MaxLength(30000)
  currentIntroduction: string;

  @ApiProperty({ description: 'User feedback for refinement' })
  @IsString()
  @MaxLength(5000)
  feedback: string;
}
