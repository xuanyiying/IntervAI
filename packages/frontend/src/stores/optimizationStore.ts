import {
  BatchResult,
  optimizationService,
  SuggestionResult,
} from '@/services/optimization-service';
import {
  Optimization,
  OptimizationVersion,
  Suggestion,
  SuggestionStatus,
  SuggestionType,
} from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OptimizationState {
  currentOptimization: Optimization | null;
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  versions: Array<{
    id: string;
    version: number;
    label: string;
    createdAt: string;
  }>;
  history: OptimizationVersion[];

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOptimization: (optimization: Optimization) => void;
  setSuggestions: (suggestions: Suggestion[]) => void;

  fetchOptimization: (optimizationId: string) => Promise<void>;
  triggerOptimization: (
    resumeId: string,
    jobId?: string
  ) => Promise<Optimization>;
  acceptSuggestion: (
    optimizationId: string,
    suggestionId: string
  ) => Promise<SuggestionResult>;
  rejectSuggestion: (
    optimizationId: string,
    suggestionId: string
  ) => Promise<SuggestionResult>;
  acceptAllSuggestions: (optimizationId: string) => Promise<BatchResult>;
  rejectAllSuggestions: (optimizationId: string) => Promise<BatchResult>;
  applyChanges: (optimizationId: string) => Promise<any>;

  updateLocalSuggestionStatus: (
    suggestionId: string,
    status: SuggestionStatus
  ) => void;

  getPendingCount: () => number;
  getAcceptedCount: () => number;
  getRejectedCount: () => number;
  getSuggestionsBySection: (section: string) => Suggestion[];
  getSuggestionsByType: (type: SuggestionType) => Suggestion[];

  addVersion: (version: OptimizationVersion) => void;
  removeVersion: (id: string) => void;
  getHistoryByResumeId: (resumeId: string) => OptimizationVersion[];

  reset: () => void;
}

const initialState = {
  currentOptimization: null as Optimization | null,
  suggestions: [] as Suggestion[],
  loading: false,
  error: null as string | null,
  versions: [] as Array<{
    id: string;
    version: number;
    label: string;
    createdAt: string;
  }>,
  history: [] as OptimizationVersion[],
};

export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setOptimization: (optimization) =>
        set({
          currentOptimization: optimization,
          suggestions: (optimization.suggestions || []) as Suggestion[],
        }),
      setSuggestions: (suggestions) => set({ suggestions }),

      fetchOptimization: async (optimizationId: string) => {
        try {
          set({ loading: true, error: null });
          const optimization =
            await optimizationService.getOptimization(optimizationId);
          set({
            currentOptimization: optimization,
            suggestions: (optimization.suggestions || []) as Suggestion[],
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch optimization',
            loading: false,
          });
        }
      },

      triggerOptimization: async (resumeId: string, jobId?: string) => {
        try {
          set({ loading: true, error: null });
          const optimization = await optimizationService.triggerOptimization(
            resumeId,
            jobId
          );
          set({
            currentOptimization: optimization,
            suggestions: (optimization.suggestions || []) as Suggestion[],
            loading: false,
          });
          return optimization;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to trigger optimization',
            loading: false,
          });
          throw error;
        }
      },

      acceptSuggestion: async (
        optimizationId: string,
        suggestionId: string
      ) => {
        try {
          const result = await optimizationService.acceptSuggestion(
            optimizationId,
            suggestionId
          );
          get().updateLocalSuggestionStatus(
            suggestionId,
            SuggestionStatus.ACCEPTED
          );
          return result;
        } catch (error: any) {
          throw error;
        }
      },

      rejectSuggestion: async (
        optimizationId: string,
        suggestionId: string
      ) => {
        try {
          const result = await optimizationService.rejectSuggestion(
            optimizationId,
            suggestionId
          );
          get().updateLocalSuggestionStatus(
            suggestionId,
            SuggestionStatus.REJECTED
          );
          return result;
        } catch (error: any) {
          throw error;
        }
      },

      acceptAllSuggestions: async (optimizationId: string) => {
        try {
          set({ loading: true });
          const result =
            await optimizationService.acceptAllSuggestions(optimizationId);

          const updated = get().suggestions.map((s) => ({
            ...s,
            status:
              s.status === SuggestionStatus.PENDING
                ? SuggestionStatus.ACCEPTED
                : s.status,
          }));
          set({ suggestions: updated, loading: false });
          return result;
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      rejectAllSuggestions: async (optimizationId: string) => {
        try {
          set({ loading: true });
          const result =
            await optimizationService.rejectAllSuggestions(optimizationId);

          const updated = get().suggestions.map((s) => ({
            ...s,
            status:
              s.status === SuggestionStatus.PENDING
                ? SuggestionStatus.REJECTED
                : s.status,
          }));
          set({ suggestions: updated, loading: false });
          return result;
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      applyChanges: async (optimizationId: string) => {
        try {
          set({ loading: true });
          const result = await optimizationService.applyChanges(optimizationId);
          set({ loading: false });
          return result;
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      updateLocalSuggestionStatus: (
        suggestionId: string,
        status: SuggestionStatus
      ) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, status } : s
          ),
        }));
      },

      getPendingCount: () =>
        get().suggestions.filter((s) => s.status === SuggestionStatus.PENDING)
          .length,

      getAcceptedCount: () =>
        get().suggestions.filter((s) => s.status === SuggestionStatus.ACCEPTED)
          .length,

      getRejectedCount: () =>
        get().suggestions.filter((s) => s.status === SuggestionStatus.REJECTED)
          .length,

      getSuggestionsBySection: (section: string) =>
        get().suggestions.filter((s) => s.section === section),

      getSuggestionsByType: (type: SuggestionType) =>
        get().suggestions.filter((s) => s.type === type),

      addVersion: (version: OptimizationVersion) =>
        set((state) => ({ history: [version, ...state.history] })),
      removeVersion: (id: string) =>
        set((state) => ({
          history: state.history.filter((v) => v.id !== id),
        })),
      getHistoryByResumeId: (resumeId: string) =>
        get().history.filter((v) => v.resumeId === resumeId),

      reset: () => set(initialState),
    }),
    {
      name: 'optimization-diff-storage',
      partialize: (state) => ({
        currentOptimization: state.currentOptimization,
        suggestions: state.suggestions,
      }),
    }
  )
);
