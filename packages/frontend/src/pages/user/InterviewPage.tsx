import InterviewReportModal from '@/components/InterviewReportModal';
import {
  Badge,
  Button,
  GlassCard,
  Modal,
  Tabs,
  Title,
  useToast,
} from '@/components/ui';
import VoiceInterviewCall from '@/components/VoiceInterviewCall';
import { useResumeStore } from '@/stores';
import '@/styles/interview.css';
import {
  InterviewQuestion,
  InterviewSession,
  Optimization,
  ParseStatus,
  Resume,
} from '@/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  InterviewerPersona,
  interviewService,
  InterviewSessionHistoryItem,
} from '../../services/interview-service';
import { optimizationService } from '../../services/optimization-service';
import AssistModeView from './interview/AssistModeView';
import HistoryList from './interview/HistoryList';
import {
  IconClock,
  IconGlobe,
  IconHeadphones,
  IconMic,
  IconPhone,
  IconSparkles,
  IconTarget,
} from './interview/icons';
import MockModeView from './interview/MockModeView';
import SetupStep, {
  InterviewLanguage,
  InterviewMode,
} from './interview/SetupStep';
import { useTranslation } from 'react-i18next';

const InterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlOptimizationId = searchParams.get('optimizationId');
  const urlResumeId = searchParams.get('resumeId');
  const { success, error: showError, warning } = useToast();
  const { resumes, fetchResumes } = useResumeStore();

  // setup state
  const [currentStep, setCurrentStep] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('assist');
  const [language, setLanguage] = useState<InterviewLanguage>('zh');
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [optimizationsLoading, setOptimizationsLoading] = useState(true);
  const [selectedOptimizationId, setSelectedOptimizationId] = useState<
    string | null
  >(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<InterviewerPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<
    string | undefined
  >();

  // live session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [reportSessionId, setReportSessionId] = useState<string | null>(null);

  // history state
  const [history, setHistory] = useState<InterviewSessionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const startingRef = useRef(false);

  useEffect(() => {
    fetchResumes();
    loadOptimizations();
    loadPersonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOptimizations = async () => {
    try {
      setOptimizationsLoading(true);
      const data = await optimizationService.listOptimizations();
      setOptimizations(data);

      const urlOptimization = urlOptimizationId
        ? data.find((o) => o.id === urlOptimizationId)
        : undefined;

      setSelectedResumeId((prev) => {
        if (prev) return prev;
        if (urlOptimization) return urlOptimization.resumeId;
        return urlResumeId ?? null;
      });

      setSelectedOptimizationId((prev) => {
        if (prev && data.some((o) => o.id === prev)) return prev;
        if (urlOptimization) return urlOptimization.id;
        const pool = urlResumeId
          ? data.filter((o) => o.resumeId === urlResumeId)
          : data;
        return pool.length > 0 ? pool[0].id : null;
      });
    } catch (err) {
      console.error('Failed to load optimizations:', err);
    } finally {
      setOptimizationsLoading(false);
    }
  };

  const handleSelectResume = (resumeId: string | null) => {
    setSelectedResumeId(resumeId);
    setSelectedOptimizationId((prev) => {
      const pool = resumeId
        ? optimizations.filter((o) => o.resumeId === resumeId)
        : optimizations;
      if (prev && pool.some((o) => o.id === prev)) return prev;
      return pool.length > 0 ? pool[0].id : null;
    });
  };

  const handleSelectOptimization = (optimizationId: string | null) => {
    setSelectedOptimizationId(optimizationId);
    if (optimizationId) {
      const optimization = optimizations.find((o) => o.id === optimizationId);
      if (optimization) setSelectedResumeId(optimization.resumeId);
    }
  };

  const selectableResumes = resumes.filter(
    (resume) => resume.parseStatus === ParseStatus.COMPLETED
  );

  const visibleOptimizations = selectedResumeId
    ? optimizations.filter((o) => o.resumeId === selectedResumeId)
    : optimizations;

  const selectedOptimization = optimizations.find(
    (o) => o.id === selectedOptimizationId
  );
  const selectedResume: Resume | undefined = resumes.find(
    (r) => r.id === (selectedOptimization?.resumeId ?? selectedResumeId)
  );

  const loadPersonas = async () => {
    try {
      const data = await interviewService.getPersonas();
      setPersonas(data);
      const defaultPersona = data.find((p) => p.isDefault);
      if (defaultPersona) {
        setSelectedPersonaId(defaultPersona.id);
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await interviewService.getInterviewHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load interview history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const initializeSession = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      setLoading(true);

      const effectiveOptimizationId =
        selectedOptimizationId ||
        (urlOptimizationId &&
        optimizations.some((o) => o.id === urlOptimizationId)
          ? urlOptimizationId
          : null);

      if (interviewMode === 'mock' && !effectiveOptimizationId) {
        warning(t('interview.mock.optimization_required'));
        setCurrentStep(0);
        return;
      }

      const activeSession = effectiveOptimizationId
        ? await interviewService
            .getActiveSession(effectiveOptimizationId)
            .catch(() => null)
        : null;

      if (activeSession) {
        setSession(activeSession);
        const state = await interviewService.getCurrentState(activeSession.id);
        if (state.isCompleted || state.status === 'COMPLETED') {
          handleCompletion(activeSession.id);
        } else {
          setCurrentIndex(state.currentIndex || 0);
          setTotalQuestions(state.totalQuestions || 0);
          setCurrentQuestion(state.currentQuestion || null);
        }
      } else {
        const result = await interviewService.startSession(
          effectiveOptimizationId ?? undefined,
          undefined,
          selectedPersonaId,
          interviewMode,
          language
        );
        setSession(result.session);
        setCurrentQuestion(result.firstQuestion);
        const state = await interviewService.getCurrentState(result.session.id);
        setTotalQuestions(state.totalQuestions || 10);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to initialize interview session:', err);
      showError(t('interview.start_failed'));
      setCurrentStep(0);
    } finally {
      setLoading(false);
      startingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedOptimizationId,
    urlOptimizationId,
    optimizations,
    interviewMode,
    language,
    selectedPersonaId,
  ]);

  useEffect(() => {
    if (currentStep === 1 && !session) {
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleSubmitAnswer = async (audioBlob?: Blob) => {
    if (!session || (!answerText.trim() && !audioBlob)) {
      warning(t('interview.answer_required'));
      return;
    }

    try {
      setProcessing(true);
      let audioUrl: string | undefined;

      if (audioBlob) {
        const uploadResult = await interviewService.uploadAudio(audioBlob);
        audioUrl = uploadResult.url;

        if (!answerText) {
          const transcription =
            await interviewService.transcribeAudio(audioBlob);
          setAnswerText(transcription.text);
        }
      }

      const result = await interviewService.submitAnswer(
        session.id,
        answerText || t('interview.audio_answer'),
        audioUrl
      );

      setAnswerText('');

      if (result.isCompleted) {
        handleCompletion(session.id);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCurrentIndex((prev) => prev + 1);
        success(t('interview.answer_submitted_next'));
      }
    } catch (err) {
      showError(t('interview.submit_failed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleSendMessage = async (question: string) => {
    if (!session || !question.trim()) return;

    try {
      setProcessing(true);
      await interviewService.sendMessage(session.id, question);
    } catch (err) {
      showError(t('interview.live.send_failed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletion = (sessionId: string) => {
    success(t('interview.completed_generating_feedback'));
    pollFeedback(sessionId);
  };

  const pollFeedback = (sessionId: string) => {
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const updatedSession = await interviewService.getSession(sessionId);
        if (
          updatedSession.status === 'COMPLETED' &&
          (updatedSession.feedback || updatedSession.score != null)
        ) {
          clearInterval(pollInterval);
          setReportSessionId(sessionId);
        } else if (updatedSession.status === 'COMPLETED' && attempts >= 10) {
          clearInterval(pollInterval);
          setReportSessionId(sessionId);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          warning(t('interview.live.report_slow'));
        }
      } catch (e) {
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
        }
      }
    }, 2000);
  };

  const resetSessionState = () => {
    setSession(null);
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setTotalQuestions(0);
    setAnswerText('');
    setIsVoiceCallActive(false);
  };

  const endSessionEarly = async () => {
    if (!session) return;
    if (!window.confirm(t('interview.live.end_confirm'))) return;
    try {
      setProcessing(true);
      await interviewService.endSession(session.id);
      if (interviewMode === 'mock') {
        handleCompletion(session.id);
      } else {
        success(t('interview.live.session_ended_saved'));
        resetSessionState();
        setCurrentStep(2);
        loadHistory();
      }
    } catch (err) {
      showError(t('interview.end_failed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeFromHistory = (item: InterviewSessionHistoryItem) => {
    setInterviewMode(item.mode === 'MOCK' ? 'mock' : 'assist');
    if (item.optimizationId) {
      setSelectedOptimizationId(item.optimizationId);
      const optimization = optimizations.find(
        (o) => o.id === item.optimizationId
      );
      if (optimization) setSelectedResumeId(optimization.resumeId);
    }
    setCurrentStep(1);
  };

  /** After the mock voice call closes, re-sync question progress with the backend. */
  const handleVoiceCallClose = async () => {
    setIsVoiceCallActive(false);
    if (!session || interviewMode !== 'mock') return;
    try {
      const state = await interviewService.getCurrentState(session.id);
      if (state.isCompleted || state.status === 'COMPLETED') {
        handleCompletion(session.id);
      } else {
        setCurrentQuestion(state.currentQuestion || null);
        setCurrentIndex(state.currentIndex || 0);
        setTotalQuestions(state.totalQuestions || totalQuestions);
      }
    } catch (err) {
      console.error('Failed to refresh session state after voice call:', err);
    }
  };

  const handleStart = () => {
    resetSessionState();
    setCurrentStep(1);
  };

  const progressPercent =
    totalQuestions > 0
      ? Math.round(
          ((currentIndex + (currentQuestion ? 1 : 0)) / totalQuestions) * 100
        )
      : 0;

  return (
    <div className="iv-page">
      <Tabs
        items={[
          { key: 'setup', label: t('interview.setup_title') },
          { key: 'interview', label: t('interview.live.tab_live') },
          { key: 'history', label: t('interview.history.tab') },
        ]}
        activeKey={
          currentStep === 0
            ? 'setup'
            : currentStep === 1
              ? 'interview'
              : 'history'
        }
        onChange={(key) => {
          if (key === 'history') {
            setCurrentStep(2);
            loadHistory();
          } else if (key === 'setup') {
            setCurrentStep(0);
          } else {
            setCurrentStep(1);
          }
        }}
        className="iv-step-tabs"
      />

      {currentStep === 0 && (
        <div className="iv-fade-step">
          <SetupStep
            mode={interviewMode}
            onModeChange={setInterviewMode}
            language={language}
            onLanguageChange={setLanguage}
            resumes={selectableResumes}
            selectedResumeId={selectedResumeId}
            onSelectResume={handleSelectResume}
            optimizations={visibleOptimizations}
            optimizationsLoading={optimizationsLoading}
            selectedOptimizationId={selectedOptimizationId}
            onSelectOptimization={handleSelectOptimization}
            personas={personas}
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={setSelectedPersonaId}
            onStart={handleStart}
            starting={loading}
          />
        </div>
      )}

      {currentStep === 1 && (
        <div className="iv-two-col iv-fade-step">
          <div>
            <GlassCard padding="lg">
              <div
                className="iv-row-between iv-live-header"
                style={{ marginBottom: '1rem' }}
              >
                <div className="iv-row">
                  <div
                    className={`iv-mode-icon iv-mode-icon--${interviewMode}`}
                    style={{ width: 36, height: 36 }}
                  >
                    {interviewMode === 'assist' ? (
                      <IconHeadphones size={18} />
                    ) : (
                      <IconTarget size={18} />
                    )}
                  </div>
                  <Title level={4} style={{ margin: 0 }}>
                    {interviewMode === 'assist'
                      ? t('interview.live.assist_title')
                      : t('interview.live.mock_title')}
                  </Title>
                </div>
                <Badge
                  variant={interviewMode === 'mock' ? 'primary' : 'default'}
                >
                  {interviewMode === 'assist'
                    ? t('interview.live.badge_assist')
                    : t('interview.live.badge_mock')}
                </Badge>
              </div>

              {interviewMode === 'mock' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    className="iv-row-between"
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>
                      {t('interview.live.question_progress', {
                        current: Math.min(
                          currentIndex + 1,
                          totalQuestions || 1
                        ),
                        total: totalQuestions || '-',
                      })}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="iv-progress">
                    <div
                      className="iv-progress-bar"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div style={{ minHeight: 300 }}>
                {loading ? (
                  <div
                    className="iv-loading-block"
                    style={{ padding: '3rem 0' }}
                  >
                    <div className="iv-spinner" />{' '}
                    {t('interview.live.preparing')}
                  </div>
                ) : interviewMode === 'assist' ? (
                  <AssistModeView
                    session={session}
                    processing={processing}
                    onSendMessage={handleSendMessage}
                  />
                ) : currentQuestion ? (
                  <MockModeView
                    currentQuestion={currentQuestion}
                    answerText={answerText}
                    setAnswerText={setAnswerText}
                    processing={processing}
                    sessionId={session?.id}
                    onSubmitAnswer={handleSubmitAnswer}
                  />
                ) : (
                  <div className="iv-empty" style={{ padding: '3rem 1rem' }}>
                    <IconSparkles size={28} />
                    <span>{t('interview.live.completed_hint')}</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      {t('interview.live.view_history')}
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <GlassCard padding="lg" className="iv-sticky">
            <div className="iv-row-between" style={{ marginBottom: '1rem' }}>
              <Title level={5} style={{ margin: 0 }}>
                {t('interview.live.session_info')}
              </Title>
              <Button
                variant="danger"
                size="sm"
                onClick={endSessionEarly}
                loading={processing}
              >
                {t('interview.live.end_interview')}
              </Button>
            </div>

            {interviewMode === 'mock' && (
              <Button
                variant="secondary"
                onClick={() => setIsVoiceCallActive(true)}
                disabled={loading}
                className="iv-voice-cta w-full"
                style={{ marginBottom: '1rem' }}
              >
                <IconPhone size={15} /> {t('interview.live.voice_cta')}
              </Button>
            )}

            <div className="iv-info-list">
              <div className="iv-info-row">
                <span className="k">{t('interview.live.mode')}</span>
                <span className="v">
                  {interviewMode === 'assist' ? (
                    <IconHeadphones size={13} />
                  ) : (
                    <IconTarget size={13} />
                  )}
                  {interviewMode === 'assist'
                    ? t('interview.mode_assist')
                    : t('interview.mode_mock')}
                </span>
              </div>
              <div className="iv-info-row">
                <span className="k">{t('interview.language_label')}</span>
                <span className="v">
                  <IconGlobe size={13} />
                  {language === 'zh' ? t('interview.language_zh') : 'English'}
                </span>
              </div>
              <div className="iv-info-row">
                <span className="k">{t('interview.live.resume_context')}</span>
                <span className="v">
                  {selectedOptimization
                    ? [
                        selectedResume?.title ||
                          selectedOptimization.resume?.title,
                        selectedOptimization.job?.title,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('interview.live.selected')
                    : selectedResume
                      ? selectedResume.title
                      : t('interview.setup.general_mode')}
                </span>
              </div>
              {interviewMode === 'mock' && (
                <div className="iv-info-row">
                  <span className="k">{t('interview.live.interviewer')}</span>
                  <span className="v">
                    <IconMic size={13} />
                    {personas.find((p) => p.id === selectedPersonaId)?.name ||
                      t('interview.live.default_interviewer')}
                  </span>
                </div>
              )}
            </div>
            <div className="iv-tip" style={{ marginTop: '0.75rem' }}>
              <IconClock size={15} />
              <span>
                {interviewMode === 'assist'
                  ? t('interview.live.assist_tip')
                  : t('interview.live.mock_tip')}
              </span>
            </div>
          </GlassCard>
        </div>
      )}

      {currentStep === 2 && (
        <div className="iv-fade-step">
          <HistoryList
            history={history}
            loading={historyLoading}
            onRefresh={loadHistory}
            onViewReport={(id) => setReportSessionId(id)}
            onResume={handleResumeFromHistory}
          />
        </div>
      )}

      {isVoiceCallActive && session && (
        <Modal
          open={isVoiceCallActive}
          onClose={() => handleVoiceCallClose()}
          title={t('interview.call.modal_title')}
          width={640}
          footer={null}
        >
          <VoiceInterviewCall
            sessionId={session.id}
            mode="mock"
            currentQuestionText={currentQuestion?.question}
            onCompleted={() => session && handleCompletion(session.id)}
            onClose={() => handleVoiceCallClose()}
          />
        </Modal>
      )}

      <InterviewReportModal
        open={!!reportSessionId}
        sessionId={reportSessionId}
        onClose={() => {
          setReportSessionId(null);
          resetSessionState();
          setCurrentStep(2);
          loadHistory();
        }}
      />
    </div>
  );
};

export default InterviewPage;
