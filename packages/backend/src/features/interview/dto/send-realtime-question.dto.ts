import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SendRealtimeQuestionDto {
  @IsString()
  question: string;

  @IsOptional()
  @IsUUID()
  audioUrl?: string;
}
