import React from 'react';
import { useTranslation } from 'react-i18next';
import { Reorder } from 'framer-motion';
import { Plus, GripVertical, Copy, Trash2 } from 'lucide-react';
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
    <div className="lg:col-span-4 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">
            {t('resume_builder.resume_sections', 'Resume Sections')}
          </h2>
          <button
            onClick={onAddSection}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            aria-label="Add Section"
          >
            <Plus size={20} />
          </button>
        </div>

        <Reorder.Group
          axis="y"
          values={sections}
          onReorder={setSections}
          className="space-y-3"
        >
          {sections.map((section) => (
            <Reorder.Item
              key={section.id}
              value={section}
              className={`group flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${activeSectionId === section.id ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:border-white/10'}`}
              onClick={() => setActiveSectionId(section.id)}
            >
              <GripVertical
                size={16}
                className="text-white/20 group-hover:text-white/40"
              />
              <span className="flex-1 font-medium text-sm truncate">
                {section.title}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateSection(section.id);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-md text-red-400/60 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
};
