/** Shared PCM16 capture helpers for realtime interview audio. */

export const ASSIST_SAMPLE_RATE = 16000;

export function floatTo16BitBase64(input: Float32Array): string {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(output.buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** RMS of a PCM frame, normalized to 0..1 for volume visualizers. */
export function frameVolume(input: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input[i] * input[i];
  }
  return Math.min(1, Math.sqrt(sum / input.length) * 4);
}

/** Output sample rate of the qwen-audio realtime engine (PCM16 mono). */
export const REALTIME_OUTPUT_SAMPLE_RATE = 24000;

/**
 * Streaming PCM player for realtime interview audio. Chunks arrive as base64
 * PCM16 mono (24 kHz) and are scheduled gap-free onto the audio timeline.
 * `stop()` cuts playback immediately for barge-in interruptions.
 */
export class PcmStreamPlayer {
  private context?: AudioContext;
  private gain?: GainNode;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onDrained?: () => void;
  private draining = false;

  constructor(options?: { onDrained?: () => void }) {
    this.onDrained = options?.onDrained;
  }

  /** True while any scheduled audio is still audible. */
  get isPlaying(): boolean {
    return this.sources.size > 0;
  }

  playChunk(base64: string): void {
    if (!base64) return;
    const samples = this.decodeBase64Pcm(base64);
    if (samples.length === 0) return;

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const buffer = ctx.createBuffer(
      1,
      samples.length,
      REALTIME_OUTPUT_SAMPLE_RATE
    );
    buffer.copyToChannel(samples, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain!);
    source.onended = () => {
      this.sources.delete(source);
      if (this.draining && this.sources.size === 0) {
        this.draining = false;
        this.onDrained?.();
      }
    };

    // Schedule back-to-back from the last scheduled position.
    const now = ctx.currentTime;
    if (this.nextStartTime < now) this.nextStartTime = now + 0.02;
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
    this.draining = true;
  }

  /** Stop playback immediately and drop all scheduled chunks (barge-in). */
  stop(): void {
    for (const source of this.sources) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear();
    this.draining = false;
    this.nextStartTime = 0;
  }

  dispose(): void {
    this.stop();
    this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.gain = undefined;
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.connect(this.context.destination);
    }
    return this.context;
  }

  private decodeBase64Pcm(base64: string): Float32Array<ArrayBuffer> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const usable = bytes.length - (bytes.length % 2);
    const int16 = new Int16Array(bytes.buffer, 0, usable / 2);
    const samples = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) samples[i] = int16[i] / 32768;
    return samples;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Record `durationSec` seconds of microphone audio and return base64
 * PCM16 (used for voiceprint enrollment).
 */
export async function capturePcmBase64(
  durationSec: number,
  onProgress?: (remainingSec: number) => void
): Promise<{ base64: string; sampleRate: number }> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const audioContext = new AudioContext({ sampleRate: ASSIST_SAMPLE_RATE });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  // Muted destination keeps the processor pulling without playback.
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0;
  processor.connect(silentGain);
  silentGain.connect(audioContext.destination);

  try {
    for (let remaining = Math.round(durationSec); remaining > 0; remaining--) {
      onProgress?.(remaining);
      await sleep(1000);
    }
  } finally {
    processor.onaudioprocess = null;
    try {
      processor.disconnect();
      source.disconnect();
    } catch {
      /* noop */
    }
    stream.getTracks().forEach((t) => t.stop());
    audioContext.close().catch(() => undefined);
  }

  let totalLength = 0;
  for (const chunk of chunks) totalLength += chunk.length;
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return { base64: floatTo16BitBase64(merged), sampleRate: audioContext.sampleRate };
}
