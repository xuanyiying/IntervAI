import { ResumeSection, ResumeTheme } from './types';

export const THEMES: ResumeTheme[] = [
  {
    id: 'modern',
    name: 'Modern Dark',
    primary: '#ffffff',
    background: '#050505',
    text: '#ffffff',
    accent: '#3b82f6',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  {
    id: 'minimal',
    name: 'Minimal Light',
    primary: '#000000',
    background: '#ffffff',
    text: '#000000',
    accent: '#6b7280',
    fontFamily: 'Georgia, serif',
  },
  {
    id: 'emerald',
    name: 'Emerald Professional',
    primary: '#10b981',
    background: '#064e3b',
    text: '#ecfdf5',
    accent: '#34d399',
    fontFamily: 'system-ui, sans-serif',
  },
  {
    id: 'royal',
    name: 'Royal Serif',
    primary: '#d4af37',
    background: '#1c1917',
    text: '#fafaf9',
    accent: '#a8a29e',
    fontFamily: 'Playfair Display, serif',
  },
];

export const DEFAULT_SECTIONS: ResumeSection[] = [
  {
    id: 'personal-1',
    type: 'personal',
    title: 'Personal Information',
    content:
      '# John Doe\n\nFull Stack Developer | AI Enthusiast\n\n📧 john@example.com | 📱 +1 (555) 000-0000 | 📍 San Francisco, CA\n\n[LinkedIn](https://linkedin.com) | [GitHub](https://github.com)',
  },
  {
    id: 'experience-1',
    type: 'experience',
    title: 'Experience',
    content:
      '## Senior Developer @ TechCorp\n*2021 - Present*\n\n- Led development of a high-performance AI platform\n- Improved system throughput by 40% using optimized vector search\n- Managed a team of 5 developers',
  },
  {
    id: 'skills-1',
    type: 'skills',
    title: 'Skills',
    content:
      '## Technical Skills\n\n- **Languages:** TypeScript, Python, Rust, Go\n- **Frontend:** React, Next.js, Framer Motion, Tailwind CSS\n- **Backend:** Node.js, NestJS, PostgreSQL, Redis\n- **AI/ML:** LangChain, PyTorch, Vector Databases',
  },
];
