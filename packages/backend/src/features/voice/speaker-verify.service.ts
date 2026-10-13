import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Speaker verification via voiceprint embeddings.
 *
 * Uses an optional local sherpa-onnx speaker-embedding model (e.g. CAM++ /
 * ERES2Net ONNX). When the `sherpa-onnx-node` package or the model file is
 * missing, `isAvailable()` returns false and the realtime gateway falls back
 * to channel-based speaker attribution only.
 *
 * Enable by:
 *   1. `pnpm add sherpa-onnx-node` in packages/backend
 *   2. Downloading a speaker embedding ONNX model, e.g.
 *      https://github.com/k2-fsa/sherpa-onnx/releases (speaker recognition)
 *   3. Setting VOICEPRINT_MODEL_PATH=/abs/path/model.onnx
 */

let sherpaOnnx: any | null = null;
try {
  // Optional dependency: absent installs degrade gracefully.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sherpaOnnx = require('sherpa-onnx-node');
} catch {
  sherpaOnnx = null;
}

@Injectable()
export class SpeakerVerifyService {
  private readonly logger = new Logger(SpeakerVerifyService.name);
  private extractor: any = null;
  private dimension = 0;

  /** Cosine similarity above which a sentence is attributed to the user. */
  readonly threshold = Number(process.env.VOICEPRINT_THRESHOLD || 0.6);

  constructor() {
    const bundledModel = path.resolve(
      process.cwd(),
      'models/3dspeaker_speech_campplus_sv_zh-cn_16k-common.onnx'
    );
    const modelPath =
      process.env.VOICEPRINT_MODEL_PATH ||
      (fs.existsSync(bundledModel) ? bundledModel : '');
    if (!modelPath) {
      this.logger.log('Voiceprint disabled: no speaker embedding model found');
      return;
    }
    if (!sherpaOnnx) {
      this.logger.warn(
        'Voiceprint disabled: sherpa-onnx-node is not installed (pnpm add sherpa-onnx-node)'
      );
      return;
    }
    try {
      this.extractor = new sherpaOnnx.SpeakerEmbeddingExtractor({
        model: modelPath,
        numThreads: 1,
        debug: false,
        provider: 'cpu',
      });
      this.dimension = this.extractor.dim; // property in sherpa-onnx-node
      this.logger.log(
        `Voiceprint enabled: model=${modelPath} dim=${this.dimension}`
      );
    } catch (err: any) {
      this.extractor = null;
      this.logger.warn(`Voiceprint init failed: ${err?.message}`);
    }
  }

  isAvailable(): boolean {
    return !!this.extractor;
  }

  /** Extract a speaker embedding from 16kHz (or any rate) mono PCM16 bytes. */
  extractEmbedding(pcm16: Buffer, sampleRate = 16000): number[] | null {
    if (!this.extractor) return null;
    try {
      const samples = pcm16ToFloat32(pcm16);
      if (samples.length < sampleRate / 2) return null; // <0.5s is unreliable
      const stream = this.extractor.createStream();
      stream.acceptWaveform({ sampleRate, samples });
      stream.inputFinished();
      const embedding: Float32Array = this.extractor.compute(stream);
      return Array.from(embedding);
    } catch (err: any) {
      this.logger.warn(`Embedding extraction failed: ${err?.message}`);
      return null;
    }
  }

  /** Merge a new enrollment sample into an existing embedding (running mean). */
  mergeEmbeddings(
    existing: number[] | null,
    existingCount: number,
    fresh: number[]
  ): number[] {
    if (!existing || existing.length !== fresh.length || existingCount < 1) {
      return fresh;
    }
    const merged = existing.map(
      (v, i) => (v * existingCount + fresh[i]) / (existingCount + 1)
    );
    return normalize(merged);
  }

  similarity(a: number[], b: number[]): number {
    if (!a?.length || a.length !== b.length) return 0;
    return cosineSimilarity(a, b);
  }

  /** True when the embedding is closer to the enrolled user voice. */
  isSelf(embedding: number[], enrolled: number[]): boolean {
    return this.similarity(embedding, enrolled) >= this.threshold;
  }
}

export function pcm16ToFloat32(pcm16: Buffer): Float32Array {
  const samples = new Float32Array(Math.floor(pcm16.length / 2));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = pcm16.readInt16LE(i * 2) / 32768;
  }
  return samples;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}
