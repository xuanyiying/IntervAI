import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';

export interface StreamingAsrOptions {
  sampleRate?: number;
  languageHints?: string[];
}

export interface StreamingAsrCallbacks {
  onPartial?: (text: string) => void;
  onSentenceEnd?: (text: string) => void;
  onError?: (message: string) => void;
  onClosed?: () => void;
}

interface DashScopeHeader {
  task_id?: string;
  event?: string;
  error_code?: string;
  error_message?: string;
}

interface DashScopeMessage {
  header: DashScopeHeader;
  payload?: {
    output?: {
      sentence?: {
        text?: string;
        begin_time?: number;
        end_time?: number;
      };
    };
  };
}

const DASHSCOPE_WS_URL =
  'wss://dashscope.aliyuncs.com/api-ws/v1/inference';
const DEFAULT_MODEL = 'paraformer-realtime-v2';

/**
 * A single real-time ASR session backed by DashScope Paraformer realtime
 * (WebSocket). Accepts raw PCM (16-bit LE mono) audio chunks and emits
 * partial transcriptions plus finalized sentences.
 */
export class StreamingAsrSession {
  private readonly logger = new Logger(StreamingAsrSession.name);
  private ws?: WebSocket;
  private taskId?: string;
  private started = false;
  private finished = false;
  private closed = false;

  constructor(
    private readonly apiKey: string,
    private readonly callbacks: StreamingAsrCallbacks,
    private readonly options: StreamingAsrOptions
  ) {}

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(DASHSCOPE_WS_URL, {
        headers: {
          Authorization: `bearer ${this.apiKey}`,
          'user-agent': 'IntervAI-Backend/1.0',
          'X-DashScope-WorkSpace': '',
        },
      });
      this.ws = ws;

      const timeout = setTimeout(() => {
        reject(new Error('ASR handshake timed out'));
        ws.terminate();
      }, 10000);

      ws.on('open', () => {
        this.taskId = randomUUID().replace(/-/g, '');
        this.send({
          header: {
            task_id: this.taskId,
            action: 'run-task',
            streaming: 'out',
          },
          payload: {
            task_group: 'audio',
            task: 'asr',
            function: 'recognition',
            model: DEFAULT_MODEL,
            input: {},
            parameters: {
              format: 'pcm',
              sample_rate: this.options.sampleRate || 16000,
              language_hints: this.options.languageHints || ['zh', 'en'],
            },
          },
        });
      });

      ws.on('message', (data) => {
        let msg: DashScopeMessage;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          return;
        }
        const event = msg.header?.event;

        if (event === 'task-started') {
          clearTimeout(timeout);
          this.started = true;
          resolve();
        } else if (event === 'result-generated') {
          const sentence = msg.payload?.output?.sentence;
          if (!sentence?.text) return;
          // During ongoing speech end_time stays -1; once >= 0 the
          // sentence is final (VAD-based segmentation by Paraformer).
          if (
            typeof sentence.end_time === 'number' &&
            sentence.end_time >= 0
          ) {
            this.callbacks.onSentenceEnd?.(sentence.text.trim());
          } else {
            this.callbacks.onPartial?.(sentence.text.trim());
          }
        } else if (event === 'task-failed') {
          clearTimeout(timeout);
          const message = `${msg.header.error_code}: ${msg.header.error_message}`;
          this.logger.warn(`ASR task failed: ${message}`);
          this.callbacks.onError?.(message);
          if (!this.started && !this.closed) {
            reject(new Error(message));
          }
          ws.close();
        } else if (event === 'task-finished') {
          this.cleanup();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        this.logger.error(`ASR websocket error: ${err.message}`);
        if (!this.started && !this.closed) {
          reject(err);
        } else {
          this.callbacks.onError?.(err.message);
        }
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        this.cleanup();
      });
    });
  }

  /** Feed one chunk of raw PCM16LE mono audio. */
  sendAudio(chunk: Buffer): void {
    if (!this.started || this.finished || this.closed || !this.isOpen()) {
      return;
    }
    this.send({
      header: {
        task_id: this.taskId,
        action: 'continue-task',
        streaming: 'in-out',
      },
      payload: { input: { audio: chunk.toString('base64') } },
    });
  }

  /** Signal end of audio and wait for the provider to finish. */
  async finish(): Promise<void> {
    if (!this.started || this.finished || this.closed || !this.isOpen()) {
      return;
    }
    this.finished = true;
    this.send({
      header: {
        task_id: this.taskId,
        action: 'finish-task',
        streaming: 'in',
      },
      payload: { input: {} },
    });
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
      }, 5000);
    });
  }

  close(): void {
    this.finished = true;
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.cleanup();
  }

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(payload: Record<string, unknown>): void {
    try {
      this.ws?.send(JSON.stringify(payload));
    } catch (err: any) {
      this.logger.warn(`Failed to send ASR frame: ${err?.message}`);
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
export class StreamingAsrService {
  private readonly logger = new Logger(StreamingAsrService.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('DASHSCOPE_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        'DASHSCOPE_API_KEY is not set. Realtime ASR will not work.'
      );
    }
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async createSession(
    callbacks: StreamingAsrCallbacks,
    options?: StreamingAsrOptions
  ): Promise<StreamingAsrSession> {
    const session = new StreamingAsrSession(
      this.apiKey,
      callbacks,
      options || {}
    );
    await session.open();
    return session;
  }
}
