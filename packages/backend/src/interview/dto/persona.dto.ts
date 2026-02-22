import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';
import { PersonaStyle } from '@prisma/client';

export class CreatePersonaDto {
  @IsString()
  name: string;

  @IsEnum(PersonaStyle)
  style: PersonaStyle;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  traits: string[];

  @IsObject()
  questionStyle: Record<string, any>;

  @IsString()
  systemPrompt: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePersonaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PersonaStyle)
  style?: PersonaStyle;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traits?: string[];

  @IsOptional()
  @IsObject()
  questionStyle?: Record<string, any>;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
