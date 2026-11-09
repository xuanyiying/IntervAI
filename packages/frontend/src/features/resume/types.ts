export interface ResumeSection {
  id: string;
  type:
    'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'custom';
  title: string;
  content: string;
}

export interface ResumeTheme {
  id: string;
  name: string;
  primary: string;
  background: string;
  text: string;
  accent: string;
  fontFamily: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  previewUrl: string;
  isPremium: boolean;
  isActive: boolean;
}

export interface PDFOptions {
  fontSize: number;
  colorTheme: string;
  includePhoto: boolean;
  margin: 'normal' | 'compact' | 'wide';
  visibleSections: string[];
}

export interface GeneratedPDF {
  id: string;
  userId: string;
  optimizationId: string;
  templateId: string;
  fileUrl: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  expiresAt?: string;
}
