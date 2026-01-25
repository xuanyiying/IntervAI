import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVoiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class VoiceResponseDto {
  id: string;
  name: string;
  voiceType: string;
  style?: string;
  avatarUrl?: string;
  sampleUrl?: string;
  voiceCode: string;
}
