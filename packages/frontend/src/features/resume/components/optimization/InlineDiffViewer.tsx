import React, { useMemo } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { theme } from 'antd';
import './InlineDiffViewer.css';

interface InlineDiffViewerProps {
  original: string;
  optimized: string;
  splitView?: boolean;
  showDiffOnly?: boolean;
  language?: string;
}

const InlineDiffViewer: React.FC<InlineDiffViewerProps> = ({
  original,
  optimized,
  splitView = false,
  showDiffOnly = true,
  language = 'plaintext',
}) => {
  const { token } = theme.useToken();

  const styles = useMemo(
    () => ({
      variables: {
        light: {
          diffViewerBackground: token.colorBgContainer,
          diffViewerColor: token.colorText,
          addedBackground: '#f6ffed',
          addedColor: '#389e0d',
          removedBackground: '#fff2f0',
          removedColor: '#cf1322',
          wordAddedBackground: '#b7eb8f',
          wordRemovedBackground: '#ffa39e',
          addedGutterBackground: '#f6ffed',
          removedGutterBackground: '#fff2f0',
          gutterBackground: token.colorBgLayout,
          gutterBackgroundDark: token.colorFillSecondary,
          highlightBackground: '#ffe58f',
          highlightGutterBackground: '#fff566',
          codeFoldGutterBackground: token.colorFillQuaternary,
          codeFoldBackground: '#fafafa',
          emptyLineBackground: token.colorBgLayout,
          gutterColor: token.colorTextTertiary,
          addedGutterColor: '#389e0d',
          removedGutterColor: '#cf1322',
          codeFoldContentColor: token.colorTextSecondary,
          diffViewerTitleBackground: token.colorBgLayout,
          diffViewerTitleColor: token.colorTextSecondary,
          diffViewerTitleBorderColor: token.colorBorder,
        },
        dark: {
          diffViewerBackground: token.colorBgContainer,
          diffViewerColor: token.colorText,
          addedBackground: '#162312',
          addedColor: '#73d13d',
          removedBackground: '#2a1215',
          removedColor: '#ff4d4f',
          wordAddedBackground: '#237804',
          wordRemovedBackground: '#a8071a',
          addedGutterBackground: '#162312',
          removedGutterBackground: '#2a1215',
          gutterBackground: token.colorBgElevated,
          gutterBackgroundDark: token.colorFillSecondary,
          highlightBackground: '#594100',
          highlightGutterBackground: '#8c6d00',
          codeFoldGutterBackground: token.colorFillQuaternary,
          codeFoldBackground: token.colorBgLayout,
          emptyLineBackground: token.colorBgLayout,
          gutterColor: token.colorTextTertiary,
          addedGutterColor: '#73d13d',
          removedGutterColor: '#ff4d4f',
          codeFoldContentColor: token.colorTextSecondary,
          diffViewerTitleBackground: token.colorBgElevated,
          diffViewerTitleColor: token.colorTextSecondary,
          diffViewerTitleBorderColor: token.colorBorderSecondary,
        },
      },
      line: {
        padding: '6px 12px',
        fontSize: '13px',
        lineHeight: '1.6',
      },
    }),
    [token]
  );

  if (!original && !optimized) {
    return null;
  }

  return (
    <div className="inline-diff-viewer">
      <ReactDiffViewer
        oldValue={original}
        newValue={optimized}
        splitView={splitView}
        showDiffOnly={showDiffOnly}
        useDarkTheme={false}
        leftTitle="原文"
        rightTitle="优化后"
        styles={styles}
        codeFoldMessage="... (折叠)"
        hideLineNumbers
        language={language}
      />
    </div>
  );
};

export default InlineDiffViewer;
