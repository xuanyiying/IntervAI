export const HTTP_TIMEOUT_MS = Number(
  import.meta.env.VITE_HTTP_TIMEOUT_MS ?? '120000'
);

export const UPLOAD_TIMEOUT_MS = Number(
  import.meta.env.VITE_UPLOAD_TIMEOUT_MS ?? '120000'
);

// Parse timeout is longer because AI processing can take time.
// Even if this timeout fires, the frontend now enters polling mode
// instead of showing an error.
export const PARSE_TIMEOUT_MS = Number(
  import.meta.env.VITE_PARSE_TIMEOUT_MS ?? '180000'
);
