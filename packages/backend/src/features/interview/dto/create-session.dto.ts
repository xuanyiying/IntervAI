import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum InterviewMode {
  MOCK = 'mock', // 模拟面试：AI 提问，用户回答
  ASSIST = 'assist', // 辅助面试：用户输入问题，AI 生成参考答案
}

export enum InterviewLanguage {
  EN = 'en', // 英文
  ZH = 'zh', // 中文
}

export class CreateSessionDto {
  @IsString()
  @IsOptional()
  optimizationId?: string;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsString()
  @IsOptional()
  personaId?: string;

  @IsEnum(InterviewMode)
  @IsOptional()
  mode?: InterviewMode = InterviewMode.MOCK;

  @IsEnum(InterviewLanguage)
  @IsOptional()
  language?: InterviewLanguage = InterviewLanguage.ZH;
}
