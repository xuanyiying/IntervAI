import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { MessageItem, AttachmentStatus, Job } from '../../../types';
import StreamingMarkdownBubble from '../../../components/StreamingMarkdownBubble';
import AttachmentMessage from '../../../components/AttachmentMessage';
import JobInfoCard from '../../../components/JobInfoCard';
import SuggestionsList from '../../../components/SuggestionsList';
import PDFGenerationCard from '../../../components/PDFGenerationCard';
import MarkdownPDFCard from '../../../components/MarkdownPDFCard';
import InterviewQuestionsCard from '../../../components/InterviewQuestionsCard';

interface MessageContentProps {
  item: MessageItem;
  isStreaming?: boolean;
  onDeleteAttachment?: (key: string) => void;
  onRetryAttachment?: (key: string) => void;
  onOpenComparison?: () => void;
  onDownloadOptimized?: () => void;
  onConfirmJob?: () => void;
  onEditJob?: (job: Job) => void;
  onDeleteJob?: (jobId: string) => void;
  onAcceptSuggestion?: (suggestionId: string, optimizationId?: string) => void;
  onRejectSuggestion?: (suggestionId: string, optimizationId?: string) => void;
  onAcceptAllSuggestions?: (optimizationId?: string) => void;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  item,
  isStreaming,
  onDeleteAttachment,
  onRetryAttachment,
  onOpenComparison,
  onDownloadOptimized,
  onConfirmJob,
  onEditJob,
  onDeleteJob,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAcceptAllSuggestions,
}) => {
  return (
    <div className="markdown-content">
      {item.key === 'streaming-optimization' ? (
        <StreamingMarkdownBubble content={item.content} isStreaming={!!isStreaming} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
      )}

      {item.type === 'attachment' && item.attachmentStatus && (
        <AttachmentMessage
          status={item.attachmentStatus}
          onDelete={() => onDeleteAttachment?.(item.key)}
          onRetry={item.attachmentStatus.status === 'error' ? () => onRetryAttachment?.(item.key) : undefined}
        />
      )}

      {item.type === 'optimization_result' && (
        <div className="mt-4 flex gap-2">
          <Button type="primary" icon={<FileTextOutlined />} onClick={onOpenComparison}>
            查看对比
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onDownloadOptimized}>
            下载简历
          </Button>
        </div>
      )}

      {item.type === 'job' && item.jobData && (
        <div className="mt-4">
          <JobInfoCard
            job={item.jobData}
            onConfirm={onConfirmJob}
            onEdit={onEditJob}
            onDelete={onDeleteJob}
          />
        </div>
      )}

      {item.type === 'suggestions' && item.suggestions && (
        <div className="mt-4">
          <SuggestionsList
            suggestions={item.suggestions}
            onAccept={(sId) => onAcceptSuggestion?.(sId, item.optimizationId)}
            onReject={(sId) => onRejectSuggestion?.(sId, item.optimizationId)}
            onAcceptAll={() => onAcceptAllSuggestions?.(item.optimizationId)}
          />
        </div>
      )}

      {item.type === 'pdf' && item.optimizationId && (
        <div className="mt-4">
          <PDFGenerationCard optimizationId={item.optimizationId} />
        </div>
      )}

      {item.type === 'markdown-pdf' && item.optimizedMarkdown && (
        <div className="mt-4">
          <MarkdownPDFCard markdown={item.optimizedMarkdown} />
        </div>
      )}

      {item.type === 'interview' && item.interviewQuestions && (
        <div className="mt-4">
          <InterviewQuestionsCard
            questions={item.interviewQuestions}
            optimizationId={item.optimizationId || 'default'}
          />
        </div>
      )}
    </div>
  );
};
