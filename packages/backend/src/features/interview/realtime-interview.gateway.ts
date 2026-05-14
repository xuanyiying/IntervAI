import { JwtPayload } from '@/core/auth/interfaces/jwt-payload.interface';
import { StorageService } from '@/core/storage/storage.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InterviewSessionService } from './services/interview-session.service';

@WebSocketGateway({
  namespace: '/realtime-interview',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class RealtimeInterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeInterviewGateway.name);
  private authenticatedClients = new Map<string, string>();
  private activeSessions = new Map<string, string>();
  private sessionVoices = new Map<string, string>();
  private audioBuffers = new Map<string, Buffer[]>();
  private rateLimiters = new Map<string, number>();

  private readonly MAX_AUDIO_BUFFER_SIZE = 5 * 1024 * 1024; // 5MB MAX
  private readonly WS_RATE_LIMIT_MS = 2000; // 2 seconds between aggressive events

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly interviewSessionService: InterviewSessionService,
    private readonly voiceService: AlibabaVoiceService,
    private readonly storageService: StorageService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      this.authenticatedClients.set(client.id, userId);
      this.logger.debug(
        `User ${userId} connected for realtime interview: ${client.id}`
      );
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    if (userId) {
      this.logger.debug(`User ${userId} disconnected: ${client.id}`);
    }
    this.authenticatedClients.delete(client.id);

    const sessionId = this.activeSessions.get(client.id);
    if (sessionId) {
      this.activeSessions.delete(client.id);
      this.audioBuffers.delete(sessionId);
    }
    this.rateLimiters.delete(client.id);
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string; voiceId?: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    const session = await this.interviewSessionService.getSession(
      userId,
      data.sessionId
    );
    if (!session) {
      client.emit('error', { message: 'Unauthorized or session not found' });
      return;
    }

    this.activeSessions.set(client.id, data.sessionId);

    if (data.voiceId) {
      this.sessionVoices.set(data.sessionId, data.voiceId);
    } else if (session.voiceId) {
      this.sessionVoices.set(data.sessionId, session.voiceId);
    }

    client.join(data.sessionId);
    client.emit('joined_session', { sessionId: data.sessionId });
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: { sessionId: string; chunk: any },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const chunk = Buffer.isBuffer(data.chunk)
      ? data.chunk
      : Buffer.from(data.chunk);
    const chunks = this.audioBuffers.get(data.sessionId) || [];
    chunks.push(chunk);

    // Defense: MAX_AUDIO_BUFFER_SIZE check
    const currentSize = chunks.reduce((acc, c) => acc + c.length, 0);
    if (currentSize > this.MAX_AUDIO_BUFFER_SIZE) {
      this.logger.warn(`Session ${data.sessionId} exceeded 5MB max audio buffer! Dropping chunks to prevent OOM.`);
      this.audioBuffers.delete(data.sessionId);
      client.emit('error', { message: 'Audio payload too large, connection reset.' });
      return;
    }

    this.audioBuffers.set(data.sessionId, chunks);

    if (chunks.length % 5 === 0) {
      const fullBuffer = Buffer.concat(chunks);
      try {
        const partialTranscription =
          await this.voiceService.transcribeAudio(fullBuffer);
        if (partialTranscription) {
          client.emit('transcription_partial', { text: partialTranscription });
        }
      } catch (error: any) {
        this.logger.warn('Partial transcription failed:', error?.message);
      }
    }
  }

  @SubscribeMessage('end_audio')
  async handleEndAudio(
    @MessageBody() data: { sessionId: string; audioBuffer: any },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    // Rate limiter
    const lastActive = this.rateLimiters.get(client.id) || 0;
    if (Date.now() - lastActive < this.WS_RATE_LIMIT_MS) {
      this.logger.warn(`Rate limit hit by ${userId} on end_audio`);
      return;
    }
    this.rateLimiters.set(client.id, Date.now());

    try {
      const accumulatedChunks = this.audioBuffers.get(data.sessionId) || [];
      this.audioBuffers.delete(data.sessionId);

      let buffer: Buffer;
      if (accumulatedChunks.length > 0) {
        buffer = Buffer.concat(accumulatedChunks);
      } else {
        buffer = Buffer.isBuffer(data.audioBuffer)
          ? data.audioBuffer
          : Buffer.from(data.audioBuffer);
      }

      const transcription = await this.voiceService.transcribeAudio(buffer);
      client.emit('transcription', { text: transcription });

      client.emit('generating_answer');

      const voiceId = this.getSessionVoiceId(data.sessionId);

      let fullAnswer = '';
      for await (const chunk of this.interviewSessionService.streamAnswer(
        userId,
        data.sessionId,
        transcription
      )) {
        fullAnswer += chunk;
        client.emit('answer_chunk', { chunk });
      }

      client.emit('answer_complete', { answer: fullAnswer });

      const audioBuffer = await this.voiceService.synthesizeSpeech(
        fullAnswer,
        voiceId
      );
      client.emit('answer_audio', { audio: audioBuffer });
    } catch (error) {
      this.logger.error('Failed to process audio:', error);
      client.emit('error', { message: 'Failed to process voice' });
    }
  }

  @SubscribeMessage('detect_question')
  async handleDetectQuestion(
    @MessageBody() data: { sessionId: string; audioBuffer: any },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    // Rate limiter
    const lastActive = this.rateLimiters.get(client.id) || 0;
    if (Date.now() - lastActive < this.WS_RATE_LIMIT_MS) {
      return; // Silently drop too frequent detects
    }
    this.rateLimiters.set(client.id, Date.now());

    try {
      const buffer = Buffer.isBuffer(data.audioBuffer)
        ? data.audioBuffer
        : Buffer.from(data.audioBuffer);

      const transcription = await this.voiceService.transcribeAudio(buffer);

      const questionPatterns = [
        /[？?]$/,
        /^(what|how|why|when|where|who|which|can|could|would|should|do|did|does|is|are|was|were|have|has|had|will|tell|describe|explain|share|give)\s/i,
        /^(请|能否|怎么|如何|为什么|什么|哪个|谁|哪里|什么时候|描述|解释|分享|谈谈|说说)/i,
        /\b(question|ask|wonder|curious)\b/i,
      ];

      const isQuestion = questionPatterns.some((pattern) =>
        pattern.test(transcription.trim())
      );

      client.emit('question_detected', {
        text: transcription,
        isQuestion,
      });

      if (isQuestion && transcription.trim().length > 3) {
        client.emit('generating_answer');

        const voiceId = this.getSessionVoiceId(data.sessionId);

        let fullAnswer = '';
        for await (const chunk of this.interviewSessionService.streamAnswer(
          userId,
          data.sessionId,
          transcription
        )) {
          fullAnswer += chunk;
          client.emit('answer_chunk', { chunk });
        }

        client.emit('answer_complete', { answer: fullAnswer });

        const audioBuffer = await this.voiceService.synthesizeSpeech(
          fullAnswer,
          voiceId
        );
        client.emit('answer_audio', { audio: audioBuffer });
      }
    } catch (error) {
      this.logger.error('Failed to detect question:', error);
      client.emit('error', { message: 'Failed to detect question' });
    }
  }

  @SubscribeMessage('send_question')
  async handleSendQuestion(
    @MessageBody() data: { sessionId: string; question: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    // Rate limiter
    const lastActive = this.rateLimiters.get(client.id) || 0;
    if (Date.now() - lastActive < this.WS_RATE_LIMIT_MS) {
      client.emit('error', { message: 'Too many requests. Please slow down.' });
      return;
    }
    this.rateLimiters.set(client.id, Date.now());

    try {
      client.emit('generating_answer');

      const voiceId = this.getSessionVoiceId(data.sessionId);

      let fullAnswer = '';
      for await (const chunk of this.interviewSessionService.streamAnswer(
        userId,
        data.sessionId,
        data.question
      )) {
        fullAnswer += chunk;
        client.emit('answer_chunk', { chunk });
      }

      client.emit('answer_complete', { answer: fullAnswer });

      const audioBuffer = await this.voiceService.synthesizeSpeech(
        fullAnswer,
        voiceId
      );
      client.emit('answer_audio', { audio: audioBuffer });
    } catch (error) {
      this.logger.error('Failed to generate answer:', error);
      client.emit('error', { message: 'Failed to generate answer' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  private getSessionVoiceId(sessionId: string): string {
    return this.sessionVoices.get(sessionId) || 'default';
  }

  private extractToken(client: Socket): string | null {
    const auth =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!auth) return null;
    return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
  }
}
