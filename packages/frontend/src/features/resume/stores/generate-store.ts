import { create } from 'zustand';
import type {
  Template,
  PDFOptions,
  GeneratedPDF,
} from '@/features/resume/types';

interface GenerateState {
  templates: Template[];
  selectedTemplate: Template | null;
  pdfOptions: PDFOptions;
  generatedPDF: GeneratedPDF | null;
  loading: boolean;
  previewUrl: string | null;

  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setPDFOptions: (options: Partial<PDFOptions>) => void;
  setGeneratedPDF: (pdf: GeneratedPDF | null) => void;
  setLoading: (loading: boolean) => void;
  setPreviewUrl: (url: string | null) => void;
}

const defaultPDFOptions: PDFOptions = {
  fontSize: 11,
  colorTheme: 'professional',
  includePhoto: false,
  margin: 'normal',
  visibleSections: [
    'personalInfo',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
  ],
};

export const useGenerateStore = create<GenerateState>((set) => ({
  templates: [],
  selectedTemplate: null,
  pdfOptions: defaultPDFOptions,
  generatedPDF: null,
  loading: false,
  previewUrl: null,

  setTemplates: (templates) => set({ templates }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setPDFOptions: (options) =>
    set((state) => ({
      pdfOptions: { ...state.pdfOptions, ...options },
    })),
  setGeneratedPDF: (pdf) => set({ generatedPDF: pdf }),
  setLoading: (loading) => set({ loading }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
}));
