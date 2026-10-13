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
import { InterviewSessionService } from './services/interview-session.service';
import {
  QwenRealtimeService,
  QwenRealtimeSession,
} from '@/features/voice/qwen-realtime.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { buildWav } from '@/features/voice/wav.util';
import { StorageService } from '@/core/storage/storage.service';
import { JwtPayload } from '@/core/auth/interfaces/jwt-payload.interface';
import { FileType } from '@/core/storage/interfaces/storage.interface';

interface VoiceCallState {
  userId: string;
  sessionId: string;
  rt: QwenRealtimeSession;
  /** Ordered dialogue parts as they were spoken. */
  dialogueParts: { role: 'user' | 'interviewer'; text: string }[];
  recording: { chunks: Buffer[]; totalBytes: number; sampleRate: number };
  /** True while an intentional teardown is in progress. */
  closing: boolean;
}

@WebSocketGateway({
  namespace: '/interview',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
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
  private rateLimiters = new Map<string, number>(); // clientId -> timestamp

  // Whole-session recording state (parallel to audioBuffers, which is
  // drained on every end_audio utterance).
  private sessionRecordings = new Map<
    string,
    { userId: string; chunks: Buffer[]; totalBytes: number; firstChunkAt: number; lastChunkAt: number }
  >();

  /** Active realtime voice calls. Key: sessionId. */
  private voiceCalls = new Map<string, VoiceCallState>();

  private readonly MAX_AUDIO_BUFFER_SIZE = 5 * 1024 * 1024; // 5MB MAX
  private readonly MAX_RECORDING_BYTES = 120 * 1024 * 1024; // hard cap for full-session recordings
  private readonly WS_RATE_LIMIT_MS = 2000; // 2 seconds between aggressive events
  private readonly VOICE_SAMPLE_RATE = 16000;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly interviewSessionService: InterviewSessionService,
    private readonly qwenRealtimeService: QwenRealtimeService,
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

  async handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    this.authenticatedClients.delete(client.id);
    const sessionId = this.activeSessions.get(client.id);
    this.activeSessions.delete(client.id);
    this.rateLimiters.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);

    if (sessionId) {
      const recording = this.sessionRecordings.get(sessionId);
      if (recording && recording.userId === userId) {
        // Persist what we have so far when the user leaves mid-interview.
        await this.finalizeSessionRecording(sessionId).catch((err) =>
          this.logger.warn(
            `Failed to persist recording on disconnect: ${err?.message}`
          )
        );
      }

      const voiceCall = this.voiceCalls.get(sessionId);
      if (voiceCall && voiceCall.userId === userId) {
        await this.teardownVoiceCall(sessionId, voiceCall).catch((err) =>
          this.logger.warn(
            `Failed to tear down voice call on disconnect: ${err?.message}`
          )
        );
      }
    }
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

    // Whole-session recording accumulation (chunks of a single MediaRecorder
    // stream concatenate back into a valid webm file).
    const recording = this.sessionRecordings.get(data.sessionId);
    if (recording) {
      if (recording.totalBytes + chunk.length <= this.MAX_RECORDING_BYTES) {
        recording.chunks.push(chunk);
        recording.totalBytes += chunk.length;
        recording.lastChunkAt = Date.now();
      } else {
        this.logger.warn(
          `Recording cap reached for session ${data.sessionId}; stopping recording growth`
        );
      }
    } else {
      this.sessionRecordings.set(data.sessionId, {
        userId,
        chunks: [chunk],
        totalBytes: chunk.length,
        firstChunkAt: Date.now(),
        lastChunkAt: Date.now(),
      });
    }

    const chunks = this.audioBuffers.get(data.sessionId) || [];
    chunks.push(chunk);

    // Defense: MAX_AUDIO_BUFFER_SIZE check
    const currentSize = chunks.reduce((acc, c) => acc + c.length, 0);
    if (currentSize > this.MAX_AUDIO_BUFFER_SIZE) {
      this.logger.warn(
        `Session ${data.sessionId} exceeded 5MB max audio buffer! Dropping chunks to prevent OOM.`
      );
      this.audioBuffers.delete(data.sessionId);
      client.emit('error', {
        message: 'Audio payload too large, connection reset.',
      });
      return;
    }

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

      const storageFile = await this.storageService.uploadFile({
        userId,
        buffer,
        originalName: `interview-${data.sessionId}-${Date.now()}.webm`,
        mimetype: 'audio/webm',
        size: buffer.length,
        fileType: FileType.AUDIO,
      });

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
        await this.finalizeSessionRecording(data.sessionId).catch((err) =>
          this.logger.warn(
            `Failed to persist recording on completion: ${err?.message}`
          )
        );
      }
    } catch (error) {
      this.logger.error('Failed to process audio:', error);
      client.emit('error', { message: 'Failed to process voice' });
    }
  }

  // ------------------------------------------------------------------
  // Realtime voice call (qwen-audio realtime, mock interview)
  // ------------------------------------------------------------------

  /**
   * Start an end-to-end realtime voice call: the model plays the interviewer
   * (questions from the session's question list), the user answers verbally.
   * Falls back to the legacy audio_chunk/end_audio flow on failure.
   */
  @SubscribeMessage('voice_start')
  async handleVoiceStart(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const existing = this.voiceCalls.get(data.sessionId);
    if (existing) {
      client.emit('voice_started', { sessionId: data.sessionId });
      return;
    }

    if (!this.qwenRealtimeService.isAvailable()) {
      client.emit('voice_error', {
        message:
          'Realtime voice is unavailable (DASHSCOPE_API_KEY missing). Falling back to the standard flow.',
      });
      return;
    }

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: data.sessionId },
    });
    if (!session || session.userId !== userId) {
      client.emit('error', { message: 'Unauthorized or session not found' });
      return;
    }

    const state: VoiceCallState = {
      userId,
      sessionId: data.sessionId,
      rt: undefined as unknown as QwenRealtimeSession,
      dialogueParts: [],
      recording: {
        chunks: [],
        totalBytes: 0,
        sampleRate: this.VOICE_SAMPLE_RATE,
      },
      closing: false,
    };
    this.voiceCalls.set(data.sessionId, state);

    try {
      const instructions =
        await this.interviewSessionService.buildMockInterviewerInstructions(
          data.sessionId,
          userId
        );
      const language = session.language === 'ZH' ? 'zh' : 'en';

      state.rt = await this.qwenRealtimeService.createSession(
        {
          onPartial: (text) => {
            this.server.to(data.sessionId).emit('transcription_partial', {
              text,
            });
          },
          onSentenceEnd: (text) => {
            if (!text.trim()) return;
            state.dialogueParts.push({ role: 'user', text: text.trim() });
            this.server.to(data.sessionId).emit('transcription', {
              text: text.trim(),
              final: true,
            });
          },
          onAnswerDone: ({ cancelled, answer }) => {
            if (!cancelled && answer.trim()) {
              state.dialogueParts.push({
                role: 'interviewer',
                text: answer.trim(),
              });
              this.server
                .to(data.sessionId)
                .emit('ai_response', { text: answer.trim() });
            }
            this.server.to(data.sessionId).emit('ai_audio_stop', { cancelled });
          },
          onAnswerAudio: (base64Pcm) => {
            this.server
              .to(data.sessionId)
              .emit('ai_audio_chunk', { audio: base64Pcm });
          },
          onError: (message) => {
            this.logger.warn(
              `Voice call error on session ${data.sessionId}: ${message}`
            );
            if (!state.closing) {
              this.server.to(data.sessionId).emit('voice_error', { message });
            }
          },
          onClosed: () => {
            // Unexpected drop: notify the client so it can fall back.
            if (!state.closing && this.voiceCalls.get(data.sessionId) === state) {
              this.logger.warn(
                `Voice call connection lost for session ${data.sessionId}`
              );
              this.server
                .to(data.sessionId)
                .emit('voice_error', { message: 'Realtime voice connection lost.' });
            }
          },
        },
        {
          instructions,
          voice: session.voiceId || undefined,
          outputAudio: true,
          turnDetection: 'server_vad',
          language,
        }
      );

      client.emit('voice_started', { sessionId: data.sessionId });
      // Greeting + first question without waiting for user speech.
      state.rt.createResponse();
      this.logger.log(`Realtime voice call started for session ${data.sessionId}`);
    } catch (err: any) {
      this.voiceCalls.delete(data.sessionId);
      this.logger.error('Failed to start realtime voice call:', err?.message);
      client.emit('voice_error', {
        message: 'Realtime voice failed to start. Falling back to the standard flow.',
      });
    }
  }

  /** Stream one PCM16LE mono 16kHz chunk (base64) of the user's mic. */
  @SubscribeMessage('voice_audio')
  handleVoiceAudio(
    @MessageBody() data: { sessionId: string; audio: string | ArrayBuffer },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const state = this.voiceCalls.get(data.sessionId);
    if (!state) return;

    let chunk: Buffer;
    try {
      chunk =
        typeof data.audio === 'string'
          ? Buffer.from(data.audio, 'base64')
          : Buffer.from(new Uint8Array(data.audio));
    } catch {
      return;
    }
    if (chunk.length === 0) return;

    if (state.recording.totalBytes + chunk.length <= this.MAX_RECORDING_BYTES) {
      state.recording.chunks.push(chunk);
      state.recording.totalBytes += chunk.length;
    }

    state.rt.sendAudio(chunk);
  }

  /** End the voice call, persist the dialogue and the WAV recording. */
  @SubscribeMessage('voice_stop')
  async handleVoiceStop(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const state = this.voiceCalls.get(data.sessionId);
    if (!state) {
      client.emit('voice_stopped', { sessionId: data.sessionId });
      return;
    }

    const result = await this.teardownVoiceCall(data.sessionId, state).catch(
      (err: any) => {
        this.logger.warn(`Failed to stop voice call: ${err?.message}`);
        return { durationSec: 0, hasRecording: false };
      }
    );

    client.emit('voice_stopped', { sessionId: data.sessionId, ...result });
  }

  /**
   * Shared teardown: close the realtime session, persist the dialogue into
   * the Message table and upload the PCM recording as WAV.
   */
  private async teardownVoiceCall(
    sessionId: string,
    state: VoiceCallState
  ): Promise<{ durationSec: number; hasRecording: boolean }> {
    this.voiceCalls.delete(sessionId);
    state.closing = true;

    try {
      await state.rt.finish();
    } catch (err: any) {
      this.logger.warn(`Voice call finish failed: ${err?.message}`);
    }
    state.rt.close();

    const durationSec = state.recording.chunks.length
      ? Math.round(state.recording.totalBytes / (2 * state.recording.sampleRate))
      : 0;

    // Persist the dialogue (user answers + interviewer questions).
    if (state.dialogueParts.length > 0) {
      try {
        await this.prisma.$transaction(
          state.dialogueParts.map((part) =>
            this.prisma.interviewMessage.create({
              data: {
                sessionId,
                role: part.role === 'user' ? 'USER' : 'ASSISTANT',
                content: part.text,
              },
            })
          )
        );

        const transcript = state.dialogueParts
          .map(
            (part) =>
              `[${part.role === 'user' ? '我' : '面试官'}] ${part.text}`
          )
          .join('\n');
        const existing = await this.prisma.interviewSession.findUnique({
          where: { id: sessionId },
          select: { transcript: true },
        });
        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            transcript: existing?.transcript
              ? `${existing.transcript}\n${transcript}`
              : transcript,
          },
        });
      } catch (err: any) {
        this.logger.warn(
          `Failed to persist voice call dialogue for ${sessionId}: ${err?.message}`
        );
      }
    }

    // Upload the recording.
    let hasRecording = false;
    if (state.recording.chunks.length > 0) {
      try {
        const wav = buildWav(
          Buffer.concat(state.recording.chunks),
          state.recording.sampleRate
        );
        const uploaded = await this.storageService.uploadFile({
          userId: state.userId,
          buffer: wav,
          originalName: `interview-recording-${sessionId}.wav`,
          mimetype: 'audio/wav',
          size: wav.length,
          fileType: FileType.AUDIO,
          category: 'interview_recording',
        });
        hasRecording = true;

        await this.prisma.interviewSession.update({
          where: { id: sessionId },
          data: {
            recordingUrl: uploaded.url,
            recordingDuration: durationSec,
          },
        });

        this.server.to(sessionId).emit('recording_saved', {
          sessionId,
          durationSec,
          hasRecording: true,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to upload voice call recording for ${sessionId}:`,
          err?.message
        );
      }
    }

    return { durationSec, hasRecording };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  /**
   * Concatenate the accumulated per-session audio chunks, upload the webm
   * recording and persist recordingUrl/recordingDuration on the session.
   */
  private async finalizeSessionRecording(sessionId: string): Promise<void> {
    const recording = this.sessionRecordings.get(sessionId);
    if (!recording) return;
    this.sessionRecordings.delete(sessionId);

    const durationSec = Math.max(
      0,
      Math.round((recording.lastChunkAt - recording.firstChunkAt) / 1000)
    );

    if (recording.chunks.length === 0) return;

    try {
      const buffer = Buffer.concat(recording.chunks);
      const storageFile = await this.storageService.uploadFile({
        userId: recording.userId,
        buffer,
        originalName: `interview-recording-${sessionId}.webm`,
        mimetype: 'audio/webm',
        size: buffer.length,
        fileType: FileType.AUDIO,
      });

      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          recordingUrl: storageFile.url,
          recordingDuration: durationSec,
        },
      });

      this.server.to(sessionId).emit('recording_saved', {
        sessionId,
        durationSec,
        hasRecording: true,
      });
      this.logger.log(
        `Saved full-session recording for ${sessionId} (${durationSec}s)`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to upload session recording for ${sessionId}:`,
        error?.message
      );
    }
  }

  private extractToken(client: Socket): string | null {
    const auth =
      client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (!auth) return null;
    return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
  }
}
