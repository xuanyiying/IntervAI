import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useResumeBuilder } from './hooks/useResumeBuilder';
import { ResumeNavbar } from './components/ResumeNavbar';
import { ResumeSidebar } from './components/ResumeSidebar';
import { ResumeEditor } from './components/ResumeEditor';
import { ResumePreview } from './components/ResumePreview';

export const ResumeBuilder: React.FC = () => {
  const {
    sections,
    setSections,
    activeSectionId,
    setActiveSectionId,
    currentTheme,
    setCurrentTheme,
    isDarkMode,
    setIsDarkMode,
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
        const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
        if (currentIndex < sections.length - 1) {
          setActiveSectionId(sections[currentIndex + 1].id);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
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
      className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}
      role="main"
      aria-label="Resume Builder Application"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <ResumeNavbar
        isEditView={isEditView}
        setIsEditView={setIsEditView}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onReset={handleResetToDefault}
        onExportJSON={handleExportJSON}
        onExportPDF={handleExportPDF}
      />

      <main className="max-w-[1600px] mx-auto p-6 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className={`lg:col-span-4 ${!isEditView ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
            <ResumeSidebar
              sections={sections}
              setSections={setSections}
              activeSectionId={activeSectionId}
              setActiveSectionId={setActiveSectionId}
              onAddSection={handleAddSection}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
            />
          </div>

          <div className={`lg:col-span-8 ${isEditView ? '' : 'lg:col-span-12'}`}>
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
      </main>

      <footer className="fixed bottom-0 left-0 right-0 px-6 py-3 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
        <div className="flex items-center gap-6">
          <span>Sections: {sections.length}</span>
          <span>Last Saved: Just now</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />{' '}
            System Ready
          </span>
          <span>v1.0.0</span>
        </div>
      </footer>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100]"
          >
            <span className="text-sm font-bold">{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <Plus size={16} className="rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeBuilder;
