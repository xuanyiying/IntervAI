function randomHex(bytes: number) {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateTraceparent(): string {
  const version = '00';
  const traceId = randomHex(16 * 1); // 16 bytes => 32 hex
  const spanId = randomHex(8 * 1); // 8 bytes => 16 hex
  const flags = '01';
  return `${version}-${traceId}-${spanId}-${flags}`;
}
