import React from 'react';
import { Sun, Moon, RotateCcw, FileJson, Download } from 'lucide-react';
import { ResumeTheme } from '../types';
import { THEMES } from '../constants';

interface ResumeNavbarProps {
  isEditView: boolean;
  setIsEditView: (v: boolean) => void;
  currentTheme: ResumeTheme;
  setCurrentTheme: (t: ResumeTheme) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  onReset: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
}

const BUTTON_PRIMARY = 'group relative flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden';
const BUTTON_SECONDARY = 'flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider';

export const ResumeNavbar: React.FC<ResumeNavbarProps> = ({
  isEditView,
  setIsEditView,
  currentTheme,
  setCurrentTheme,
  isDarkMode,
  setIsDarkMode,
  onReset,
  onExportJSON,
  onExportPDF,
}) => {
  return (
    <nav className="sticky top-0 z-50 px-8 py-6 border-b border-white/5 bg-black/60 backdrop-blur-2xl" role="navigation" aria-label="Main Toolbar">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-black tracking-tighter italic font-display leading-none">AI.RESUME</h1>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5" role="tablist" aria-label="View Mode">
            <button
              role="tab"
              aria-selected={isEditView}
              onClick={() => setIsEditView(true)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isEditView ? 'bg-white text-black shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
            >
              Build
            </button>
            <button
              role="tab"
              aria-selected={!isEditView}
              onClick={() => setIsEditView(false)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isEditView ? 'bg-white text-black shadow-lg' : 'hover:bg-white/5 text-white/40'}`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-4 bg-white/5 p-1 rounded-xl border border-white/5">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setCurrentTheme(theme)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${currentTheme.id === theme.id ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-white/20'}`}
                style={{ backgroundColor: theme.primary }}
                title={theme.name}
              />
            ))}
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={BUTTON_SECONDARY}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={onReset} className={BUTTON_SECONDARY} title="Reset to default">
            <RotateCcw size={18} />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <button onClick={onExportJSON} className={BUTTON_SECONDARY}>
            <FileJson size={18} />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button onClick={onExportPDF} className={BUTTON_PRIMARY}>
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
