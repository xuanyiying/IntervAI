export async function initOpenTelemetry() {
  if (process.env.OTEL_ENABLE !== 'true') return;
  try {
    const { OTLPTraceExporter } =
      await import('@opentelemetry/exporter-trace-otlp-http');
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } =
      await import('@opentelemetry/auto-instrumentations-node');
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
