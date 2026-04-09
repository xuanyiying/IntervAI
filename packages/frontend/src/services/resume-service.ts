import { ParsedResumeData, Resume } from '@/types';
import { PARSE_TIMEOUT_MS } from '../config/app';
import axios from '../config/axios';
import { upload } from './upload-service';

/**
 * Service for handling resume-related operations
 */
export const resumeService = {
  /**
   * Upload a new resume file
   * @param file - The resume file (PDF, DOCX, etc.)
   * @param title - Optional title for the resume
   * @param onUploadProgress - Optional callback for upload progress
   * @returns The uploaded resume details
   */
  uploadResume: async (
    file: File,
    title?: string,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const response = await upload<{
      resume: Resume;
      isDuplicate: boolean;
    }>('/resumes/upload', formData, {
      onUploadProgress,
    });
    return response.resume;
  },

  /**
   * Parse an uploaded resume to extract structured data
   * @param resumeId - The ID of the resume to parse
   * @param conversationId - Optional conversation ID to send optimization results to
   * @returns The parsed resume data
   */
  parseResume: async (
    resumeId: string,
    conversationId?: string
  ): Promise<ParsedResumeData> => {
    const params = conversationId ? { conversationId } : {};
    // Use extended timeout for parsing since AI processing can take time.
    // Frontend polling handles the case where this still times out.
    const response = await axios.get<ParsedResumeData>(
      `/resumes/${resumeId}/parse`,
      { params, timeout: PARSE_TIMEOUT_MS }
    );
    return response.data;
  },

  /**
   * Get all resumes for the current user
   * @returns List of resumes
   */
  getResumes: async (): Promise<Resume[]> => {
    const response = await axios.get<Resume[]>('/resumes');
    return response.data;
  },

  /**
   * Get details of a specific resume
   * @param resumeId - The ID of the resume
   * @returns Resume details
   */
  getResume: async (resumeId: string): Promise<Resume> => {
    const response = await axios.get<Resume>(`/resumes/${resumeId}`);
    return response.data;
  },

  /**
   * Update resume metadata or content
   * @param resumeId - The ID of the resume
   * @param data - The update data
   * @returns Updated resume details
   */
  updateResume: async (
    resumeId: string,
    data: Partial<Resume>
  ): Promise<Resume> => {
    const response = await axios.put<Resume>(`/resumes/${resumeId}`, data);
    return response.data;
  },

  /**
   * Delete a resume
   * @param resumeId - The ID of the resume to delete
   */
  deleteResume: async (resumeId: string): Promise<void> => {
    await axios.delete(`/resumes/${resumeId}`);
  },

  /**
   * Set a resume as the primary one for the user
   * @param resumeId - The ID of the resume
   * @returns Updated resume details
   */
  setPrimaryResume: async (resumeId: string): Promise<Resume> => {
    const response = await axios.put<Resume>(`/resumes/${resumeId}/primary`);
    return response.data;
  },

  /**
   * Analyze a resume (with polling for processing status)
   * @param resumeId - The ID of the resume to analyze
   * @param maxRetries - Maximum number of polling retries (default 12)
   * @param interval - Polling interval in ms (default 5000)
   * @returns The analysis result
   */
  analyzeResume: async (
    resumeId: string,
    maxRetries: number = 12,
    interval: number = 5000
  ): Promise<any> => {
    const poll = async (retriesLeft: number): Promise<any> => {
      const response = await axios.get<any>(`/resumes/${resumeId}/analyze`, {
        timeout: PARSE_TIMEOUT_MS,
      });
      const data = response.data;

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error(data.message || 'Analysis failed');
      }

      // status === 'processing' — poll again
      if (data.status === 'processing' && retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        return poll(retriesLeft - 1);
      }

      // No status field or unknown status — treat as direct result
      if (!data.status) {
        return data;
      }

      // Exhausted retries
      throw new Error('Analysis timed out. Please try again later.');
    };

    return poll(maxRetries);
  },
};
