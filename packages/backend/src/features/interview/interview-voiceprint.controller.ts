import { SpeakerVerifyService } from '@/features/voice/speaker-verify.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class EnrollVoiceprintDto {
  /** Base64-encoded mono PCM16 audio of the user's voice (>= 3s recommended). */
  @IsString()
  audio!: string;

  @IsOptional()
  @IsIn([8000, 16000, 24000, 32000, 44100, 48000])
  sampleRate?: number = 16000;
}

/**
 * Voiceprint enrollment for distinguishing the user from the interviewer
 * during realtime assist interviews.
 */
@Controller('interview/voiceprint')
@UseGuards(JwtAuthGuard)
export class InterviewVoiceprintController {
  private readonly logger = new Logger(InterviewVoiceprintController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly speakerVerify: SpeakerVerifyService
  ) {}

  @Get('status')
  async getStatus(@Request() req: any) {
    const userId = req.user?.id;
    const profile = userId
      ? await this.prisma.speakerProfile.findUnique({ where: { userId } })
      : null;

    return {
      available: this.speakerVerify.isAvailable(),
      enrolled: !!profile,
      sampleCount: profile?.sampleCount ?? 0,
      updatedAt: profile?.updatedAt ?? null,
      threshold: this.speakerVerify.threshold,
    };
  }

  @Post('enroll')
  @HttpCode(HttpStatus.OK)
  async enroll(@Request() req: any, @Body() dto: EnrollVoiceprintDto) {
    const userId = req.user?.id;

    if (!this.speakerVerify.isAvailable()) {
      return {
        success: false,
        message:
          '声纹服务不可用：需要在服务端安装 sherpa-onnx-node 并配置 VOICEPRINT_MODEL_PATH',
      };
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(dto.audio, 'base64');
    } catch {
      return { success: false, message: '音频数据无效' };
    }

    const embedding = this.speakerVerify.extractEmbedding(
      buffer,
      dto.sampleRate || 16000
    );
    if (!embedding) {
      return {
        success: false,
        message: '音频太短或无法提取声纹，请录制更长时间（建议 8-10 秒）',
      };
    }

    const existing = await this.prisma.speakerProfile.findUnique({
      where: { userId },
    });

    const merged = this.speakerVerify.mergeEmbeddings(
      (existing?.embedding as number[]) ?? null,
      existing?.sampleCount ?? 0,
      embedding
    );

    await this.prisma.speakerProfile.upsert({
      where: { userId },
      create: { userId, embedding: merged, sampleCount: 1 },
      update: {
        embedding: merged,
        sampleCount: (existing?.sampleCount ?? 0) + 1,
      },
    });

    this.logger.log(`Voiceprint enrolled for user ${userId}`);
    return { success: true, sampleCount: (existing?.sampleCount ?? 0) + 1 };
  }

  @Delete()
  async remove(@Request() req: any) {
    const userId = req.user?.id;
    await this.prisma.speakerProfile.deleteMany({ where: { userId } });
    return { success: true };
  }
}
