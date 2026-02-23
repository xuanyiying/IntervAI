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
import { PrismaService } from '@/prisma/prisma.service';
import { InterviewSessionService } from './services/interview-session.service';
import { AlibabaVoiceService } from '@/voice/voice.service';
import { StorageService } from '@/storage/storage.service';
import { JwtPayload } from '@/auth/interfaces/jwt-payload.interface';
import { FileType } from '@/storage/interfaces/storage.interface';

@WebSocketGateway({
  namespace: '/interview',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class InterviewGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InterviewGateway.name);
  private authenticatedClients = new Map<string, string>(); // clientId -> userId
  private activeSessions = new Map<string, string>(); // clientId -> sessionId
  private audioBuffers = new Map<string, Buffer[]>(); // sessionId -> Buffer[]

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
      this.logger.debug(`User ${userId} connected for interview: ${client.id}`);
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

  @SubscribeMessage('join_interview')
  async handleJoinInterview(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId) return;

    // Verify session ownership
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: data.sessionId },
    });

    if (!session || session.userId !== userId) {
      client.emit('error', { message: 'Unauthorized or session not found' });
      return;
    }

    this.activeSessions.set(client.id, data.sessionId);
    client.join(data.sessionId);
    client.emit('joined_interview', { sessionId: data.sessionId });
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: { sessionId: string; chunk: any },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    // Accumulate chunks for real-time processing or final transcription
    const chunk = Buffer.isBuffer(data.chunk)
      ? data.chunk
      : Buffer.from(data.chunk);
    const chunks = this.audioBuffers.get(data.sessionId) || [];
    chunks.push(chunk);
    this.audioBuffers.set(data.sessionId, chunks);

    // For production-grade real-time experience, we could trigger ASR every N chunks
    // or use a dedicated streaming ASR client.
    if (chunks.length % 5 === 0) {
      const fullBuffer = Buffer.concat(chunks);
      try {
        const partialTranscription =
          await this.voiceService.transcribeAudio(fullBuffer);
        if (partialTranscription) {
          client.emit('transcription_partial', { text: partialTranscription });
        }
      } catch (error: any) {
        // Silent fail for partial transcription to avoid disrupting the flow
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
        filename: `interview-${data.sessionId}-${Date.now()}.webm`,
        mimetype: 'audio/webm',
        size: buffer.length,
        fileType: FileType.AUDIO,
      } as any);

      const transcription = await this.voiceService.transcribeAudio(buffer);
      client.emit('transcription', { text: transcription });

      const result = await this.interviewSessionService.submitAnswer(
        userId,
        data.sessionId,
        transcription,
        storageFile.url
      );

      if (result.nextQuestion) {
        const nextContent = result.nextQuestion.question;
        client.emit('ai_response', { text: nextContent });

        const session = await this.prisma.interviewSession.findUnique({
          where: { id: data.sessionId },
        });

        const audioBuffer = await this.voiceService.synthesizeSpeech(
          nextContent,
          (session as any).voiceId || 'default'
        );
        client.emit('ai_audio', { audio: audioBuffer });
      } else if (result.isCompleted) {
        client.emit('interview_completed');
      }
    } catch (error) {
      this.logger.error('Failed to process audio:', error);
      client.emit('error', { message: 'Failed to process voice' });
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
