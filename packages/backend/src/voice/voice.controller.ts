import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlibabaVoiceService } from './voice.service';
import { CreateVoiceDto } from './dto/voice.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('voices')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: AlibabaVoiceService) {}

  @Get()
  async getVoices(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.voiceService.getVoices(userId);
  }

  @Post('clone')
  @UseInterceptors(FileInterceptor('audio'))
  async cloneVoice(
    @Req() req: Request,
    @Body() createVoiceDto: CreateVoiceDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = (req.user as any).id;
    return this.voiceService.cloneVoice(
      userId,
      createVoiceDto.name,
      file.buffer
    );
  }

  @Delete(':id')
  async deleteVoice(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    await this.voiceService.deleteVoice(userId, id);
    return { success: true };
  }

  @Post('seed')
  async seedVoices() {
    await this.voiceService.seedDefaultVoices();
    return { success: true };
  }
}
