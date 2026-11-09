export function getAiTimeouts() {
  return {
    streamTimeoutMs: Number(process.env.AI_STREAM_TIMEOUT_MS ?? '120000'),
  };
}

export function getAiRetryConfig() {
  return {
    maxRetries: Number(process.env.AI_MAX_RETRIES ?? '3'),
    initialDelayMs: Number(process.env.AI_RETRY_INITIAL_MS ?? '1000'),
    maxDelayMs: Number(process.env.AI_RETRY_MAX_MS ?? '10000'),
    backoffMultiplier: Number(process.env.AI_RETRY_MULTIPLIER ?? '2'),
  };
}
