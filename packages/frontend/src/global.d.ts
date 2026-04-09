declare global {
  let APP_TITLE: string | undefined;
}

declare module 'react-diff-viewer-continued' {
  import { CSSProperties } from 'react';

  interface DiffViewerProps {
    oldValue: string;
    newValue: string;
    splitView?: boolean;
    showDiffOnly?: boolean;
    useDarkTheme?: boolean;
    leftTitle?: string;
    rightTitle?: string;
    styles?: Record<string, any>;
    codeFoldMessage?: string;
    hideLineNumbers?: boolean;
    language?: string;
  }

  const ReactDiffViewer: React.ComponentType<DiffViewerProps>;
  export default ReactDiffViewer;
}

export {};
