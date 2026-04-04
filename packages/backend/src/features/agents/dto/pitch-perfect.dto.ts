import { IsObject, IsString, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ResumeDataDto {
  @ApiPropertyOptional()
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string[];
    achievements?: string[];
  }>;

  @ApiPropertyOptional()
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate?: string;
    endDate?: string;
  }>;

  @ApiPropertyOptional()
  skills?: string[];

  @ApiPropertyOptional()
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    highlights?: string[];
  }>;
}

export class GeneratePitchDto {
  @ApiProperty({ description: 'Parsed resume data' })
  @IsObject()
  @ValidateNested()
  @Type(() => ResumeDataDto)
  resumeData: ResumeDataDto;

  @ApiProperty({ description: 'Target job description' })
  @IsString()
  jobDescription: string;

  @ApiPropertyOptional({ enum: ['technical', 'managerial', 'sales'], default: 'technical' })
  @IsOptional()
  @IsEnum(['technical', 'managerial', 'sales'])
  style?: 'technical' | 'managerial' | 'sales' = 'technical';

  @ApiPropertyOptional({ enum: [30, 60], default: 30 })
  @IsOptional()
  @IsNumber()
  @IsEnum([30, 60])
  duration?: 30 | 60 = 30;
}

export class RefinePitchDto {
  @ApiProperty({ description: 'Current introduction text to refine' })
  @IsString()
  currentIntroduction: string;

  @ApiProperty({ description: 'User feedback for refinement' })
  @IsString()
  feedback: string;
}
