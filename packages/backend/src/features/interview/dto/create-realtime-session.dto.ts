import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum AnswerStyle {
  CONCISE = 'concise',
  DETAILED = 'detailed',
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
}

export class CreateRealtimeSessionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  resumeId?: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @IsString()
  resumeData?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsEnum(AnswerStyle)
  answerStyle?: AnswerStyle;
}
