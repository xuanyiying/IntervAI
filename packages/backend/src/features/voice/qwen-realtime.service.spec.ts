import http from 'http';
import { WebSocketServer, WebSocket as WsClient } from 'ws';
import {
  QwenRealtimeService,
  QwenRealtimeSession,
  resolveQwenVoice,
} from './qwen-realtime.service';
import { buildWav } from './wav.util';

/**
 * Starts a local WebSocket server that mimics the DashScope realtime API:
 * it answers `session.update` with `session.updated` and records every
 * client event for assertions.
 */
function startMockRealtimeServer(): Promise<{
  server: WebSocketServer;
  port: number;
  clientEvents: any[];
  send: (event: any) => void;
  close: () => Promise<void>;
}> {
  const httpServer = http.createServer();
  const wss = new WebSocketServer({ server: httpServer });
  const clientEvents: any[] = [];
  let client: WsClient | undefined;

  wss.on('connection', (ws) => {
    client = ws;
    ws.on('message', (data) => {
      let event: any;
      try {
        event = JSON.parse(data.toString());
      } catch {
        return;
      }
      clientEvents.push(event);
      // Mimic the realtime API: confirm config changes.
      if (event.type === 'session.update') {
        ws.send(JSON.stringify({ type: 'session.updated', session: event.session }));
      }
    });
  });

  return new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      const port = (httpServer.address() as any).port;
      resolve({
        server: wss,
        port,
        clientEvents,
        send: (event) => client?.send(JSON.stringify(event)),
        close: () =>
          new Promise((done) => {
            wss.close();
            httpServer.close(() => done());
          }),
      });
    });
  });
}

