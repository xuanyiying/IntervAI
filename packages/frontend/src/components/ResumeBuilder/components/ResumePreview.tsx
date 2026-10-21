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

const PREVIEW_MODES = [
  { mode: 'desktop' as const, Icon: Monitor },
  { mode: 'tablet' as const, Icon: Tablet },
  { mode: 'mobile' as const, Icon: Smartphone },
];

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  sections,
  previewMode,
  setPreviewMode,
}) => {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="rb-preview"
    >
      <div
        className="rb-preview-toolbar"
        role="group"
        aria-label="Preview Size"
      >
        {PREVIEW_MODES.map(({ mode, Icon }) => (
          <button
            key={mode}
            onClick={() => setPreviewMode(mode)}
            className={`rb-preview-btn ${previewMode === mode ? 'is-active' : ''}`}
            aria-label={mode}
            aria-pressed={previewMode === mode}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className={`rb-paper-frame rb-paper-frame--${previewMode}`}>
        <article className="rb-paper">
          {sections.map((section) => (
            <div key={section.id} className="rb-paper-section">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          ))}
        </article>
      </div>
    </motion.div>
  );
};
