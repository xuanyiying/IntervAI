import { JwtPayload } from '@/core/auth/interfaces/jwt-payload.interface';
import { FileType } from '@/core/storage/interfaces/storage.interface';
import { StorageService } from '@/core/storage/storage.service';
import {
  QwenRealtimeService,
  QwenRealtimeSession,
} from '@/features/voice/qwen-realtime.service';
import { SpeakerVerifyService } from '@/features/voice/speaker-verify.service';
import {
  StreamingAsrService,
  StreamingAsrSession,
} from '@/features/voice/streaming-asr.service';
import { AlibabaVoiceService } from '@/features/voice/voice.service';
import { buildWav } from '@/features/voice/wav.util';
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

/** 'interviewer' = tab/system audio (or room mic when single-channel);
 *  'self' = the user's own microphone. */
type AudioChannel = 'interviewer' | 'self';
type Speaker = 'interviewer' | 'self';

interface LiveStreamState {
  sessionId: string;
  userId: string;
  channel: AudioChannel;
  sampleRate: number;
  startedAt: number;
  engine: 'asr' | 'realtime';
  asr?: StreamingAsrSession;
  rt?: QwenRealtimeSession;
  /** Last finalized interviewer transcription (for question_detected). */
  lastUtterance?: string;
  transcriptParts: string[];
  autoAnswer: boolean;
  /** When false, audio from this stream never joins the session recording. */
  record: boolean;
  /** Rolling PCM tail used for per-sentence voiceprint verification. */
  recentPcm: Buffer[];
  recentPcmBytes: number;
}

