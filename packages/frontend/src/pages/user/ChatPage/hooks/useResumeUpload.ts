import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { resumeService } from '../../../../services/resume-service';
import {
  MAX_FILE_SIZE_MB,
  RESUME_ALLOWED_TYPES,
  resolveUploadFile,
  validateFile,
} from '../../../../services/upload-service';
import { UPLOAD_TIMEOUT_MS, PARSE_TIMEOUT_MS } from '../../../../config/app';
import {
  MessageRole,
  type MessageItem,
  type AttachmentStatus,
  type Resume,
  type ParsedResumeData,
} from '../../../../types';

interface UseResumeUploadProps {
  currentConversationId?: string;
  onResumeParsed?: (
    resumeId: string,
    markdown: string,
    conversationId?: string
  ) => void;
}

export const useResumeUpload = ({
  currentConversationId,
  onResumeParsed,
}: UseResumeUploadProps) => {
  const [uploadItems, setUploadItems] = useState<MessageItem[]>([]);
  const [failedFiles, setFailedFiles] = useState<Map<string, File>>(new Map());

  const updateAttachmentStatus = useCallback(
    (
      key: string,
      update: Partial<AttachmentStatus>,
      mode?: 'upload' | 'parse'
    ) => {
      setUploadItems((prev) =>
        prev.map((item) => {
          if (
            item.type === 'attachment' &&
            (item.key === key ||
              item.attachmentStatus?.fileName === key ||
              item.attachmentStatus?.resumeId === key) &&
            (!mode || item.attachmentStatus?.mode === mode)
          ) {
            return {
              ...item,
              attachmentStatus: {
                ...item.attachmentStatus,
                ...update,
              } as AttachmentStatus,
            };
          }
          return item;
        })
      );
    },
    []
  );

  const handleResumeUpload = useCallback(
    async (
      file: File | UploadFile,
      retryMessageId?: string,
      overrideConversationId?: string
    ) => {
      const targetConversationId =
        overrideConversationId || currentConversationId;

      if (!targetConversationId) {
        message.warning('请等待会话初始化完成');
        return;
      }

      const messageId = retryMessageId || `msg-upload-${Date.now()}`;

      const resolvedFile = resolveUploadFile(file);
      if (!resolvedFile) {
        message.error('上传失败');
        return;
      }
      const validation = validateFile(resolvedFile, {
        allowedTypes: RESUME_ALLOWED_TYPES,
        maxSizeMB: MAX_FILE_SIZE_MB,
      });
      if (!validation.valid) {
        message.error(
          validation.error === 'type'
            ? '只能上传 PDF 或 Word 文档！'
            : '文件大小不能超过 10MB！'
        );
        return;
      }

      // Store file for potential retry
      setFailedFiles((prev) => {
        const next = new Map(prev);
        next.set(messageId, resolvedFile);
        return next;
      });

      if (!retryMessageId) {
        const initialStatus: AttachmentStatus = {
          fileName: resolvedFile.name,
          fileSize: resolvedFile.size,
          uploadProgress: 0,
          parseProgress: 0,
          status: 'uploading',
          mode: 'upload',
        };

        setUploadItems((prev) => [
          ...prev,
          {
            key: messageId,
            role: MessageRole.USER,
            content: `上传简历: ${resolvedFile.name}`,
            type: 'attachment',
            attachmentStatus: initialStatus,
          },
        ]);
      } else {
        updateAttachmentStatus(
          messageId,
          { status: 'uploading', uploadProgress: 0, error: undefined },
          'upload'
        );
      }

      try {
        // Step 1: Upload
        const uploadPromise = resumeService.uploadResume(
          resolvedFile,
          undefined,
          (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateAttachmentStatus(
                messageId,
                { uploadProgress: Math.min(percentCompleted, 99) },
                'upload'
              );
            }
          }
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('上传超时，请检查网络连接')),
            UPLOAD_TIMEOUT_MS
          )
        );

        const resume = (await Promise.race([
          uploadPromise,
          timeoutPromise,
        ])) as Resume;

        updateAttachmentStatus(
          messageId,
          { uploadProgress: 100, status: 'completed', resumeId: resume.id },
          'upload'
        );

        // Step 2: Parsing
        const parsingMessageId = `msg-ai-parsing-${resume.id}`;
        const parsingStatus: AttachmentStatus = {
          fileName: resolvedFile.name,
          fileSize: resolvedFile.size,
          uploadProgress: 100,
          parseProgress: 0,
          status: 'parsing',
          mode: 'parse',
          resumeId: resume.id,
        };

        setUploadItems((prev) => {
          // Check if parsing message already exists
          if (prev.some((item) => item.key === parsingMessageId)) {
            return prev.map((item) =>
              item.key === parsingMessageId
                ? {
                    ...item,
                    attachmentStatus: {
                      ...item.attachmentStatus,
                      status: 'parsing',
                      parseProgress: 0,
                      error: undefined,
                    } as AttachmentStatus,
                  }
                : item
            );
          }
          return [
            ...prev,
            {
              key: parsingMessageId,
              role: MessageRole.ASSISTANT,
              content: '正在解析简历，请稍候...',
              type: 'attachment',
              attachmentStatus: parsingStatus,
            },
          ];
        });

        setFailedFiles((prev) => {
          const next = new Map(prev);
          next.set(parsingMessageId, resolvedFile);
          return next;
        });

        const parsePromise = resumeService.parseResume(
          resume.id,
          targetConversationId
        );
        const parseTimeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('解析超时，后台正在处理中...')),
            PARSE_TIMEOUT_MS
          )
        );

        try {
          const parsedData = (await Promise.race([
            parsePromise,
            parseTimeoutPromise,
          ])) as ParsedResumeData;

          // Check if backend returned a "still processing" status (timeout on backend side)
          const isStillProcessing =
            parsedData &&
            typeof parsedData === 'object' &&
            'parseStatus' in parsedData &&
            (parsedData as any).parseStatus === 'PROCESSING';

          if (isStillProcessing) {
            // Backend is still processing — enter polling mode instead of showing error
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'processing', parseProgress: 50 },
              'parse'
            );
            message.info('简历解析中，请稍候...');
            pollResumeStatus(resume.id, parsingMessageId, targetConversationId);
          } else {
            // Successfully parsed
            updateAttachmentStatus(
              parsingMessageId,
              { parseProgress: 100, status: 'completed' },
              'parse'
            );

            setFailedFiles((prev) => {
              const next = new Map(prev);
              next.delete(messageId);
              return next;
            });

            // Add success message
            setUploadItems((prev) => [
              ...prev,
              {
                key: `parsing-done-${Date.now()}`,
                role: MessageRole.ASSISTANT,
                content: '简历解析完成，正在为您优化内容...',
                type: 'text',
              },
            ]);

            const resumeMarkdown =
              parsedData?.markdown ||
              parsedData?.extractedText ||
              JSON.stringify(parsedData);
            if (resumeMarkdown && onResumeParsed) {
              onResumeParsed(resume.id, resumeMarkdown, targetConversationId);
            }
          }
        } catch (parseError: any) {
          const isTimeout = parseError.message?.includes('超时');

          if (isTimeout) {
            // Timeout from frontend Promise.race — don't mark as error,
            // backend is still processing, start polling
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'processing', parseProgress: 50 },
              'parse'
            );
            message.info('解析时间较长，后台仍在处理中，请稍候...');
            pollResumeStatus(resume.id, parsingMessageId, targetConversationId);
          } else {
            // Real error
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'error', error: parseError.message || '解析失败' },
              'parse'
            );
            message.error(parseError.message || '解析失败');
          }
        }
      } catch (error: any) {
        updateAttachmentStatus(
          messageId,
          { status: 'error', error: error.message || '上传失败' },
          'upload'
        );
        message.error(error.message || '上传失败');
      }
    },
    [currentConversationId, onResumeParsed, updateAttachmentStatus]
  );

  /**
   * Poll resume status until parsing completes or fails.
   * Called when the initial parse request times out but backend is still processing.
   */
  const pollResumeStatus = useCallback(
    (
      resumeId: string,
      parsingMessageId: string,
      conversationId: string
    ) => {
      const MAX_POLL_ATTEMPTS = 24; // 24 * 5s = 2 minutes max polling
      const POLL_INTERVAL = 5000; // 5 seconds
      let attempts = 0;

      const poll = async () => {
        attempts++;
        try {
          const resume = await resumeService.getResume(resumeId);

          if (resume.parseStatus === 'COMPLETED') {
            updateAttachmentStatus(
              parsingMessageId,
              { parseProgress: 100, status: 'completed' },
              'parse'
            );

            setFailedFiles((prev) => {
              const next = new Map(prev);
              next.delete(resumeId);
              return next;
            });

            // Add success message
            setUploadItems((prev) => [
              ...prev,
              {
                key: `parsing-done-${Date.now()}`,
                role: MessageRole.ASSISTANT,
                content: '简历解析完成！',
                type: 'text',
              },
            ]);

            const resumeMarkdown =
              resume.parsedData?.markdown ||
              resume.parsedData?.extractedText ||
              (resume.parsedData
                ? JSON.stringify(resume.parsedData)
                : '');
            if (resumeMarkdown && onResumeParsed) {
              onResumeParsed(resumeId, resumeMarkdown, conversationId);
            }
            return; // Done polling
          }

          if (resume.parseStatus === 'FAILED') {
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'error', error: '解析失败' },
              'parse'
            );
            message.error('简历解析失败，请重新上传');
            return;
          }

          // Still processing — update progress and continue polling
          const progress = Math.min(50 + attempts * 2, 90);
          updateAttachmentStatus(
            parsingMessageId,
            { parseProgress: progress },
            'parse'
          );

          if (attempts < MAX_POLL_ATTEMPTS) {
            setTimeout(poll, POLL_INTERVAL);
          } else {
            // Max polling attempts reached
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'error', error: '解析超时，请稍后刷新页面查看' },
              'parse'
            );
            message.warning('解析时间过长，请稍后在简历页面查看结果');
          }
        } catch (error) {
          if (attempts < MAX_POLL_ATTEMPTS) {
            setTimeout(poll, POLL_INTERVAL);
          } else {
            updateAttachmentStatus(
              parsingMessageId,
              { status: 'error', error: '查询解析状态失败' },
              'parse'
            );
          }
        }
      };

      // Start first poll after a short delay
      setTimeout(poll, POLL_INTERVAL);
    },
    [onResumeParsed, updateAttachmentStatus]
  );

  const removeUploadItem = useCallback((key: string) => {
    setUploadItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  return {
    uploadItems,
    setUploadItems, // Exposed for external updates (e.g. from WebSocket)
    handleResumeUpload,
    failedFiles,
    removeUploadItem,
    updateAttachmentStatus,
  };
};
