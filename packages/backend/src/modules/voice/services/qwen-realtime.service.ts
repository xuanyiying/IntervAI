import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

export interface QwenRealtimeCallbacks {
  /** Streaming transcript of the user's ongoing speech. */
  onPartial?: (text: string) => void;
  /** Final transcript of one user utterance (VAD sentence end). */
  onSentenceEnd?: (text: string) => void;
  /** VAD detected speech start on the server side. */
  onSpeechStarted?: () => void;
  /** VAD detected speech end on the server side. */
  onSpeechStopped?: () => void;
  /** Streaming text of the model's answer. */
  onAnswerDelta?: (text: string) => void;
  /** Model response finished. `cancelled` = interrupted by user speech. */
  onAnswerDone?: (info: { cancelled: boolean; answer: string }) => void;
  /** Streaming output audio chunk (base64 PCM 24kHz 16bit mono). */
  onAnswerAudio?: (base64Pcm: string) => void;
  onError?: (message: string) => void;
  onClosed?: () => void;
}

export interface QwenRealtimeOptions {
  /** System instructions applied to the whole session. */
  instructions?: string;
  /** TTS voice name (Qwen realtime voice, e.g. `longanqian_v3.1`). */
  voice?: string;
  /** When false the session is text-only (`modalities: ["text"]`). */
  outputAudio?: boolean;
  turnDetection?: 'server_vad' | 'smart_turn';
  /** server_vad sensitivity, -1.0..1.0, default 0.5. */
  vadThreshold?: number;
  /** server_vad trailing silence in ms before the model responds. */
  vadSilenceMs?: number;
  /** Source language hint for input transcription (e.g. `zh`). */
  language?: string;
}

const DEFAULT_MODEL = 'qwen-audio-3.1-realtime-plus';
const DEFAULT_VOICE = 'longanqian_v3.1';

/** Qwen realtime system voices (3.1 Plus). */
const QWEN_VOICES = new Set([
  'longanqian_v3.1',
  'longanhuan_v3.1',
  'longanlingxin_v3.1',
  'longanfengyue_v3.1',
  'xunanchuan_v3.1',
  'beth_v3.1',
  'betty_v3.1',
  'cally_v3.1',
]);

/**
 * Map a legacy cosyvoice voice code to a Qwen realtime voice. Unknown or
 * "default" ids fall back to the configured default voice.
 */
export function resolveQwenVoice(voiceId: string | undefined, fallback: string): string {
  const id = (voiceId || '').trim();
  if (QWEN_VOICES.has(id)) return id;
  if (id.startsWith('longan') || id.startsWith('xunanchuan')) return id;
  return fallback || DEFAULT_VOICE;
}

interface RealtimeEvent {
  type: string;
  event_id?: string;
  delta?: string;
  transcript?: string;
  audio?: string;
  response?: { status?: string; status_details?: unknown };
  error?: { message?: string; code?: string };
}

/**
 * A single end-to-end realtime voice session backed by DashScope
 * Qwen-Audio Realtime (OpenAI-Realtime-style WebSocket events). Accepts raw
 * PCM16LE mono 16kHz audio and emits user transcripts plus streaming model
 * text/audio answers. Server-side VAD handles turn-taking and interruptions.
 */
export class QwenRealtimeSession {
  private readonly logger = new Logger(QwenRealtimeSession.name);
  private ws?: WebSocket;
  private opened = false;
  private closed = false;
  private answerText = '';

