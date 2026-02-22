import { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '../stores';
import { resumeService } from '../services/resume-service';
import { optimizationService } from '../services/optimization-service';
import {
  MAX_FILE_SIZE_MB,
  RESUME_ALLOWED_TYPES,
  resolveUploadFile,
  validateFile,
} from '../services/upload-service';
import { Resume, Optimization, ParseStatus } from '../types';

export const useResumePage = () => {
  const { t } = useTranslation();
  const {
    resumes,
    fetchResumes,
    setPrimary,
    currentResume,
    setCurrentResume,
    addResume,
    removeResume,
  } = useResumeStore();

  const [state, setState] = useState({
    previewVisible: false,
    uploading: false,
    optimizationVisible: false,
    historyVisible: false,
    analysisVisible: false,
  });

  const [data, setData] = useState({
    selectedPreviewResume: null as Resume | null,
    optimizations: [] as Optimization[],
    selectedOptimizationId: undefined as string | undefined,
    selectedAnalysisResumeId: null as string | null,
  });

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    const hasProcessing = resumes.some(
      (r) => r.parseStatus === ParseStatus.PROCESSING
    );

    if (hasProcessing) {
      const pollInterval = setInterval(() => {
        fetchResumes();
      }, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [fetchResumes, resumes]);

  useEffect(() => {
    if (currentResume) {
      fetchOptimizations(currentResume.id);
    }
  }, [currentResume]);

  const fetchOptimizations = async (resumeId: string) => {
    try {
      const all = await optimizationService.listOptimizations();
      const filtered = all.filter((opt) => opt.resumeId === resumeId);
      setData((prev) => ({
        ...prev,
        optimizations: filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    }
  };

  const handleUpload = async (file: File | UploadFile) => {
    const resolvedFile = resolveUploadFile(file);
    if (!resolvedFile) {
      message.error(t('resume.upload_failed', '上传失败'));
      return;
    }
    const validation = validateFile(resolvedFile, {
      allowedTypes: RESUME_ALLOWED_TYPES,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
    if (!validation.valid) {
      message.error(
        validation.error === 'type'
          ? t('resume.upload_type_error', '只能上传 PDF 或 Word 文档！')
          : t('resume.upload_size_error', '文件大小不能超过 10MB！')
      );
      return;
    }

    try {
      setState((prev) => ({ ...prev, uploading: true }));
      const newResume = await resumeService.uploadResume(resolvedFile);
      addResume(newResume);
      setCurrentResume(newResume);
      message.success(t('resume.upload_success', '简历上传成功，开始解析...'));
      resumeService.parseResume(newResume.id).then(fetchResumes);
    } catch (error) {
      message.error(t('resume.upload_failed', '上传失败'));
    } finally {
      setState((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resumeService.deleteResume(id);
      removeResume(id);
      message.success(t('resume.delete_success', '简历已删除'));
    } catch (error) {
      message.error(t('resume.delete_failed', '删除失败'));
    }
  };

  const handleDeleteWithConfirm = (id: string, title: string) => {
    Modal.confirm({
      title: t('resume.delete_confirm_title', '确定要删除这份简历吗？'),
      content: `${t('resume.delete_confirm_content', '删除后将无法找回：')}${title}`,
      okText: t('common.delete', '删除'),
      okType: 'danger',
      cancelText: t('common.cancel', '取消'),
      onOk: () => handleDelete(id),
    });
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimary(id);
      message.success(t('resume.set_primary_success', '已设置为当前活跃简历'));
    } catch (error) {
      message.error(t('resume.set_primary_failed', '设置失败'));
    }
  };

  return {
    t,
    resumes,
    currentResume,
    setCurrentResume,
    state,
    setState,
    data,
    setData,
    fetchResumes,
    handleUpload,
    handleDelete,
    handleDeleteWithConfirm,
    handleSetPrimary,
    fetchOptimizations,
  };
};
