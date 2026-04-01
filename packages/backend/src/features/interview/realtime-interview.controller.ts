import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RealtimeInterviewService } from './services/realtime-interview.service';
import { CreateRealtimeSessionDto } from './dto/create-realtime-session.dto';
import { SendRealtimeQuestionDto } from './dto/send-realtime-question.dto';
import { Observable, Subject } from 'rxjs';

@Controller('realtime-interview')
@UseGuards(JwtAuthGuard)
export class RealtimeInterviewController {
  constructor(private readonly realtimeInterviewService: RealtimeInterviewService) {}

  @Post('session')
  async createSession(
    @Request() req,
    @Body() dto: CreateRealtimeSessionDto
  ) {
    const userId = req.user.sub;
    return this.realtimeInterviewService.createSession(userId, dto);
  }

  @Get('sessions')
  async getUserSessions(@Request() req) {
    const userId = req.user.sub;
    return this.realtimeInterviewService.getUserSessions(userId);
  }

  @Get('session/:id')
  async getSession(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.realtimeInterviewService.getSession(userId, id);
  }

  @Post('session/:id/question')
  async sendQuestion(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SendRealtimeQuestionDto
  ) {
    const userId = req.user.sub;
    return this.realtimeInterviewService.sendQuestion(userId, id, dto);
  }

  @Sse('session/:id/stream')
  async streamAnswer(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { question: string }
  ): Promise<Observable<MessageEvent>> {
    const userId = req.user.sub;
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        for await (const chunk of this.realtimeInterviewService.streamAnswer(
          userId,
          id,
          dto.question
        )) {
          subject.next({ data: chunk });
        }
        subject.complete();
      } catch (error) {
        subject.error(error);
      }
    })();

    return subject.asObservable();
  }

  @Post('session/:id/end')
  async endSession(@Request() req, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.realtimeInterviewService.endSession(userId, id);
  }
}
