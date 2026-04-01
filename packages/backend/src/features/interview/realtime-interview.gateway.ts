import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/shared/database/prisma.service';
import { RealtimeInterviewService } from './services/realtime-interview.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { StorageService } from '@/core/storage/storage.service';
import { JwtPayload } from '@/core/auth/interfaces/jwt-payload.interface';
import { FileType } from '@/core/storage/interfaces/storage.interface';

@WebSocketGateway({
  namespace: '/realtime-interview',
  cors: {
    origin: '*',
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
  private audioBuffers = new Map<string, Buffer[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly realtimeInterviewService: RealtimeInterviewService,
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
      this.logger.debug(`User ${userId} connected for realtime interview: ${client.id}`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.authenticatedClients.delete(client.id);
    this.activeSessions.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    const session = await this.realtimeInterviewService.getSession(userId, data.sessionId);
    if (!session) {
      client.emit('error', { message: 'Unauthorized or session not found' });
      return;
    }

    this.activeSessions.set(client.id, data.sessionId);
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

    try {
      const buffer = Buffer.isBuffer(data.audioBuffer)
        ? data.audioBuffer
        : Buffer.from(data.audioBuffer);

      this.audioBuffers.delete(data.sessionId);

      const storageFile = await this.storageService.uploadFile({
        userId,
        buffer,
        filename: `realtime-interview-${data.sessionId}-${Date.now()}.webm`,
        mimetype: 'audio/webm',
        size: buffer.length,
        fileType: FileType.AUDIO,
      } as any);

      const transcription = await this.voiceService.transcribeAudio(buffer);
      client.emit('transcription', { text: transcription });

      client.emit('generating_answer');

      let fullAnswer = '';
      for await (const chunk of this.realtimeInterviewService.streamAnswer(
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
        'default'
      );
      client.emit('answer_audio', { audio: audioBuffer });
    } catch (error) {
      this.logger.error('Failed to process audio:', error);
      client.emit('error', { message: 'Failed to process voice' });
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

    try {
      client.emit('generating_answer');

      let fullAnswer = '';
      for await (const chunk of this.realtimeInterviewService.streamAnswer(
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
        'default'
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

  private extractToken(client: Socket): string | null {
    const auth =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!auth) return null;
    return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
  }
}
