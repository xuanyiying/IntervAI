declare module 'uuid';
declare module 'ali-oss';
declare module 'word-extractor' {
  export class WordExtractorDocument {
    getBody(): string;
    getTextboxes(): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getHeaders(): string;
    getFooters(): string;
    getAnnotations(): string;
  }
  export class WordExtractor {
    constructor();
    extract(input: Buffer | string): Promise<WordExtractorDocument>;
  }
  export default WordExtractor;
}
declare module '@opentelemetry/sdk-node';
declare module '@opentelemetry/exporter-trace-otlp-http';
declare module '@opentelemetry/auto-instrumentations-node';
