import axios from '../config/axios';
import { Optimization } from '@/types';

export interface SuggestionResult {
  status: string;
  suggestion: any;
}

export interface BatchResult {
  accepted?: number;
  rejected?: number;
  total: number;
}

export interface ApplyResult {
  version: number;
  appliedCount: number;
  parsedData: any;
}

export interface VersionInfo {
  id: string;
  resumeId: string;
  version: number;
  label: string;
  createdAt: string;
}

export const optimizationService = {
  createOptimization: async (
    resumeId: string,
    jobId?: string
  ): Promise<Optimization> => {
    const response = await axios.post<Optimization>('/optimizations', {
      resumeId,
      ...(jobId ? { jobId } : {}),
    });
    return response.data;
  },

  triggerOptimization: async (
    resumeId: string,
    jobId?: string
  ): Promise<Optimization> => {
    const response = await axios.post<Optimization>(
      `/optimizations/resume/${resumeId}/optimize`,
      jobId ? { jobId } : {}
    );
    return response.data;
  },

  getOptimization: async (optimizationId: string): Promise<Optimization> => {
    const response = await axios.get<Optimization>(
      `/optimizations/${optimizationId}`
    );
    return response.data;
  },

  listOptimizations: async (): Promise<Optimization[]> => {
    const response = await axios.get<Optimization[]>('/optimizations');
    return response.data;
  },

  listResumeOptimizations: async (
    resumeId: string
  ): Promise<Optimization[]> => {
    const response = await axios.get<Optimization[]>(
      `/optimizations/resume/${resumeId}/list`
    );
    return response.data;
  },

  acceptSuggestion: async (
    optimizationId: string,
    suggestionId: string
  ): Promise<SuggestionResult> => {
    const response = await axios.patch<SuggestionResult>(
      `/optimizations/${optimizationId}/suggestions/${suggestionId}/accept`
    );
    return response.data;
  },

  rejectSuggestion: async (
    optimizationId: string,
    suggestionId: string
  ): Promise<SuggestionResult> => {
    const response = await axios.patch<SuggestionResult>(
      `/optimizations/${optimizationId}/suggestions/${suggestionId}/reject`
    );
    return response.data;
  },

  acceptAllSuggestions: async (
    optimizationId: string
  ): Promise<BatchResult> => {
    const response = await axios.post<BatchResult>(
      `/optimizations/${optimizationId}/accept-all`
    );
    return response.data;
  },

  rejectAllSuggestions: async (
    optimizationId: string
  ): Promise<BatchResult> => {
    const response = await axios.post<BatchResult>(
      `/optimizations/${optimizationId}/reject-all`
    );
    return response.data;
  },

  applyChanges: async (optimizationId: string): Promise<ApplyResult> => {
    const response = await axios.post<ApplyResult>(
      `/optimizations/${optimizationId}/apply`
    );
    return response.data;
  },

  getVersions: async (resumeId: string): Promise<VersionInfo[]> => {
    const response = await axios.get<VersionInfo[]>(
      `/optimizations/resume/${resumeId}/versions`
    );
    return response.data;
  },

  restoreVersion: async (
    resumeId: string,
    versionId: string
  ): Promise<{ restoredTo: number; label: string }> => {
    const response = await axios.post<{ restoredTo: number; label: string }>(
      `/optimizations/resume/${resumeId}/versions/${versionId}/restore`
    );
    return response.data;
  },
};
