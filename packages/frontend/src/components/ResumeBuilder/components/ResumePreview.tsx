import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResumeSection } from '../types';

interface ResumePreviewProps {
  sections: ResumeSection[];
  previewMode: 'desktop' | 'tablet' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  sections,
  previewMode,
  setPreviewMode,
}) => {
  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'max-w-4xl';
    }
  };

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col items-center space-y-8"
    >
      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-1.5 rounded-full">
        <button
          onClick={() => setPreviewMode('desktop')}
          className={`p-2 rounded-full transition-all ${previewMode === 'desktop' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
        >
          <Monitor size={18} />
        </button>
        <button
          onClick={() => setPreviewMode('tablet')}
          className={`p-2 rounded-full transition-all ${previewMode === 'tablet' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
        >
          <Tablet size={18} />
        </button>
        <button
          onClick={() => setPreviewMode('mobile')}
          className={`p-2 rounded-full transition-all ${previewMode === 'mobile' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
        >
          <Smartphone size={18} />
        </button>
      </div>

      <div
        className={`w-full transition-all duration-700 ease-in-out ${getPreviewWidth()}`}
      >
        <div
          className="rounded-[3rem] p-16 shadow-[0_40px_100px_rgba(0,0,0,0.4)] min-h-[1100px] prose prose-lg max-w-none selection:bg-blue-100"
          style={{
            backgroundColor: 'var(--resume-bg)',
            color: 'var(--resume-text)',
            fontFamily: 'var(--resume-font)',
          }}
        >
          <style>{`
            .prose h1 { font-family: var(--resume-font); font-weight: 800; letter-spacing: -0.04em; margin-bottom: 2rem; border-bottom: 4px solid var(--resume-primary); padding-bottom: 1rem; color: var(--resume-text); }
            .prose h2 { font-family: var(--resume-font); font-weight: 700; letter-spacing: -0.02em; margin-top: 3rem; color: var(--resume-accent); text-transform: uppercase; font-size: 0.875rem; letter-spacing: 0.2em; }
            .prose p { line-height: 1.8; color: var(--resume-text); opacity: 0.9; }
            .prose li { margin-bottom: 0.5rem; color: var(--resume-text); opacity: 0.8; }
            .prose strong { color: var(--resume-primary); font-weight: 600; }
          `}</style>
          {sections.map((section) => (
            <div key={section.id} className="mb-16 last:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
