import { Button, GlassCard, Select, Text, useToast } from '@/components/ui';
import { Optimization, Resume } from '@/types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  InterviewerPersona,
  interviewService,
} from '../../../services/interview-service';
import { capturePcmBase64 } from '../../../utils/pcm';
import {
  IconAudio,
  IconCheck,
  IconClock,
  IconFileText,
  IconGlobe,
  IconHeadphones,
  IconMic,
  IconSparkles,
  IconTarget,
  IconUser,
} from './icons';
import { useTranslation } from 'react-i18next';

export type InterviewMode = 'mock' | 'assist';
export type InterviewLanguage = 'zh' | 'en';

export const PERSONA_STYLE_LABELS: Record<string, string> = {
  STRICT: 'interview.personaStyles.strict',
  FRIENDLY: 'interview.personaStyles.friendly',
  TECHNICAL: 'interview.personaStyles.technical',
  HR: 'interview.personaStyles.hr',
  SUPPORTIVE: 'interview.personaStyles.supportive',
  CHALLENGING: 'interview.personaStyles.challenging',
};

interface SetupStepProps {
  mode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
  language: InterviewLanguage;
  onLanguageChange: (lang: InterviewLanguage) => void;
  resumes: Resume[];
  selectedResumeId: string | null;
  onSelectResume: (id: string | null) => void;
  optimizations: Optimization[];
  optimizationsLoading: boolean;
  selectedOptimizationId: string | null;
  onSelectOptimization: (id: string | null) => void;
  personas: InterviewerPersona[];
  selectedPersonaId?: string;
  onSelectPersona: (id: string) => void;
  onStart: () => void;
  starting: boolean;
}

const MODE_META: Record<
  InterviewMode,
  {
    icon: React.ReactNode;
    nameKey: string;
    tagKey: string;
    descKey: string;
    pointKeys: string[];
  }
> = {
  assist: {
    icon: <IconHeadphones size={22} />,
    nameKey: 'interview.mode_assist',
    tagKey: 'interview.setup.mode_assist_tag',
    descKey: 'interview.setup.mode_assist_desc',
    pointKeys: [
      'interview.setup.mode_assist_point_1',
      'interview.setup.mode_assist_point_2',
      'interview.setup.mode_assist_point_3',
    ],
  },
  mock: {
    icon: <IconTarget size={22} />,
    nameKey: 'interview.mode_mock',
    tagKey: 'interview.setup.mode_mock_tag',
    descKey: 'interview.setup.mode_mock_desc',
    pointKeys: [
      'interview.setup.mode_mock_point_1',
      'interview.setup.mode_mock_point_2',
      'interview.setup.mode_mock_point_3',
    ],
  },
};