interface SessionRecordingState {
  userId: string;
  chunks: Buffer[];
  totalBytes: number;
  startedAt: number;
  sampleRate: number;
}

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
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeInterviewGateway.name);
  private authenticatedClients = new Map<string, string>();
  private activeSessions = new Map<string, string>();
  private sessionVoices = new Map<string, string>();
  private audioBuffers = new Map<string, Buffer[]>();
  private rateLimiters = new Map<string, number>();
  /** Key: `${sessionId}:${channel}` */
  private liveStreams = new Map<string, LiveStreamState>();
  private sessionRecordings = new Map<string, SessionRecordingState>();
  private generatingSessions = new Set<string>();
  private finishingRecordings = new WeakSet<SessionRecordingState>();

  private readonly MAX_AUDIO_BUFFER_SIZE = 5 * 1024 * 1024; // 5MB per legacy utterance buffer
  private readonly WS_RATE_LIMIT_MS = 2000; // 2 seconds between aggressive events
  private readonly MAX_RECORDING_BYTES = 120 * 1024 * 1024; // ~1h of 16kHz mono PCM
  private readonly MAX_RECENT_PCM_BYTES = 20 * 2 * 16000; // ~20s tail for voiceprint

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly interviewSessionService: InterviewSessionService,
    private readonly voiceService: AlibabaVoiceService,
    private readonly streamingAsrService: StreamingAsrService,
    private readonly qwenRealtimeService: QwenRealtimeService,
    private readonly speakerVerify: SpeakerVerifyService,
    private readonly storageService: StorageService
  ) { }

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

  async handleDisconnect(client: Socket) {
    const userId = this.authenticatedClients.get(client.id);
    if (userId) {
      this.logger.debug(`User ${userId} disconnected: ${client.id}`);
    }
    this.authenticatedClients.delete(client.id);

    const sessionId = this.activeSessions.get(client.id);
    if (sessionId) {
      this.activeSessions.delete(client.id);
      this.audioBuffers.delete(sessionId);

      const states = this.getChannelStates(sessionId, userId);
      if (states.length > 0) {
        this.logger.log(
          `Persisting streams for session ${sessionId} after disconnect`
        );
        for (const state of states) {
          await this.finalizeChannelStream(state).catch((err) =>
            this.logger.warn(
              `Failed to finalize stream on disconnect: ${err?.message}`
            )
          );
        }
        await this.finalizeRecording(sessionId).catch((err) =>
          this.logger.warn(
            `Failed to persist recording on disconnect: ${err?.message}`
          )
        );
      }
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
    client.emit('joined_session', {
      sessionId: data.sessionId,
      realtimeAsrAvailable: this.streamingAsrService.isAvailable(),
      voiceprintAvailable: this.speakerVerify.isAvailable(),
    });
  }

  /**
   * Start a live listening stream. `channel` distinguishes the audio source:
   *  - 'interviewer': tab/system audio shared via getDisplayMedia, or the
   *    room microphone in single-channel mode. This channel drives question
   *    detection and auto-answering.
   *  - 'self': the user's own microphone in dual-channel mode. Used for
   *    speaker-labeled subtitles; never triggers auto-answering.
   */
  @SubscribeMessage('start_stream')
  async handleStartStream(
    @MessageBody()
    data: {
      sessionId: string;
      sampleRate?: number;
      autoAnswer?: boolean;
      channel?: AudioChannel;
      record?: boolean;
    },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const channel: AudioChannel = data.channel === 'self' ? 'self' : 'interviewer';
    const streamKey = this.streamKey(data.sessionId, channel);

    const existing = this.liveStreams.get(streamKey);
    if (existing) {
      // A stream is already running for this session+channel (e.g. reconnect).
      client.emit('stream_started', {
        sessionId: data.sessionId,
        channel,
        resumed: true,
      });
      return;
    }

    if (!this.streamingAsrService.isAvailable()) {
      client.emit('error', {
        message:
          'Realtime ASR is not available (DASHSCOPE_API_KEY missing). Use text or legacy voice input instead.',
      });
      return;
    }

    const state: LiveStreamState = {
      sessionId: data.sessionId,
      userId,
      channel,
      sampleRate: data.sampleRate || 16000,
      startedAt: Date.now(),
      engine: 'asr',
      transcriptParts: [],
      autoAnswer: data.autoAnswer !== false,
      record: data.record !== false,
      recentPcm: [],
      recentPcmBytes: 0,
    };
    this.liveStreams.set(streamKey, state);

    // Prefer the end-to-end realtime engine on the interviewer channel when
    // auto-answering is enabled (transcription + answering in one session).
    if (
      channel === 'interviewer' &&
      state.autoAnswer &&
      this.realtimeEngineEnabled()
    ) {
      const started = await this.tryStartRealtimeEngine(state).catch(
        (err: any) => {
          this.logger.warn(
            `Realtime engine failed for ${streamKey}, falling back to ASR: ${err?.message}`
          );
          return false;
        }
      );
      if (started) {
        client.emit('stream_started', {
          sessionId: data.sessionId,
          channel,
          engine: 'realtime',
        });
        this.logger.log(`Live stream started (qwen-realtime) for ${streamKey}`);
        return;
      }
    }

    try {
      await this.attachAsrSession(state);
      state.engine = 'asr';

      client.emit('stream_started', {
        sessionId: data.sessionId,
        channel,
        engine: 'asr',
      });
      this.logger.log(`Live stream started for ${streamKey}`);
    } catch (err: any) {
      this.liveStreams.delete(streamKey);
      this.logger.error('Failed to start ASR stream:', err?.message);
      client.emit('error', {
        message: `Failed to start realtime recognition: ${err?.message}`,
      });
    }
  }

  /** Continuous PCM audio chunk (base64, 16-bit LE mono) from the client. */
  @SubscribeMessage('audio_data')
  handleAudioData(
    @MessageBody()
    data: { sessionId: string; audio: string | ArrayBuffer; channel?: AudioChannel },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const channel: AudioChannel = data.channel === 'self' ? 'self' : 'interviewer';
    const state = this.liveStreams.get(
      this.streamKey(data.sessionId, channel)
    );
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

    // Rolling tail for voiceprint verification.
    state.recentPcm.push(chunk);
    state.recentPcmBytes += chunk.length;
    while (state.recentPcmBytes > this.MAX_RECENT_PCM_BYTES && state.recentPcm.length > 1) {
      const dropped = state.recentPcm.shift();
      state.recentPcmBytes -= dropped?.length ?? 0;
    }

    // Whole-session recording: use the user's own mic (room audio) when
    // available; otherwise fall back to the single active stream.
    const recording = this.sessionRecordings.get(data.sessionId);
    const selfExists = this.liveStreams.has(this.streamKey(data.sessionId, 'self'));
    const recordsThisChannel =
      channel === 'self' || (channel === 'interviewer' && !selfExists);

    if (state.record && recordsThisChannel) {
      if (recording) {
        if (recording.totalBytes + chunk.length <= this.MAX_RECORDING_BYTES) {
          recording.chunks.push(chunk);
          recording.totalBytes += chunk.length;
        } else if (recording.chunks.length > 0) {
          this.logger.warn(
            `Recording cap reached for session ${data.sessionId}; stopping recording growth`
          );
        }
      } else {
        this.sessionRecordings.set(data.sessionId, {
          userId,
          chunks: [chunk],
          totalBytes: chunk.length,
          startedAt: Date.now(),
          sampleRate: state.sampleRate,
        });
      }
    }

    if (state.rt) {
      state.rt.sendAudio(chunk);
    } else {
      state.asr?.sendAudio(chunk);
    }
  }

  @SubscribeMessage('set_auto_answer')
  handleSetAutoAnswer(
    @MessageBody() data: { sessionId: string; enabled: boolean },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    for (const state of this.getChannelStates(data.sessionId, userId)) {
      state.autoAnswer = Boolean(data.enabled);
    }
  }

  /**
   * Stop the live stream(s). With `channel`, only that channel's ASR is
   * finalized (recording keeps running). Without it, everything is finalized:
   * the WAV recording is uploaded and transcript + recording URL persisted.
   */
  @SubscribeMessage('stop_stream')
  async handleStopStream(
    @MessageBody() data: { sessionId: string; channel?: AudioChannel },
    @ConnectedSocket() client: Socket
  ) {
    const userId = this.authenticatedClients.get(client.id);
    if (!userId || this.activeSessions.get(client.id) !== data.sessionId)
      return;

    const states = data.channel
      ? [this.liveStreams.get(this.streamKey(data.sessionId, data.channel))]
      : this.getChannelStates(data.sessionId, userId);

    for (const state of states) {
      if (!state) continue;
      await this.finalizeChannelStream(state).catch((err) =>
        this.logger.warn(`Failed to finalize stream: ${err?.message}`)
      );
    }

    if (data.channel) return; // single-channel stop: recording continues

    if (this.sessionRecordings.has(data.sessionId)) {
      try {
        const result = await this.finalizeRecording(data.sessionId);
        client.emit('stream_stopped', {
          sessionId: data.sessionId,
          ...result,
        });
      } catch (err: any) {
        this.logger.error('Failed to stop live stream:', err?.message);
        client.emit('error', {
          message: `Failed to save recording: ${err?.message}`,
        });
      }
    } else {
      client.emit('stream_stopped', { sessionId: data.sessionId });
    }
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

      await this.generateAndEmitAnswer(userId, data.sessionId, transcription);
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
      const isQuestion = this.looksLikeQuestion(transcription);

      client.emit('question_detected', {
        text: transcription,
        isQuestion,
      });

      if (isQuestion && transcription.trim().length > 3) {
        await this.generateAndEmitAnswer(userId, data.sessionId, transcription);
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
      await this.generateAndEmitAnswer(userId, data.sessionId, data.question);
    } catch (error) {
      this.logger.error('Failed to generate answer:', error);
      client.emit('error', { message: 'Failed to generate answer' });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  // ------------------------------------------------------------------
  // Live stream internals
  // ------------------------------------------------------------------

  private streamKey(sessionId: string, channel: AudioChannel): string {
    return `${sessionId}:${channel}`;
  }

  private getChannelStates(sessionId: string, userId?: string): LiveStreamState[] {
    const prefix = `${sessionId}:`;
    const states: LiveStreamState[] = [];
    for (const [key, state] of this.liveStreams) {
      if (key.startsWith(prefix) && (!userId || state.userId === userId)) {
        states.push(state);
      }
    }
    return states;
  }

  private isFinishing(state: LiveStreamState): boolean {
    return state.asr == null && state.rt == null;
  }

  /** Whether the qwen-audio realtime engine should be attempted. */
  private realtimeEngineEnabled(): boolean {
    const mode = (
      process.env.REALTIME_INTERVIEW_ENGINE || 'auto'
    ).toLowerCase();
    if (mode === 'pipeline') return false;
    return this.qwenRealtimeService.isAvailable();
  }

  /**
   * Start the qwen-audio realtime engine for a live stream (assist mode:
   * transcription + text-only reference answers in one session). Returns
   * false if the session could not be established.
   */
  private async tryStartRealtimeEngine(
    state: LiveStreamState
  ): Promise<boolean> {
    const session = await this.interviewSessionService.getSession(
      state.userId,
      state.sessionId
    );
    const language = session?.language === 'ZH' ? 'zh' : 'en';
    const instructions =
      await this.interviewSessionService.buildAssistInstructions(
        state.sessionId,
        state.userId
      );

    let answerStarted = false;
    state.rt = await this.qwenRealtimeService.createSession(
      {
        onPartial: (text) => {
          this.server.to(state.sessionId).emit('transcription_partial', {
            text,
            channel: state.channel,
          });
        },
        onSentenceEnd: (text) => {
          void this.handleRealtimeSentenceEnd(state, text);
        },
        onAnswerDelta: (chunk) => {
          if (!answerStarted) {
            answerStarted = true;
            this.server.to(state.sessionId).emit('generating_answer');
          }
          this.server.to(state.sessionId).emit('answer_chunk', { chunk });
        },
        onAnswerDone: ({ cancelled, answer }) => {
          answerStarted = false;
          if (answer || cancelled) {
            this.server.to(state.sessionId).emit('answer_complete', { answer });
          }
        },
        onError: (message) => {
          this.logger.warn(
            `Realtime engine error on ${state.sessionId}:${state.channel}: ${message}`
          );
          this.server.to(state.sessionId).emit('asr_error', { message });
          void this.fallbackRealtimeToAsr(state);
        },
        onClosed: () => {
          if (
            this.liveStreams.get(
              this.streamKey(state.sessionId, state.channel)
            ) === state &&
            !this.isFinishing(state)
          ) {
            this.logger.warn(
              `Realtime engine closed unexpectedly for stream ${state.sessionId}:${state.channel}`
            );
            void this.fallbackRealtimeToAsr(state);
          }
        },
      },
      {
        instructions,
        voice: this.getSessionVoiceId(state.sessionId),
        outputAudio: false, // assist mode: text-only reference answers
        turnDetection: 'server_vad',
        language,
      }
    );
    state.engine = 'realtime';
    return true;
  }

  /** Attach the legacy paraformer ASR session to a live stream. */
  private async attachAsrSession(state: LiveStreamState): Promise<void> {
    state.asr = await this.streamingAsrService.createSession(
      {
        onPartial: (text) => {
          this.server.to(state.sessionId).emit('transcription_partial', {
            text,
            channel: state.channel,
          });
        },
        onSentenceEnd: (text) => {
          void this.handleSentenceEnd(state, text);
        },
        onError: (message) => {
          this.logger.warn(
            `ASR error on ${state.sessionId}:${state.channel}: ${message}`
          );
          this.server.to(state.sessionId).emit('asr_error', { message });
        },
        onClosed: () => {
          if (
            this.liveStreams.get(
              this.streamKey(state.sessionId, state.channel)
            ) === state &&
            !this.isFinishing(state)
          ) {
            this.logger.warn(
              `ASR connection closed unexpectedly for stream ${state.sessionId}:${state.channel}`
            );
          }
        },
      },
      { sampleRate: state.sampleRate, languageHints: ['zh', 'en'] }
    );
  }

  /** Degrade a realtime stream to the ASR pipeline after a runtime failure. */
  private async fallbackRealtimeToAsr(state: LiveStreamState): Promise<void> {
    if (
      this.liveStreams.get(this.streamKey(state.sessionId, state.channel)) !==
      state
    ) {
      return;
    }
    if (state.engine !== 'realtime') return;
    state.engine = 'asr';
    try {
      state.rt?.close();
    } catch {
      // ignore
    }
    state.rt = undefined;

    try {
      await this.attachAsrSession(state);
      this.logger.log(
        `Stream ${state.sessionId}:${state.channel} fell back to the ASR pipeline`
      );
    } catch (err: any) {
      this.logger.error(`ASR fallback failed: ${err?.message}`);
      this.server.to(state.sessionId).emit('asr_error', {
        message: 'Realtime engine lost and ASR fallback failed.',
      });
    }
  }

  /** Sentence-end handling for the realtime engine (transcription only). */
  private async handleRealtimeSentenceEnd(
    state: LiveStreamState,
    text: string
  ) {
    if (!text.trim()) return;

    const speaker = await this.resolveSpeaker(state, text);
    state.transcriptParts.push(
      `[${speaker === 'self' ? '我' : '面试官'}] ${text.trim()}`
    );
    state.lastUtterance = text.trim();
    this.server.to(state.sessionId).emit('transcription', {
      text: text.trim(),
      final: true,
      channel: state.channel,
      speaker,
    });

    // The model decides via its instructions whether the utterance is a
    // question; the event only drives the frontend indicator.
    if (speaker === 'interviewer' && state.autoAnswer) {
      this.server.to(state.sessionId).emit('question_detected', {
        text: text.trim(),
        isQuestion: true,
        auto: true,
      });
    }
  }

  private async handleSentenceEnd(state: LiveStreamState, text: string) {
    if (!text.trim()) return;

    const speaker = await this.resolveSpeaker(state, text);
    state.transcriptParts.push(`[${speaker === 'self' ? '我' : '面试官'}] ${text.trim()}`);
    this.server.to(state.sessionId).emit('transcription', {
      text: text.trim(),
      final: true,
      channel: state.channel,
      speaker,
    });

    // Only interviewer speech drives auto-answering.
    if (speaker !== 'interviewer') return;
    if (!state.autoAnswer || this.generatingSessions.has(state.sessionId)) return;
    if (!this.looksLikeQuestion(text)) return;

    this.server.to(state.sessionId).emit('question_detected', {
      text: text.trim(),
      isQuestion: true,
      auto: true,
    });

    await this.generateAndEmitAnswer(state.userId, state.sessionId, text.trim());
  }

  /**
   * Determine who spoke: 'self' channel is always the user. On the
   * 'interviewer' channel, voiceprint verification (when enrolled) catches
   * the user's own voice leaking into the room mic.
   */
  private async resolveSpeaker(
    state: LiveStreamState,
    text: string
  ): Promise<Speaker> {
    if (state.channel === 'self') return 'self';

    if (!this.speakerVerify.isAvailable()) return 'interviewer';

    try {
      const profile = await this.prisma.speakerProfile.findUnique({
        where: { userId: state.userId },
      });
      if (!profile) return 'interviewer';

      const tail = this.takeRecentTail(state, text);
      if (!tail || tail.length < state.sampleRate) return 'interviewer'; // <1s

      const embedding = this.speakerVerify.extractEmbedding(tail, state.sampleRate);
      if (!embedding) return 'interviewer';

      const isSelf = this.speakerVerify.isSelf(
        embedding,
        profile.embedding as number[]
      );
      if (isSelf) {
        this.logger.debug(`Voiceprint: user speech on session ${state.sessionId}`);
        return 'self';
      }
    } catch (err: any) {
      this.logger.warn(`Voiceprint verification failed: ${err?.message}`);
    }
    return 'interviewer';
  }

  /** Slice the rolling PCM tail covering the estimated duration of `text`. */
  private takeRecentTail(state: LiveStreamState, text: string): Buffer | null {
    const bytesPerSec = 2 * state.sampleRate;
    // ~4 chars/sec for mixed zh/en; clamp to 2..12s
    const seconds = Math.min(12, Math.max(2, text.trim().length / 4));
    const wanted = Math.min(
      Math.floor(seconds * bytesPerSec),
      state.recentPcmBytes
    );
    if (wanted <= 0) return null;

    const parts: Buffer[] = [];
    let taken = 0;
    for (let i = state.recentPcm.length - 1; i >= 0 && taken < wanted; i--) {
      const chunk = state.recentPcm[i];
      const need = wanted - taken;
      if (chunk.length <= need) {
        parts.unshift(chunk);
        taken += chunk.length;
      } else {
        parts.unshift(chunk.subarray(chunk.length - need));
        taken = wanted;
      }
    }
    return Buffer.concat(parts);
  }

  private async generateAndEmitAnswer(
    userId: string,
    sessionId: string,
    question: string
  ) {
    if (this.generatingSessions.has(sessionId)) return;
    this.generatingSessions.add(sessionId);

    try {
      this.server.to(sessionId).emit('generating_answer');

      const voiceId = this.getSessionVoiceId(sessionId);

      let fullAnswer = '';
      for await (const chunk of this.interviewSessionService.streamAnswer(
        userId,
        sessionId,
        question
      )) {
        fullAnswer += chunk;
        this.server.to(sessionId).emit('answer_chunk', { chunk });
      }

      this.server.to(sessionId).emit('answer_complete', { answer: fullAnswer });

      const audioBuffer = await this.voiceService.synthesizeSpeech(
        fullAnswer,
        voiceId
      );
      this.server.to(sessionId).emit('answer_audio', { audio: audioBuffer });
    } finally {
      this.generatingSessions.delete(sessionId);
    }
  }

  private looksLikeQuestion(text: string): boolean {
    const trimmed = (text || '').trim();
    if (trimmed.length <= 3) return false;
    const questionPatterns = [
      /[？?]$/,
      /^(what|how|why|when|where|who|which|can|could|would|should|do|did|does|is|are|was|were|have|has|had|will|tell|describe|explain|share|give)\s/i,
      /^(请|能否|怎么|如何|为什么|什么|哪个|谁|哪里|什么时候|描述|解释|分享|谈谈|说说)/i,
      /\b(question|ask|wonder|curious)\b/i,
    ];
    return questionPatterns.some((pattern) => pattern.test(trimmed));
  }

  /** Finalize a single channel's ASR (recording is handled separately). */
  private async finalizeChannelStream(state: LiveStreamState): Promise<void> {
    this.liveStreams.delete(this.streamKey(state.sessionId, state.channel));

    try {
      await state.rt?.finish();
    } catch (err: any) {
      this.logger.warn(`Realtime session finish failed: ${err?.message}`);
    }
    state.rt?.close();
    state.rt = undefined;

    try {
      await state.asr?.finish();
    } catch (err: any) {
      this.logger.warn(`ASR finish failed: ${err?.message}`);
    }
    state.asr?.close();

    // Persist the channel transcript into the session record.
    if (state.transcriptParts.length > 0) {
      try {
        const session = await this.prisma.interviewSession.findUnique({
          where: { id: state.sessionId },
          select: { transcript: true },
        });
        const existing = session?.transcript ? `${session.transcript}\n` : '';
        await this.prisma.interviewSession.update({
          where: { id: state.sessionId },
          data: {
            transcript: `${existing}${state.transcriptParts.join('\n')}`,
          },
        });
      } catch (err: any) {
        this.logger.warn(
          `Failed to persist channel transcript: ${err?.message}`
        );
      }
    }
  }

  /** Build the WAV recording, upload it and persist metadata. */
  private async finalizeRecording(sessionId: string): Promise<{
    durationSec: number;
    transcript: string;
    recordingUrl?: string;
  }> {
    const recording = this.sessionRecordings.get(sessionId);
    if (!recording) {
      return { durationSec: 0, transcript: '' };
    }
    this.finishingRecordings.add(recording);
    this.sessionRecordings.delete(sessionId);

    const durationSec = recording.chunks.length
      ? Math.round(recording.totalBytes / (2 * recording.sampleRate))
      : 0;

    let transcript = '';
    try {
      const session = await this.prisma.interviewSession.findUnique({
        where: { id: sessionId },
        select: { transcript: true },
      });
      transcript = session?.transcript ?? '';
    } catch {
      /* transcript read is best-effort */
    }

    let recordingUrl: string | undefined;
    if (recording.chunks.length > 0) {
      try {
        const wav = buildWav(
          Buffer.concat(recording.chunks),
          recording.sampleRate
        );
        const uploaded = await this.storageService.uploadFile({
          userId: recording.userId,
          originalName: `interview-recording-${sessionId}.wav`,
          mimetype: 'audio/wav',
          size: wav.length,
          buffer: wav,
          fileType: FileType.AUDIO,
          category: 'interview_recording',
        });
        recordingUrl = uploaded.url;
      } catch (err: any) {
        this.logger.error(
          `Failed to upload recording for session ${sessionId}:`,
          err?.message
        );
      }
    }

    try {
      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          recordingUrl: recordingUrl ?? null,
          recordingDuration: durationSec,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to persist recording metadata for session ${sessionId}:`,
        err?.message
      );
    }

    this.server.to(sessionId).emit('recording_saved', {
      sessionId,
      durationSec,
      hasRecording: Boolean(recordingUrl),
    });

    return { durationSec, transcript, recordingUrl };
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
