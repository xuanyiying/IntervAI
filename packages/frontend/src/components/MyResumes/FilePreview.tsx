import React, { useEffect, useMemo, useState } from 'react';
import { Spin, Button, Typography } from 'antd';
import {
  FileWordOutlined,
  CloudDownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import mammoth from 'mammoth';
import axios from '../../config/axios';

const { Text } = Typography;

interface FilePreviewProps {
  resumeId: string;
  fileUrl?: string;
  fileType?: string;
  originalFilename?: string;
}

/** Resolve preview type, falling back to filename extension */
const resolveType = (fileType?: string, filename?: string): string => {
  const t = (fileType || '').toLowerCase();
  if (t) return t;
  const ext = filename?.includes('.')
    ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
    : '';
  return ext;
};

/**
 * Unified resume file preview.
 * - PDF: native browser preview via iframe
 * - DOCX: converted to HTML in-browser via mammoth and rendered
 * - DOC (legacy): not previewable — shows a download hint
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  resumeId,
  fileUrl,
  fileType,
  originalFilename,
}) => {
  const { t } = useTranslation();
  const type = useMemo(
    () => resolveType(fileType, originalFilename),
    [fileType, originalFilename]
  );

  const [docxHtml, setDocxHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (type !== 'docx') return;

    let cancelled = false;
    const convert = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get<ArrayBuffer>(
          `/resumes/${resumeId}/file`,
          { responseType: 'arraybuffer' }
        );
        const result = await mammoth.convertToHtml({
          arrayBuffer: response.data,
        });
        if (!cancelled) {
          setDocxHtml(result.value || '');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404 || err?.message
              ? err.message || 'Load failed'
              : 'Load failed'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    convert();
    return () => {
      cancelled = true;
    };
  }, [resumeId, type]);

  const downloadButton = fileUrl ? (
    <Button
      icon={<CloudDownloadOutlined />}
      href={fileUrl}
      target="_blank"
      type="primary"
    >
      {t('common.download', '下载原文')}
    </Button>
  ) : null;

  // Legacy .doc — browsers and mammoth cannot render it
  if (type === 'doc') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <FileWordOutlined style={{ fontSize: 48, color: '#2b579a' }} />
        <Text type="secondary">{t('resume.preview.doc_unavailable')}</Text>
        {downloadButton}
      </div>
    );
  }

  // DOCX — mammoth HTML rendering
  if (type === 'docx') {
    if (loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <Text type="secondary">{t('resume.preview.docx_loading')}</Text>
        </div>
      );
    }
    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <Text type="danger">
            {t('resume.preview.error')}
            {error ? `: ${error}` : ''}
          </Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            {t('common.retry', '重试')}
          </Button>
          {downloadButton}
        </div>
      );
    }
    return (
      <div className="h-full overflow-auto bg-white dark:bg-gray-800">
        <style>{`
          .docx-preview { max-width: 820px; margin: 0 auto; padding: 48px 56px; line-height: 1.7; }
          .docx-preview h1 { font-size: 1.6em; margin: 0.6em 0 0.4em; }
          .docx-preview h2 { font-size: 1.35em; margin: 0.6em 0 0.4em; }
          .docx-preview h3, .docx-preview h4 { font-size: 1.15em; margin: 0.6em 0 0.3em; }
          .docx-preview p { margin: 0.4em 0; }
          .docx-preview table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
          .docx-preview td, .docx-preview th { border: 1px solid #d9d9d9; padding: 6px 10px; }
          .docx-preview ul, .docx-preview ol { padding-left: 1.6em; margin: 0.4em 0; }
        `}</style>
        <div
          className="docx-preview"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      </div>
    );
  }

  // PDF & others — native iframe preview
  if (fileUrl) {
    return (
      <iframe
        src={fileUrl}
        className="w-full h-full border-none"
        title="Resume Preview"
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <Text type="secondary" className="!text-gray-500">
        {t('resume.preview_unavailable', '预览不可用')}
      </Text>
    </div>
  );
};
