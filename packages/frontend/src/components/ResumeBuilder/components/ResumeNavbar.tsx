import { Download, FileJson, RotateCcw } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { THEMES } from '../constants';
import { ResumeTheme } from '../types';

interface ResumeNavbarProps {
  isEditView: boolean;
  setIsEditView: (v: boolean) => void;
  currentTheme: ResumeTheme;
  setCurrentTheme: (t: ResumeTheme) => void;
  onReset: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
}

export const ResumeNavbar: React.FC<ResumeNavbarProps> = ({
  isEditView,
  setIsEditView,
  currentTheme,
  setCurrentTheme,
  onReset,
  onExportJSON,
  onExportPDF,
}) => {
  const { t } = useTranslation();

  return (
    <nav className="rb-navbar" role="navigation" aria-label="Main Toolbar">
      <div className="rb-navbar-left">
        <h1 className="rb-brand">AI.RESUME</h1>
        <span className="rb-divider" />
        <div className="rb-tabs" role="tablist" aria-label="View Mode">
          <button
            role="tab"
            aria-selected={isEditView}
            onClick={() => setIsEditView(true)}
            className={`rb-tab ${isEditView ? 'is-active' : ''}`}
          >
            {t('resume_builder.build', 'Build')}
          </button>
          <button
            role="tab"
            aria-selected={!isEditView}
            onClick={() => setIsEditView(false)}
            className={`rb-tab ${!isEditView ? 'is-active' : ''}`}
          >
            {t('resume_builder.preview', 'Preview')}
          </button>
        </div>
      </div>

      <div className="rb-navbar-right">
        <div className="rb-theme-list" role="group" aria-label="Resume Theme">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setCurrentTheme(theme)}
              className={`rb-swatch ${currentTheme.id === theme.id ? 'is-active' : ''}`}
              style={{ backgroundColor: theme.background }}
              title={t(`resume_builder.themes.${theme.id}`, theme.name)}
              aria-label={t(`resume_builder.themes.${theme.id}`, theme.name)}
            />
          ))}
        </div>
        <button
          onClick={onReset}
          className="rb-btn rb-btn--icon"
          title={t('resume_builder.reset', 'Reset to default')}
          aria-label={t('resume_builder.reset', 'Reset to default')}
        >
          <RotateCcw size={16} />
        </button>
        <button onClick={onExportJSON} className="rb-btn">
          <FileJson size={16} />
          <span>{t('resume_builder.json', 'JSON')}</span>
        </button>
        <button onClick={onExportPDF} className="rb-btn rb-btn--primary">
          <Download size={16} />
          <span>{t('resume_builder.export_pdf', 'Export PDF')}</span>
        </button>
      </div>
    </nav>
  );
};