const SetupStep: React.FC<SetupStepProps> = ({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  resumes,
  selectedResumeId,
  onSelectResume,
  optimizations,
  optimizationsLoading,
  selectedOptimizationId,
  onSelectOptimization,
  personas,
  selectedPersonaId,
  onSelectPersona,
  onStart,
  starting,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { warning, success, error: showError } = useToast();

  const [vpStatus, setVpStatus] = useState<{
    available: boolean;
    enrolled: boolean;
    sampleCount: number;
  } | null>(null);
  const [vpEnrolling, setVpEnrolling] = useState(false);
  const [vpCountdown, setVpCountdown] = useState(0);

  useEffect(() => {
    if (mode !== 'assist') return;
    interviewService
      .getVoiceprintStatus()
      .then(setVpStatus)
      .catch(() => setVpStatus(null));
  }, [mode]);

  const handleEnrollVoiceprint = async () => {
    try {
      setVpEnrolling(true);
      const { base64, sampleRate } = await capturePcmBase64(9, setVpCountdown);
      const result = await interviewService.enrollVoiceprint(
        base64,
        sampleRate
      );
      if (result.success) {
        success(t('interview.setup.voiceprint_enrolled'));
        const status = await interviewService.getVoiceprintStatus();
        setVpStatus(status);
      } else {
        warning(result.message || t('interview.setup.voiceprint_failed'));
      }
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        showError(t('interview.setup.voiceprint_failed'));
      } else {
        warning(t('interview.setup.mic_permission'));
      }
    } finally {
      setVpEnrolling(false);
      setVpCountdown(0);
    }
  };

  const handleDeleteVoiceprint = async () => {
    try {
      await interviewService.deleteVoiceprint();
      const status = await interviewService.getVoiceprintStatus();
      setVpStatus(status);
    } catch {
      showError(t('interview.setup.voiceprint_clear_failed'));
    }
  };

  const mockRequiresOptimization = mode === 'mock' && !selectedOptimizationId;
  const hasOptimizations = optimizations.length > 0;
  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  const noResumeOptimization = !!selectedResumeId && !hasOptimizations;

  const handleStart = () => {
    if (mockRequiresOptimization) {
      warning(t('interview.mock.optimization_required'));
      return;
    }
    onStart();
  };

  const formatOptDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(
      i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    );
  };

  return (
    <div className="iv-two-col">
      <div className="iv-stack">
        <div className="iv-hero">
          <div
            className="iv-row"
            style={{ gap: '1rem', marginBottom: '0.75rem' }}
          >
            <div className="iv-hero-icon">
              <IconSparkles size={28} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="iv-hero-title">
                {t('interview.setup.hero_title')}
              </h2>
              <p className="iv-hero-sub">
                {t('interview.setup.hero_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <span className="iv-field-label">
            {t('interview.setup.select_mode')}
          </span>
          <div className="iv-mode-grid">
            {(Object.keys(MODE_META) as InterviewMode[]).map((key) => {
              const meta = MODE_META[key];
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`iv-mode-card${active ? ' active' : ''}`}
                  data-mode={key}
                  onClick={() => onModeChange(key)}
                >
                  <div className="iv-row-between">
                    <div className="iv-row">
                      <div className="iv-mode-icon">{meta.icon}</div>
                      <div>
                        <span className="iv-mode-name">{t(meta.nameKey)}</span>
                        <span className="iv-mode-tag">{t(meta.tagKey)}</span>
                      </div>
                    </div>
                    {active && (
                      <span className="iv-mode-check">
                        <IconCheck size={13} />
                      </span>
                    )}
                  </div>
                  <div className="iv-mode-desc">{t(meta.descKey)}</div>
                  <ul className="iv-mode-points">
                    {meta.pointKeys.map((pointKey) => (
                      <li key={pointKey}>
                        <IconCheck size={13} />
                        {t(pointKey)}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <GlassCard padding="lg" className="iv-sticky">
        <Text strong className="iv-setup-title">
          {t('interview.setup.configure')}
        </Text>

        <div className="iv-stack" style={{ marginTop: '1.25rem' }}>
          <div>
            <span className="iv-field-label">
              <IconFileText size={13} className="iv-label-icon" />{' '}
              {t('interview.setup.my_resumes')}
              <Text type="secondary" className="iv-field-hint">
                {t('interview.setup.resume_hint')}
              </Text>
            </span>

            {resumes.length === 0 ? (
              <div className="iv-empty">
                <IconFileText size={24} />
                <span>{t('interview.setup.no_resumes')}</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/resumes')}
                >
                  {t('interview.setup.go_upload_resume')}
                </Button>
              </div>
            ) : (
              <Select
                value={selectedResumeId ?? ''}
                onChange={(val) => onSelectResume(val || null)}
                options={[
                  { value: '', label: t('interview.setup.all_resumes') },
                  ...resumes.map((resume) => ({
                    value: resume.id,
                    label: resume.title || resume.originalFilename || resume.id,
                  })),
                ]}
              />
            )}
          </div>

          <div>
            <span className="iv-field-label">
              {t('interview.setup.optimization_records')}
              {selectedResume && (
                <Text type="secondary" className="iv-field-hint">
                  {t('interview.setup.current_resume_hint', {
                    title: selectedResume.title,
                  })}
                </Text>
              )}
            </span>

            {optimizationsLoading ? (
              <div className="iv-empty">
                {t('interview.setup.loading_optimizations')}
              </div>
            ) : !hasOptimizations ? (
              <div className="iv-empty">
                <IconFileText size={24} />
                <span>
                  {noResumeOptimization
                    ? t('interview.setup.no_optimizations_for_resume')
                    : mode === 'mock'
                      ? t('interview.setup.no_optimizations_mock')
                      : t('interview.setup.no_optimizations_assist')}
                </span>
                {(mode === 'mock' || noResumeOptimization) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/resumes')}
                  >
                    {t('interview.setup.go_optimize_resume')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="iv-opt-list">
                {mode === 'assist' && (
                  <button
                    type="button"
                    className={`iv-opt-item${selectedOptimizationId === null ? ' active' : ''}`}
                    onClick={() => onSelectOptimization(null)}
                  >
                    <div className="iv-row-between">
                      <span className="iv-opt-title">
                        {t('interview.setup.general_mode')}
                      </span>
                      {selectedOptimizationId === null && (
                        <IconCheck size={16} />
                      )}
                    </div>
                    <div className="iv-opt-meta">
                      {t('interview.setup.general_mode_desc')}
                    </div>
                  </button>
                )}
                {optimizations.map((opt) => {
                  const active = selectedOptimizationId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`iv-opt-item${active ? ' active' : ''}`}
                      onClick={() => onSelectOptimization(opt.id)}
                    >
                      <div className="iv-row-between">
                        <span className="iv-opt-title">
                          {opt.job?.title || t('interview.setup.no_job')}
                        </span>
                        {active && <IconCheck size={16} />}
                      </div>
                      <div className="iv-opt-meta">
                        {(opt.job?.company || t('interview.setup.no_company')) +
                          ' · ' +
                          formatOptDate(opt.createdAt)}
                        {!selectedResumeId &&
                          opt.resume &&
                          ` · ${opt.resume.title || opt.resume.originalFilename || ''}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <span className="iv-field-label">
              <IconGlobe size={13} className="iv-label-icon" />{' '}
              {t('interview.language_label')}
            </span>
            <Select
              value={language}
              onChange={(val) => onLanguageChange(val as InterviewLanguage)}
              options={[
                { value: 'zh', label: t('interview.language_zh') },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>

          {mode === 'assist' && (
            <div>
              <span className="iv-field-label">
                <IconAudio size={13} className="iv-label-icon" />{' '}
                {t('interview.setup.voiceprint_label')}
              </span>
              {vpStatus && !vpStatus.available ? (
                <div className="iv-empty" style={{ padding: '0.875rem 1rem' }}>
                  <span>{t('interview.setup.voiceprint_unavailable')}</span>
                </div>
              ) : vpStatus?.enrolled ? (
                <div
                  className="iv-opt-item active"
                  style={{ cursor: 'default' }}
                >
                  <div className="iv-row-between">
                    <span
                      className="iv-opt-title"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      <span
                        style={{
                          verticalAlign: '-2px',
                          marginRight: 4,
                          display: 'inline-flex',
                        }}
                      >
                        <IconCheck size={14} />
                      </span>
                      {t('interview.setup.voiceprint_enrolled_status', {
                        count: vpStatus.sampleCount,
                      })}
                    </span>
                    <span className="iv-row" style={{ gap: '0.375rem' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEnrollVoiceprint}
                        loading={vpEnrolling}
                      >
                        {t('interview.setup.voiceprint_reregister')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteVoiceprint}
                      >
                        {t('interview.setup.voiceprint_clear')}
                      </Button>
                    </span>
                  </div>
                  <div className="iv-opt-meta">
                    {t('interview.setup.voiceprint_active_desc')}
                  </div>
                </div>
              ) : (
                <div className="iv-opt-item" style={{ cursor: 'default' }}>
                  <div className="iv-row-between">
                    <span className="iv-opt-title">
                      {vpEnrolling
                        ? t('interview.setup.voiceprint_speak', {
                            seconds: vpCountdown,
                          })
                        : t('interview.setup.voiceprint_not_enrolled')}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnrollVoiceprint}
                      loading={vpEnrolling && vpCountdown === 0}
                    >
                      {vpEnrolling
                        ? t('interview.setup.voiceprint_recording')
                        : t('interview.setup.voiceprint_register')}
                    </Button>
                  </div>
                  <div className="iv-opt-meta">
                    {t('interview.setup.voiceprint_register_desc')}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'mock' && (
            <div>
              <span className="iv-field-label">
                <IconUser size={13} className="iv-label-icon" />{' '}
                {t('interview.select_persona')}
              </span>
              {personas.length === 0 ? (
                <div className="iv-empty">
                  {t('interview.setup.no_personas')}
                </div>
              ) : (
                <div className="iv-persona-list">
                  {personas.map((persona) => {
                    const active = selectedPersonaId === persona.id;
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        className={`iv-persona-item${active ? ' active' : ''}`}
                        onClick={() => onSelectPersona(persona.id)}
                      >
                        <span className="iv-persona-avatar">
                          {persona.name.charAt(0)}
                        </span>
                        <span className="iv-persona-body">
                          <span className="iv-row-between">
                            <span
                              className="iv-opt-title"
                              style={{
                                color: active
                                  ? 'var(--primary-color)'
                                  : undefined,
                              }}
                            >
                              {persona.name}
                            </span>
                            <span className="iv-pill">
                              {PERSONA_STYLE_LABELS[persona.style]
                                ? t(PERSONA_STYLE_LABELS[persona.style])
                                : persona.style}
                            </span>
                          </span>
                          {(persona.company || persona.position) && (
                            <span
                              className="iv-opt-meta"
                              style={{ display: 'block' }}
                            >
                              {[persona.company, persona.position]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStart}
            loading={starting}
            disabled={mockRequiresOptimization}
          >
            {mode === 'assist' ? (
              <>
                <IconHeadphones size={16} /> {t('interview.setup.start_assist')}
              </>
            ) : (
              <>
                <IconMic size={16} /> {t('interview.setup.start_mock')}
              </>
            )}
          </Button>

          <div className="iv-tip">
            <IconClock size={15} />
            <span>
              {mode === 'assist'
                ? t('interview.setup.assist_tip')
                : t('interview.setup.mock_tip')}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SetupStep;
