import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  optimizationId: string;

  @IsString()
  @IsOptional()
  voiceId?: string;
}
