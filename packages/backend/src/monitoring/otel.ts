import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export async function initOpenTelemetry() {
  if (process.env.OTEL_ENABLE !== 'true') return;
  try {
    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_OTLP_URL || 'http://localhost:4318/v1/traces',
      headers: {},
    });
    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()],
      resource: undefined,
    });
    await sdk.start();
    // Graceful shutdown hooks
    process.on('SIGTERM', async () => {
      await sdk.shutdown();
    });
    process.on('SIGINT', async () => {
      await sdk.shutdown();
    });
    // eslint-disable-next-line no-console
    console.log('[OTEL] OpenTelemetry initialized');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      '[OTEL] Initialization skipped:',
      e instanceof Error ? e.message : String(e)
    );
  }
}
