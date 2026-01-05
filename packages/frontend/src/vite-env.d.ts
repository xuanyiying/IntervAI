/// <reference types="vite/client" />

declare global {
  interface Window {
    APP_TITLE?: string;
  }

  let APP_TITLE: string | undefined;
}

export {};
