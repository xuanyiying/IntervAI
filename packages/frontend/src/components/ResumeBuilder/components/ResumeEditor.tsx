import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import { ResumeSection } from '../types';

interface ResumeEditorProps {
  activeSection: ResumeSection | undefined;
  onUpdateSection: (id: string, updates: Partial<ResumeSection>) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  activeSection,
  onUpdateSection,
}) => {
  const { t } = useTranslation();
  const sectionTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSection) {
      sectionTitleRef.current?.focus();
    }
  }, [activeSection?.id]);

  if (!activeSection) {
    return (
      <motion.div
        key="editor-empty"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rb-card"
      >
        <div className="rb-empty">
          <Edit3 size={36} strokeWidth={1.5} />
          <p>
            {t(
              'resume_builder.select_section_hint',
              'Select a section to start editing'
            )}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rb-card"
    >
      <div className="rb-field">
        <label className="rb-label">
          {t('resume_builder.section_title', 'Section Title')}
        </label>
        <input
          ref={sectionTitleRef}
          value={activeSection.title}
          onChange={(e) =>
            onUpdateSection(activeSection.id, { title: e.target.value })
          }
          className="rb-input-title"
          placeholder={t('resume_builder.section_title', 'Section Title')}
          aria-label="Section Title"
        />
      </div>

      <div className="rb-field">
        <div className="rb-field-head">
          <label className="rb-label">
            {t('resume_builder.content_editor', 'Content Editor')}
          </label>
          <span className="rb-badge">
            {t('resume_builder.markdown_version', 'Markdown')}
          </span>
        </div>
        <textarea
          value={activeSection.content}
          onChange={(e) =>
            onUpdateSection(activeSection.id, { content: e.target.value })
          }
          className="rb-textarea"
          placeholder={t(
            'resume_builder.content_placeholder',
            '# Start building your story...'
          )}
          aria-label="Section Content in Markdown"
        />
      </div>
    </motion.div>
  );
};
