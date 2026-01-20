export const HTTP_TIMEOUT_MS = Number(
  import.meta.env.VITE_HTTP_TIMEOUT_MS ?? '120000'
);

export const UPLOAD_TIMEOUT_MS = Number(
  import.meta.env.VITE_UPLOAD_TIMEOUT_MS ?? '120000'
);

export const PARSE_TIMEOUT_MS = Number(
  import.meta.env.VITE_PARSE_TIMEOUT_MS ?? '120000'
);
