import React, { useState } from 'react';
import { Card, Button, Space, message, Tag } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { generateService } from '../services/generate-service';

interface MarkdownPDFCardProps {
  markdown: string;
  onGenerateSuccess?: () => void;
}

/**
 * PDF下载卡片组件
 * 用于从Markdown内容生成并下载PDF
 */
const MarkdownPDFCard: React.FC<MarkdownPDFCardProps> = ({
  markdown,
  onGenerateSuccess,
}) => {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState<{
    fileId: string;
    filePath: string;
    expiresAt: string;
    downloadUrl: string;
  } | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      message.loading({ content: '正在生成 PDF...', key: 'pdf-gen' });

      const result = await generateService.generatePDFFromMarkdown(markdown, {
        fontSize: 12,
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
      });

      setGeneratedPDF(result);
      message.success({ content: 'PDF 生成成功！', key: 'pdf-gen' });

      if (onGenerateSuccess) {
        onGenerateSuccess();
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      message.error({ content: '生成 PDF 失败', key: 'pdf-gen' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedPDF) return;

    try {
      setDownloading(true);
      await generateService.downloadPDF(
        generatedPDF.downloadUrl,
        `resume-optimized-${Date.now()}.pdf`
      );
      message.success('PDF 下载成功！');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      message.error('下载 PDF 失败');
    } finally {
      setDownloading(false);
    }
  };

  const isExpired = generatedPDF
    ? dayjs().isAfter(dayjs(generatedPDF.expiresAt))
    : false;

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        borderRadius: '8px',
        border: 'none',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileTextOutlined style={{ fontSize: '24px' }} />
          <div>
            <h3 style={{ margin: 0, color: '#fff' }}>📄 生成专业 PDF 简历</h3>
            <p
              style={{
                margin: '4px 0 0 0',
                opacity: 0.9,
                fontSize: '12px',
              }}
            >
              将优化后的简历导出为 PDF 格式
            </p>
          </div>
        </div>

        {generatedPDF && (
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '12px',
              borderRadius: '6px',
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  有效期至 (24h)
                </span>
                <span style={{ fontSize: '12px' }}>
                  {dayjs(generatedPDF.expiresAt).format('MM-DD HH:mm')}
                </span>
              </div>
              {isExpired && (
                <Tag color="error" style={{ margin: 0 }}>
                  链接已过期，请重新生成
                </Tag>
              )}
            </Space>
          </div>
        )}

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          {!generatedPDF && (
            <Button
              icon={generating ? <LoadingOutlined /> : <FileTextOutlined />}
              onClick={handleGenerate}
              loading={generating}
              style={{
                background: '#fff',
                color: '#667eea',
                border: 'none',
              }}
            >
              生成 PDF
            </Button>
          )}

          {generatedPDF && (
            <>
              <Button
                icon={<FileTextOutlined />}
                onClick={handleGenerate}
                loading={generating}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                重新生成
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={downloading}
                disabled={isExpired}
                onClick={handleDownload}
                style={{
                  background: '#fff',
                  color: '#667eea',
                  border: 'none',
                }}
              >
                下载 PDF
              </Button>
            </>
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default MarkdownPDFCard;