/** Wait until `predicate` is true or the timeout elapses. */
async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor timed out');
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe('QwenRealtimeSession', () => {
  let mock: Awaited<ReturnType<typeof startMockRealtimeServer>>;

  beforeEach(async () => {
    mock = await startMockRealtimeServer();
  });

  afterEach(async () => {
    await mock.close();
  });

  function createSession(
    callbacks: ConstructorParameters<typeof QwenRealtimeSession>[3],
    options: ConstructorParameters<typeof QwenRealtimeSession>[4] = {}
  ) {
    return new QwenRealtimeSession(
      'test-key',
      `ws://127.0.0.1:${mock.port}`,
      'qwen-audio-3.1-realtime-plus',
      callbacks,
      options
    );
  }

  it('applies a text-only session config on connect', async () => {
    const session = createSession({}, { outputAudio: false, instructions: 'be brief' });
    await session.open();

    const update = mock.clientEvents.find((e) => e.type === 'session.update');
    expect(update).toBeDefined();
    expect(update.session.modalities).toEqual(['text']);
    expect(update.session.instructions).toBe('be brief');
    expect(update.session.voice).toBeUndefined();
    // Formats are left to server defaults (no explicit fields), per official quickstart.
    expect(update.session.input_audio_format).toBeUndefined();
    expect(update.session.output_audio_format).toBeUndefined();
    expect(update.session.turn_detection.type).toBe('server_vad');

    session.close();
  });

  it('applies an audio session config with the requested voice', async () => {
    const session = createSession(
      {},
      { outputAudio: true, voice: 'longanhuan_v3.1' }
    );
    await session.open();

    const update = mock.clientEvents.find((e) => e.type === 'session.update');
    expect(update.session.modalities).toEqual(['audio', 'text']);
    expect(update.session.voice).toBe('longanhuan_v3.1');

    session.close();
  });

  it('streams audio chunks as base64 append events', async () => {
    const session = createSession({});
    await session.open();

    const pcm = Buffer.from([1, 2, 3, 4]);
    session.sendAudio(pcm);
    await waitFor(() =>
      mock.clientEvents.some((e) => e.type === 'input_audio_buffer.append')
    );

    const append = mock.clientEvents.find(
      (e) => e.type === 'input_audio_buffer.append'
    );
    expect(append.audio).toBe(pcm.toString('base64'));

    session.close();
  });

  it('parses transcripts, answer deltas, audio and completion events', async () => {
    const events: string[] = [];
    const audioChunks: string[] = [];
    let done: { cancelled: boolean; answer: string } | undefined;

    const session = createSession({
      onSentenceEnd: (text) => events.push(text),
      onAnswerDelta: (delta) => events.push(delta),
      onAnswerAudio: (audio) => audioChunks.push(audio),
      onAnswerDone: (info) => {
        done = info;
      },
    });
    await session.open();

    mock.send({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: ' 你好 ',
    });
    mock.send({ type: 'response.audio_transcript.delta', delta: '第一句 ' });
    mock.send({ type: 'response.audio_transcript.delta', delta: '第二句' });
    mock.send({ type: 'response.audio.delta', audio: 'QUJD' });
    mock.send({ type: 'response.audio.delta', delta: 'RFVG' });
    mock.send({ type: 'response.done', response: { status: 'completed' } });

    await waitFor(() => Boolean(done));

    expect(events[0]).toBe('你好');
    expect(events[1]).toBe('第一句 ');
    expect(events[2]).toBe('第二句');
    expect(audioChunks).toEqual(['QUJD', 'RFVG']);
    expect(done!.cancelled).toBe(false);
    expect(done!.answer).toBe('第一句 第二句');

    session.close();
  });

  it('reports cancelled responses and surfaces error events', async () => {
    const errors: string[] = [];
    let done: { cancelled: boolean; answer: string } | undefined;

    const session = createSession({
      onAnswerDone: (info) => {
        done = info;
      },
      onError: (message) => errors.push(message),
    });
    await session.open();

    mock.send({ type: 'response.done', response: { status: 'cancelled' } });
    mock.send({ type: 'error', error: { message: 'boom' } });

    await waitFor(() => Boolean(done) && errors.length > 0);

    expect(done!.cancelled).toBe(true);
    expect(errors).toEqual(['boom']);

    session.close();
  });

  it('sends response.create for proactive replies', async () => {
    const session = createSession({});
    await session.open();

    session.createResponse();
    await waitFor(() =>
      mock.clientEvents.some((e) => e.type === 'response.create')
    );
    expect(
      mock.clientEvents.find((e) => e.type === 'response.create')?.response
        ?.instructions
    ).toBeTruthy();

    session.close();
  });

  it('notifies onClosed when the server drops the connection', async () => {
    let closed = false;
    const session = createSession({ onClosed: () => { closed = true; } });
    await session.open();

    mock.server.clients.forEach((ws) => ws.close());
    await waitFor(() => closed);

    expect(closed).toBe(true);
  });
});

describe('resolveQwenVoice', () => {
  it('passes through known qwen voices', () => {
    expect(resolveQwenVoice('longanqian_v3.1', 'fallback')).toBe(
      'longanqian_v3.1'
    );
  });

  it('falls back for unknown or default voice ids', () => {
    expect(resolveQwenVoice('default', 'fallback')).toBe('fallback');
    expect(resolveQwenVoice(undefined, 'fallback')).toBe('fallback');
  });
});

describe('buildWav', () => {
  it('wraps raw PCM in a 44-byte WAV header', () => {
    const pcm = Buffer.alloc(100, 7);
    const wav = buildWav(pcm, 16000);

    expect(wav.length).toBe(144);
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(16000);
    expect(wav.readUInt32LE(40)).toBe(100);
  });
});

describe('QwenRealtimeService', () => {
  it('is unavailable without an API key and reports its default voice', () => {
    const service = new QwenRealtimeService({
      get: (key: string) => (key === 'QWEN_REALTIME_VOICE' ? 'beth_v3.1' : ''),
    } as any);

    expect(service.isAvailable()).toBe(false);
    expect(service.getDefaultVoice()).toBe('beth_v3.1');
  });

  it('is available with an API key', () => {
    const service = new QwenRealtimeService({
      get: (key: string) => (key === 'DASHSCOPE_API_KEY' ? 'sk-test' : ''),
    } as any);

    expect(service.isAvailable()).toBe(true);
  });
});
