import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import { ResumeSection } from '../types';

interface ResumeEditorProps {
  activeSection: ResumeSection | undefined;
  onUpdateSection: (id: string, updates: Partial<ResumeSection>) => void;
}

const GLASS_CARD =
  'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl transition-all duration-500 hover:border-white/20';

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  activeSection,
  onUpdateSection,
}) => {
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
        className={GLASS_CARD}
      >
        <div className="h-[600px] flex flex-col items-center justify-center text-white/20 space-y-4">
          <Edit3 size={48} strokeWidth={1} />
          <p className="text-sm font-medium">
            Select a section to start editing
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
      className={GLASS_CARD}
    >
      <div className="space-y-12">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Section Title
          </label>
          <input
            ref={sectionTitleRef}
            value={activeSection.title}
            onChange={(e) =>
              onUpdateSection(activeSection.id, { title: e.target.value })
            }
            className="text-6xl font-black tracking-tighter bg-transparent border-none focus:outline-none w-full font-display placeholder-white/5 selection:bg-white/20"
            placeholder="Section Title"
            aria-label="Section Title"
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
              Content Editor
            </label>
            <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
              Markdown v4.0
            </span>
          </div>
          <textarea
            value={activeSection.content}
            onChange={(e) =>
              onUpdateSection(activeSection.id, { content: e.target.value })
            }
            className="w-full h-[600px] bg-white/[0.03] border border-white/5 rounded-[2rem] p-10 font-mono text-sm leading-[1.8] focus:border-white/10 focus:bg-white/[0.04] focus:outline-none transition-all resize-none shadow-inner selection:bg-white/20"
            placeholder="# Start building your story..."
            aria-label="Section Content in Markdown"
          />
        </div>
      </div>
    </motion.div>
  );
};
