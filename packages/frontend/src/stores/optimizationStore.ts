import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OptimizationVersion } from '@/types';

interface OptimizationState {
  history: OptimizationVersion[];
  addVersion: (version: OptimizationVersion) => void;
  removeVersion: (id: string) => void;
  getHistoryByResumeId: (resumeId: string) => OptimizationVersion[];
  clearHistory: () => void;
}

export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set, get) => ({
      history: [],
      addVersion: (version) =>
        set((state) => ({ history: [version, ...state.history] })),
      removeVersion: (id) =>
        set((state) => ({ history: state.history.filter((v) => v.id !== id) })),
      getHistoryByResumeId: (resumeId) =>
        get().history.filter((v) => v.resumeId === resumeId),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'optimization-storage',
    }
  )
);
