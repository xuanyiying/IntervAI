import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ResumeEditor } from './components/ResumeEditor';
import { ResumeNavbar } from './components/ResumeNavbar';
import { ResumePreview } from './components/ResumePreview';
import { ResumeSidebar } from './components/ResumeSidebar';
import { useResumeBuilder } from './hooks/useResumeBuilder';
import './ResumeBuilder.css';

export const ResumeBuilder: React.FC = () => {
  const { t } = useTranslation();
  const {
    sections,
    setSections,
    activeSectionId,
    setActiveSectionId,
    currentTheme,
    setCurrentTheme,
    previewMode,
    setPreviewMode,
    isEditView,
    setIsEditView,
    error,
    setError,
    handleUpdateSection,
    handleAddSection,
    handleDeleteSection,
    handleDuplicateSection,
    handleResetToDefault,
    handleExportJSON,
    handleExportPDF,
  } = useResumeBuilder();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        console.log('Saved locally');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsEditView((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = sections.findIndex(
          (s) => s.id === activeSectionId
        );
        if (currentIndex < sections.length - 1) {
          setActiveSectionId(sections[currentIndex + 1].id);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = sections.findIndex(
          (s) => s.id === activeSectionId
        );
        if (currentIndex > 0) {
          setActiveSectionId(sections[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSectionId, sections, setIsEditView, setActiveSectionId]);

  const activeSection = sections.find((s) => s.id === activeSectionId);

  return (
    <div
      className="rb-container"
      role="main"
      aria-label="Resume Builder Application"
    >
      <ResumeNavbar
        isEditView={isEditView}
        setIsEditView={setIsEditView}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        onReset={handleResetToDefault}
        onExportJSON={handleExportJSON}
        onExportPDF={handleExportPDF}
      />

      <div className={`rb-workspace ${isEditView ? '' : 'is-preview'}`}>
        <aside
          className={`rb-sidebar ${isEditView ? '' : 'rb-sidebar-placeholder'}`}
          aria-hidden={!isEditView}
        >
          <ResumeSidebar
            sections={sections}
            setSections={setSections}
            activeSectionId={activeSectionId}
            setActiveSectionId={setActiveSectionId}
            onAddSection={handleAddSection}
            onDuplicateSection={handleDuplicateSection}
            onDeleteSection={handleDeleteSection}
          />
        </aside>

        <div>
          <AnimatePresence mode="wait">
            {isEditView ? (
              <ResumeEditor
                key="editor-view"
                activeSection={activeSection}
                onUpdateSection={handleUpdateSection}
              />
            ) : (
              <ResumePreview
                key="preview-view"
                sections={sections}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="rb-meta">
        <div className="rb-meta-group">
          <span>
            {t('resume_builder.section_count', { num: sections.length })}
          </span>
          <span className="rb-meta-group">
            <span className="rb-dot" />
            {t('resume_builder.auto_saved')}
          </span>
        </div>
        <span>v1.0.0</span>
      </footer>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="rb-toast"
            role="alert"
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="rb-toast-close"
              aria-label="Dismiss error"
            >
              <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeBuilder;
