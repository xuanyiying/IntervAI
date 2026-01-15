import { useState, useEffect, useCallback } from 'react';
import { ResumeSection, ResumeTheme } from '../types';
import { THEMES, DEFAULT_SECTIONS } from '../constants';

export const useResumeBuilder = () => {
  const [sections, setSections] = useState<ResumeSection[]>(DEFAULT_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id || null
  );
  const [currentTheme, setCurrentTheme] = useState<ResumeTheme>(THEMES[0]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [previewMode, setPreviewMode] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop');
  const [isEditView, setIsEditView] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply theme variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--resume-primary', currentTheme.primary);
    root.style.setProperty('--resume-bg', currentTheme.background);
    root.style.setProperty('--resume-text', currentTheme.text);
    root.style.setProperty('--resume-accent', currentTheme.accent);
    root.style.setProperty('--resume-font', currentTheme.fontFamily);
  }, [currentTheme]);

  const handleUpdateSection = useCallback(
    (id: string, updates: Partial<ResumeSection>) => {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const handleAddSection = useCallback(() => {
    const newSection: ResumeSection = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: 'New Section',
      content: '## New Section Content\n\nStart writing here...',
    };
    setSections((prev) => [...prev, newSection]);
    setActiveSectionId(newSection.id);
  }, []);

  const handleDeleteSection = useCallback((id: string) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
    // If the deleted section was active, we need to switch.
    // This logic is tricky inside a callback without access to current state.
    // For now, we will handle the selection update in the component or use a separate effect.
    // Or we can check activeSectionId in the component.
    // To keep the hook pure, let's return the logic to update selection.

    // Actually, let's do it simply:
    // If we delete the active section, we select the previous one or the first one.
    // Since we don't have access to `activeSectionId` inside the functional update of `setSections`,
    // we might need to rely on the component or change how we update.
  }, []);

  // Improved delete handler that also updates active ID
  const deleteSection = (id: string) => {
    if (sections.length <= 1) return;

    const newSections = sections.filter((s) => s.id !== id);
    setSections(newSections);

    if (activeSectionId === id) {
      setActiveSectionId(newSections[0]?.id || null);
    }
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      const duplicated: ResumeSection = {
        ...section,
        id: `${section.id}-copy-${Date.now()}`,
        title: `${section.title} (Copy)`,
      };
      const index = sections.findIndex((s) => s.id === id);
      const newSections = [...sections];
      newSections.splice(index + 1, 0, duplicated);
      setSections(newSections);
      setActiveSectionId(duplicated.id);
    }
  };

  const resetToDefault = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all changes? This cannot be undone.'
      )
    ) {
      setSections(DEFAULT_SECTIONS);
      setActiveSectionId(DEFAULT_SECTIONS[0].id);
    }
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(sections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      const content = sections
        .map((s) => `# ${s.title}\n\n${s.content}`)
        .join('\n\n---\n\n');
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume-export.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export. Please try again.');
      console.error(err);
    }
  };

  return {
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
    handleDeleteSection: deleteSection,
    handleDuplicateSection: duplicateSection,
    handleResetToDefault: resetToDefault,
    handleExportJSON,
    handleExportPDF,
  };
};
