import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating/updating model configurations
 */
export class UpsertModelConfigDto {
  @IsString()
  name: string;

  @IsString()
  provider: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  defaultTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultMaxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerInputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerOutputToken?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rateLimitPerMinute?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rateLimitPerDay?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