  constructor(
    private readonly apiKey: string,
    private readonly wsUrl: string,
    private readonly model: string,
    private readonly callbacks: QwenRealtimeCallbacks,
    private readonly options: QwenRealtimeOptions
  ) { }

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.wsUrl}?model=${encodeURIComponent(this.model)}`;
      const ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'user-agent': 'IntervAI-Backend/1.0',
        },
      });
      this.ws = ws;

      const timeout = setTimeout(() => {
        reject(new Error('Realtime handshake timed out'));
        ws.terminate();
      }, 10000);

      ws.on('open', () => {
        // Config is applied once the server confirms with session.updated.
        this.send({ type: 'session.update', session: this.buildSessionConfig() });
      });

      ws.on('message', (data) => {
        let event: RealtimeEvent;
        try {
          event = JSON.parse(data.toString());
        } catch {
          return;
        }
        this.handleEvent(event, timeout, resolve, reject);
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        this.logger.error(`Realtime websocket error: ${err.message}`);
        if (!this.opened && !this.closed) {
          reject(err);
        } else {
          this.callbacks.onError?.(err.message);
        }
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        if (!this.opened && !this.closed) {
          reject(new Error('Realtime connection closed before session ready'));
        }
        this.cleanup();
      });
    });
  }

  /** Feed one chunk of raw PCM16LE mono 16kHz audio. */
  sendAudio(chunk: Buffer): void {
    if (!this.isOpen()) return;
    this.send({
      type: 'input_audio_buffer.append',
      audio: chunk.toString('base64'),
    });
  }

  /** Ask the model to stop its current response (barge-in). */
  cancelResponse(): void {
    if (!this.isOpen()) return;
    this.send({ type: 'response.cancel' });
  }

  /** Trigger a model response without user input (e.g. the opening line). */
  createResponse(): void {
    if (!this.isOpen()) return;
    // Qwen realtime requires instructions (or input/history) on a manual
    // response.create — a bare event is rejected by the server.
    this.send({
      type: 'response.create',
      response: { instructions: this.options.instructions },
    });
  }

  /** Close the session; waits briefly for in-flight output to drain. */
  async finish(): Promise<void> {
    if (this.closed || !this.ws) return;
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (this.closed) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 3000);
    });
    this.close();
  }

  close(): void {
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.cleanup();
  }

  private buildSessionConfig(): Record<string, unknown> {
    const outputAudio = this.options.outputAudio !== false;
    const config: Record<string, unknown> = {
      modalities: outputAudio ? ['audio', 'text'] : ['text'],
      instructions: this.options.instructions,
      // Audio formats are left to server defaults (pcm16 16kHz in / pcm24 24kHz out),
      // matching the official quickstart.
      turn_detection: {
        type: this.options.turnDetection || 'server_vad',
        threshold: this.options.vadThreshold ?? 0.5,
        silence_duration_ms: this.options.vadSilenceMs ?? 800,
      },
    };
    if (outputAudio) {
      config.voice = resolveQwenVoice(this.options.voice, DEFAULT_VOICE);
    }
    if (this.options.language) {
      config.input_audio_transcription = { language: this.options.language };
    }
    return config;
  }

  private handleEvent(
    event: RealtimeEvent,
    handshakeTimeout: NodeJS.Timeout,
    resolve: () => void,
    reject: (err: Error) => void
  ): void {
    switch (event.type) {
      case 'session.created':
        return;
      case 'session.updated':
        if (!this.opened) {
          clearTimeout(handshakeTimeout);
          this.opened = true;
          resolve();
        }
        return;
      case 'error': {
        const message = event.error?.message || event.error?.code || 'unknown realtime error';
        this.logger.warn(`Realtime error event: ${message}`);
        clearTimeout(handshakeTimeout);
        if (!this.opened && !this.closed) {
          reject(new Error(message));
        } else {
          this.callbacks.onError?.(message);
        }
        return;
      }
      case 'conversation.item.input_audio_transcription.delta':
        if (event.delta) this.callbacks.onPartial?.(event.delta);
        return;
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) this.callbacks.onSentenceEnd?.(event.transcript.trim());
        return;
      case 'input_audio_buffer.speech_started':
        this.callbacks.onSpeechStarted?.();
        return;
      case 'input_audio_buffer.speech_stopped':
        this.callbacks.onSpeechStopped?.();
        return;
      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.answerText += event.delta;
          this.callbacks.onAnswerDelta?.(event.delta);
        }
        return;
      case 'response.audio.delta':
        // Audio may arrive in `audio` (OpenAI style) or `delta` (Qwen quickstart).
        if (event.audio || event.delta)
          this.callbacks.onAnswerAudio?.((event.audio || event.delta) as string);
        return;
      case 'response.done': {
        const cancelled = event.response?.status === 'cancelled';
        const answer = this.answerText;
        this.answerText = '';
        this.callbacks.onAnswerDone?.({ cancelled, answer });
        return;
      }
      default:
        return;
    }
  }

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(payload: Record<string, unknown>): void {
    try {
      this.ws?.send(JSON.stringify(payload));
    } catch (err: any) {
      this.logger.warn(`Failed to send realtime event: ${err?.message}`);
    }
  }

  private cleanup(): void {
    if (!this.closed) {
      this.closed = true;
      this.callbacks.onClosed?.();
    }
  }
}

@Injectable()
export class QwenRealtimeService {
  private readonly logger = new Logger(QwenRealtimeService.name);
  private readonly apiKey: string;
  private readonly wsUrl: string;
  private readonly model: string;
  private readonly defaultVoice: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('DASHSCOPE_API_KEY') || '';
    this.wsUrl =
      configService.get<string>('QWEN_REALTIME_URL') ||
      'wss://dashscope.aliyuncs.com/api-ws/v1/realtime';
    this.model =
      configService.get<string>('QWEN_REALTIME_AUDIO_MODEL') || DEFAULT_MODEL;
    this.defaultVoice =
      configService.get<string>('QWEN_REALTIME_VOICE') || DEFAULT_VOICE;

    if (!this.apiKey) {
      this.logger.warn(
        'DASHSCOPE_API_KEY is not set. Qwen realtime voice will not work.'
      );
    }
    this.logger.log(`Qwen realtime engine: model=${this.model}`);
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  getDefaultVoice(): string {
    return this.defaultVoice;
  }

  async createSession(
    callbacks: QwenRealtimeCallbacks,
    options?: QwenRealtimeOptions
  ): Promise<QwenRealtimeSession> {
    const session = new QwenRealtimeSession(
      this.apiKey,
      this.wsUrl,
      this.model,
      callbacks,
      options || {}
    );
    await session.open();
    return session;
  }
}
