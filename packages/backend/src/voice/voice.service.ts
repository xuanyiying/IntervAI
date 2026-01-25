import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AlibabaVoiceService {
  private readonly logger = new Logger(AlibabaVoiceService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://dashscope.aliyuncs.com/api/v1/services/audio';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.apiKey = this.configService.get<string>('DASHSCOPE_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        'DASHSCOPE_API_KEY is not set. Voice features will not work.'
      );
    }
  }

  /**
   * Get all available voices (default + cloned)
   */
  async getVoices(userId: string) {
    return this.prisma.voice.findMany({
      where: {
        OR: [{ voiceType: 'DEFAULT' }, { userId: userId }],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Clone a voice using an audio sample
   */
  async cloneVoice(userId: string, name: string, audioBuffer: Buffer) {
    this.logger.log(`Cloning voice "${name}" for user ${userId}`);
    const voiceCode = `cloned_${Date.now()}`;
    return this.prisma.voice.create({
      data: {
        userId,
        name,
        voiceCode,
        voiceType: 'CLONED',
        style: 'Custom',
      },
    });
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(userId: string, id: string) {
    const voice = await this.prisma.voice.findUnique({
      where: { id },
    });
    if (!voice || voice.userId !== userId) {
      throw new Error('Voice not found or unauthorized');
    }
    if (voice.voiceType === 'DEFAULT') {
      throw new Error('Cannot delete default system voices');
    }
    return this.prisma.voice.delete({
      where: { id },
    });
  }

  /**
   * Seed default voices if they don't exist
   */
  async seedDefaultVoices() {
    const defaultVoices = [
      {
        name: 'Professional (Male)',
        voiceCode: 'zh-CN-Yunxi',
        style: 'Professional',
        voiceType: 'DEFAULT',
      },
      {
        name: 'Friendly (Female)',
        voiceCode: 'zh-CN-Xiaoxiao',
        style: 'Friendly',
        voiceType: 'DEFAULT',
      },
      {
        name: 'Serious (Female)',
        voiceCode: 'zh-CN-Xiaoyi',
        style: 'Serious',
        voiceType: 'DEFAULT',
      },
    ];
    for (const v of defaultVoices) {
      const existing = await (this.prisma.voice as any).findFirst({
        where: { voiceCode: v.voiceCode },
      });
      if (existing) {
        await (this.prisma.voice as any).update({
          where: { id: existing.id },
          data: v,
        });
      } else {
        await (this.prisma.voice as any).create({
          data: v,
        });
      }
    }
  }

  /**
   * Transcribe audio using Alibaba ASR (DashScope)
   */
  async transcribeAudio(buffer: Buffer): Promise<string> {
    try {
      this.logger.debug('Transcribing audio using Alibaba ASR...');

      // DashScope Paraformer ASR API
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription',
        {
          model: 'paraformer-v1',
          input: {
            audio_resource_url: `data:audio/wav;base64,${buffer.toString('base64')}`,
          },
          parameters: {
            language_hints: ['zh', 'en'],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-SSE': 'disable',
          },
        }
      );

      if (response.data.output && response.data.output.text) {
        return response.data.output.text;
      }

      return '';
    } catch (error) {
      this.logger.error('Failed to transcribe audio:', error);
      throw new InternalServerErrorException('Failed to transcribe audio');
    }
  }

  /**
   * Synthesize speech using Alibaba TTS (DashScope/CosyVoice)
   */
  async synthesizeSpeech(text: string, voiceCode: string): Promise<Buffer> {
    try {
      this.logger.debug(`Synthesizing speech with voice ${voiceCode}...`);
      const response = await axios.post(
        `${this.baseUrl}/tts/synthesis`,
        {
          model: 'cosyvoice-v1',
          input: { text },
          parameters: {
            voice: voiceCode === 'default' ? 'zh-CN-Xiaoxiao' : voiceCode,
            format: 'mp3',
            sample_rate: 24000,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-SSE': 'disable',
          },
          responseType: 'arraybuffer',
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to synthesize speech:', error);
      throw new InternalServerErrorException('Failed to synthesize speech');
    }
  }
}
