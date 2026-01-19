import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  jobService,
  type JobInput,
  type Job,
} from '../../../services/job-service';
import { useConversationStore } from '../../../stores';
import { MessageRole } from '../../../types';

export const useJobActions = (startOptimization: () => void) => {
  const { t } = useTranslation();
  const { currentConversation, sendMessage, loadMessages } =
    useConversationStore();

  const [jobInputDialogVisible, setJobInputDialogVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isJobActionLoading, setIsJobActionLoading] = useState(false);

  const handleJobCreated = useCallback(
    async (jobData: JobInput) => {
      if (!currentConversation) return;

      try {
        setIsJobActionLoading(true);
        const createdJob = await jobService.createJob(jobData);

        await sendMessage(
          currentConversation.id,
          t('chat.job_extracted_title'),
          MessageRole.ASSISTANT,
          {
            type: 'job',
            jobData: createdJob,
          }
        );

        setJobInputDialogVisible(false);
        message.success(t('chat.job_confirmed'));
      } catch (error) {
        console.error('Failed to create job:', error);
        message.error(t('common.error'));
      } finally {
        setIsJobActionLoading(false);
      }
    },
    [currentConversation, sendMessage, t]
  );

  const handleJobConfirm = useCallback(() => {
    message.success(t('chat.job_confirmed'));
    // We need to know if we can start optimization.
    // This depends on whether we have a resume.
    // The original code checks currentResume OR lastParsedMarkdown.
    // We'll leave the resume check to the startOptimization callback provided by the parent.
    startOptimization();
  }, [t, startOptimization]);

  const handleJobEdit = useCallback((job: Job) => {
    setEditingJob(job);
    setJobInputDialogVisible(true);
  }, []);

  const handleJobUpdated = useCallback(
    async (_updatedJob: Job) => {
      if (currentConversation) {
        try {
          await loadMessages(currentConversation.id);
          setEditingJob(null);
          setJobInputDialogVisible(false);
        } catch (error) {
          console.error('Failed to reload messages after job edit:', error);
        }
      }
    },
    [currentConversation, loadMessages]
  );

  const handleJobDelete = useCallback(
    (_jobId: string) => {
      // In the original code, this filtered localItems.
      // Here we might need to expose a way to filter local items or just reload messages.
      // For simplicity and correctness, if it's a persisted message, reloading is best.
      // If it's a local item, we might need a callback.
      if (currentConversation) {
        loadMessages(currentConversation.id);
      }
    },
    [currentConversation, loadMessages]
  );

  return {
    jobInputDialogVisible,
    setJobInputDialogVisible,
    editingJob,
    setEditingJob,
    isJobActionLoading,
    handleJobCreated,
    handleJobConfirm,
    handleJobEdit,
    handleJobUpdated,
    handleJobDelete,
  };
};
