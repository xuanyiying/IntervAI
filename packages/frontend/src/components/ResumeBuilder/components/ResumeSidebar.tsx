import { Reorder } from 'framer-motion';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResumeSection } from '../types';

interface ResumeSidebarProps {
  sections: ResumeSection[];
  setSections: (sections: ResumeSection[]) => void;
  activeSectionId: string | null;
  setActiveSectionId: (id: string) => void;
  onAddSection: () => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
}

export const ResumeSidebar: React.FC<ResumeSidebarProps> = ({
  sections,
  setSections,
  activeSectionId,
  setActiveSectionId,
  onAddSection,
  onDuplicateSection,
  onDeleteSection,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="rb-sidebar-header">
        <h2 className="rb-sidebar-title">
          {t('resume_builder.resume_sections', 'Resume Sections')}
        </h2>
        <button
          onClick={onAddSection}
          className="rb-btn rb-btn--icon"
          aria-label="Add Section"
        >
          <Plus size={16} />
        </button>
      </div>

      <Reorder.Group
        axis="y"
        values={sections}
        onReorder={setSections}
        className="rb-section-list"
      >
        {sections.map((section) => (
          <Reorder.Item
            key={section.id}
            value={section}
            className={`rb-section-item ${activeSectionId === section.id ? 'is-active' : ''}`}
            onClick={() => setActiveSectionId(section.id)}
          >
            <GripVertical size={15} className="rb-drag" />
            <span className="rb-section-name">{section.title}</span>
            <div className="rb-item-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSection(section.id);
                }}
                className="rb-icon-btn"
                aria-label="Duplicate Section"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSection(section.id);
                }}
                className="rb-icon-btn rb-icon-btn--danger"
                aria-label="Delete Section"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </>
  );
};
