import { create } from 'zustand';
import { Resume } from '@/shared/types';
import { resumeService } from '@/features/resume/api/resume-service';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  setResumes: (resumes: Resume[]) => void;
  setCurrentResume: (resume: Resume | null) => void;
  addResume: (resume: Resume) => void;
  updateResume: (id: string, data: Partial<Resume>) => void;
  removeResume: (id: string) => void;
  fetchResumes: () => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  isLoading: false,
  setResumes: (resumes) => set({ resumes }),
  setCurrentResume: (resume) => set({ currentResume: resume }),
  addResume: (resume) =>
    set((state) => ({ resumes: [resume, ...state.resumes] })),
  updateResume: (id, data) =>
    set((state) => ({
      resumes: state.resumes.map((r) => (r.id === id ? { ...r, ...data } : r)),
      currentResume:
        state.currentResume?.id === id
          ? { ...state.currentResume, ...data }
          : state.currentResume,
    })),
  removeResume: (id) =>
    set((state) => ({
      resumes: state.resumes.filter((r) => r.id !== id),
      currentResume:
        state.currentResume?.id === id ? null : state.currentResume,
    })),
  fetchResumes: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const resumes = await resumeService.getResumes();
      set({ resumes });
      // Refresh the selected resume with fresh data (e.g. version bumped by
      // an applied optimization); fall back to primary when nothing selected
      const selected = get().currentResume;
      if (selected) {
        const fresh = resumes.find((r) => r.id === selected.id);
        if (fresh) {
          set({ currentResume: fresh });
        }
      } else {
        const primary = resumes.find((r) => r.isPrimary);
        if (primary) {
          set({ currentResume: primary });
        }
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  setPrimary: async (id) => {
    try {
      const updated = await resumeService.setPrimaryResume(id);
      set((state) => ({
        resumes: state.resumes.map((r) => ({
          ...r,
          isPrimary: r.id === id,
        })),
        currentResume:
          state.currentResume?.id === id ? updated : state.currentResume,
      }));
    } catch (error) {
      console.error('Failed to set primary resume:', error);
    }
  },
}));
