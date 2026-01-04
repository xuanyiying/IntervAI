import { IsString, IsOptional, IsNumber, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;
}

export class CallAiDto {
  @IsString()
  model: string;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  topP?: number;

  @IsOptional()
  @IsNumber()
  topK?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stopSequences?: string[];

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages?: MessageDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  scenario?: string;
}
