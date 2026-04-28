import { FeatureGuideCard } from '@/components/FeatureGuideCard/FeatureGuideCard';
import StreamingMarkdownBubble from '@/components/StreamingMarkdownBubble';
import { Badge, Button, GlassCard, Modal, Select, Tabs, Text, TextArea, Title, useToast } from '@/components/ui';
import { useInterviewSocket } from '@/hooks/useInterviewSocket';
import '@/styles/agents.css';
import '@/styles/common.css';
import { InterviewQuestion, InterviewSession } from '@/types';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  InterviewerPersona,
  interviewService,
} from '../../services/interview-service';

type InterviewMode = 'mock' | 'assist';
type InterviewLanguage = 'zh' | 'en';

const IconMicrophone: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconSend: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconStop: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const IconPhone: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconBulb: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);

const IconMessage: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconQuestion: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconWifi: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconPlay: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconSettings: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconRocket: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const IconFile: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const InterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { optimizationId } = useParams<{ optimizationId: string }>();
  const navigate = useNavigate();
  const { success, error: showError, warning } = useToast();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    score: number;
    content: string;
  } | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);

  const [personas, setPersonas] = useState<InterviewerPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(0);
  const [resolvedOptimizationId, setResolvedOptimizationId] = useState<string | null>(null);

  const [interviewMode, setInterviewMode] = useState<InterviewMode>('assist');
  const [language, setLanguage] = useState<InterviewLanguage>('zh');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadPersonas();
  }, []);

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

  useEffect(() => {
    if (optimizationId && currentStep === 1) {
      initializeSession();
    }
  }, [optimizationId, currentStep]);

  const initializeSession = async () => {
    try {
      setLoading(true);

      let effectiveOptimizationId = optimizationId || resolvedOptimizationId || undefined;

      if (!effectiveOptimizationId) {
        if (interviewMode === 'assist') {
          try {
            const { data: optimizations } = await axios.get<any[]>('/optimizations');
            if (optimizations && optimizations.length > 0) {
              effectiveOptimizationId = optimizations[0].id;
              setResolvedOptimizationId(optimizations[0].id);
            }
          } catch (e) {
            console.warn('Could not fetch optimizations, starting without one');
          }
        }

        if (!effectiveOptimizationId && interviewMode === 'mock') {
          warning('模拟面试需要先进行简历优化');
          setCurrentStep(0);
          setLoading(false);
          return;
        }
      }

      const activeSession = effectiveOptimizationId
        ? await interviewService.getActiveSession(effectiveOptimizationId)
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
          effectiveOptimizationId!,
          selectedVoiceId,
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
      showError('面试初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleSubmitAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      showError('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmitAnswer = async (audioBlob?: Blob) => {
    if (!session || (!answerText.trim() && !audioBlob)) {
      warning('请输入回答内容');
      return;
    }

    try {
      setProcessing(true);
      let audioUrl: string | undefined;

      if (audioBlob) {
        const uploadResult = await interviewService.uploadAudio(audioBlob);
        audioUrl = uploadResult.url;

        if (!answerText) {
          const transcription = await interviewService.transcribeAudio(audioBlob);
          setAnswerText(transcription.text);
        }
      }

      const result = await interviewService.submitAnswer(
        session.id,
        answerText || '语音回答',
        audioUrl
      );

      setAnswerText('');

      if (result.isCompleted) {
        handleCompletion(session.id);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCurrentIndex((prev) => prev + 1);
        success('回答已提交，下一题');
      }
    } catch (err) {
      showError('提交失败，请重试');
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
      showError('发送失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletion = (sessionId: string) => {
    success('面试完成，正在生成反馈...');
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
          updatedSession.status === 'EVALUATED' ||
          (updatedSession.status === 'COMPLETED' && updatedSession.feedback)
        ) {
          clearInterval(pollInterval);
          setFeedbackData({
            score: updatedSession.score || 0,
            content: updatedSession.feedback || '暂无反馈',
          });
          setFeedbackModalVisible(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          warning('反馈生成较慢，请稍后在历史记录中查看');
          navigate('/dashboard');
        }
      } catch (e) {
        clearInterval(pollInterval);
      }
    }, 2000);
  };

  const endSessionEarly = async () => {
    if (!session) return;
    if (confirm('确定要提前结束面试吗？')) {
      try {
        await interviewService.endSession(session.id);
        handleCompletion(session.id);
      } catch (err) {
        showError('结束失败，请重试');
      }
    }
  };

  return (
    <div className="interview-page-container">
      <Tabs
        items={[
          { key: 'setup', label: '面试设置' },
          { key: 'interview', label: '面试进行中' },
        ]}
        defaultActiveKey={currentStep === 0 ? 'setup' : 'interview'}
        onChange={(key) => setCurrentStep(key === 'setup' ? 0 : 1)}
        className="mb-6"
      />

      {currentStep === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <GlassCard className="product-hero-banner" padding="lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <IconPlay size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    AI 面试精灵
                  </h2>
                </div>
              </div>
              <p className="text-[var(--text-secondary)]">
                实时获取面试问题的参考答案，让你在面试中更加从容自信。
              </p>
            </GlassCard>

            <div className="space-y-3">
              <FeatureGuideCard
                icon={<IconSettings />}
                title="选择面试模式"
                description="辅助面试模式：实时获取参考答案；模拟面试模式：AI 提问你回答"
              />
              <FeatureGuideCard
                icon={<IconMessage />}
                title="输入问题"
                description="输入面试官的问题或使用语音输入，获取 AI 生成的参考答案"
              />
              <FeatureGuideCard
                icon={<IconRocket />}
                title="开始练习"
                description="在模拟面试中练习，系统会给出实时反馈和改进建议"
              />
              <FeatureGuideCard
                icon={<IconFile />}
                title="获取反馈"
                description="面试结束后获得详细的表现评估报告，明确改进方向"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <GlassCard padding="lg" className="sticky top-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
                配置面试
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                    面试模式
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`p-4 rounded-xl border transition-all ${interviewMode === 'assist'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:border-primary/50'
                        }`}
                      onClick={() => setInterviewMode('assist')}
                    >
                      <IconMessage className="text-xl mb-2 block mx-auto" />
                      <div className="font-medium">辅助面试</div>
                      <div className="text-xs mt-1 opacity-70">实时获取参考答案</div>
                    </button>
                    <button
                      className={`p-4 rounded-xl border transition-all ${interviewMode === 'mock'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:border-primary/50'
                        }`}
                      onClick={() => setInterviewMode('mock')}
                    >
                      <IconQuestion className="text-xl mb-2 block mx-auto" />
                      <div className="font-medium">模拟面试</div>
                      <div className="text-xs mt-1 opacity-70">AI 提问你回答</div>
                    </button>
                  </div>
                </div>

                <Select
                  label="答案语言"
                  value={language}
                  onChange={(val) => setLanguage(val as InterviewLanguage)}
                  options={[
                    { value: 'zh', label: '中文' },
                    { value: 'en', label: 'English' },
                  ]}
                />

                {interviewMode === 'mock' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                      选择面试官
                    </label>
                    <div className="glass-card p-3 text-center text-[var(--text-secondary)]">
                      面试官选择器（待实现）
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setCurrentStep(1)}
                  disabled={interviewMode === 'mock' && !selectedPersonaId}
                >
                  开始面试
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <GlassCard padding="lg" className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4} style={{ margin: 0 }}>
                  {interviewMode === 'assist' ? '面试助手' : '模拟面试'}
                </Title>
                <Badge variant={interviewMode === 'mock' ? 'primary' : 'default'}>
                  {interviewMode === 'assist' ? '辅助模式' : '模拟模式'}
                </Badge>
              </div>

              {interviewMode === 'mock' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-2">
                    <span>问题进度: {currentIndex + 1} / {totalQuestions}</span>
                    <span>{Math.round((currentIndex / totalQuestions) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="min-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
                    recording={recording}
                    processing={processing}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    handleSubmitAnswer={() => handleSubmitAnswer()}
                  />
                ) : (
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    面试已完成或出现错误
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <GlassCard padding="lg" className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <Text strong>会话信息</Text>
                <Button variant="danger" size="sm" onClick={endSessionEarly}>
                  结束面试
                </Button>
              </div>

              {interviewMode === 'mock' && (
                <Button
                  variant="secondary"
                  onClick={() => setIsVoiceCallActive(true)}
                  disabled={loading}
                  className="w-full mb-4"
                >
                  <IconPhone /> 开始语音通话
                </Button>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">模式</span>
                  <span className="text-[var(--text-primary)]">
                    {interviewMode === 'assist' ? '辅助' : '模拟'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">语言</span>
                  <span className="text-[var(--text-primary)]">{language === 'zh' ? '中文' : 'English'}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      <Modal
        open={isVoiceCallActive}
        onClose={() => setIsVoiceCallActive(false)}
        title="语音通话设置"
        width={600}
      >
        <p className="text-[var(--text-secondary)]">语音通话功能（待实现）</p>
        <div className="flex justify-end mt-6">
          <Button variant="primary" onClick={() => setIsVoiceCallActive(false)}>
            关闭
          </Button>
        </div>
      </Modal>

      <Modal
        open={feedbackModalVisible}
        onClose={() => navigate('/dashboard')}
        title="面试反馈"
        width={600}
        footer={
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            确定
          </Button>
        }
      >
        {feedbackData && (
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2" style={{ color: feedbackData.score >= 80 ? 'var(--success-color)' : feedbackData.score >= 60 ? 'var(--warning-color)' : 'var(--danger-color)' }}>
                {feedbackData.score}
              </div>
              <Text type="secondary">综合得分</Text>
            </div>
            <div className="glass-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Text>{feedbackData.content}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const AssistModeView: React.FC<{
  session: InterviewSession | null;
  processing: boolean;
  onSendMessage: (question: string) => void;
}> = ({ session, processing, onSendMessage }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const { success, error: showError } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const playAudio = async (audioBuffer: ArrayBuffer) => {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  const refreshSession = async () => {
    if (!session) return;
    try {
      const data = await interviewService.getSession(session.id);
      const sessionMessages = data.messages ?? [];
      setMessages(
        sessionMessages
          .filter((m) => m.role !== 'SYSTEM')
          .map((m) => ({
            role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }))
      );
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  const { isConnected, isReconnecting, latency, joinSession, sendQuestion, endAudio } = useInterviewSocket({
    mode: 'assist',
    onConnected: () => {
      if (session) joinSession(session.id);
    },
    onTranscription: (data) => setQuestion(data.text),
    onGeneratingAnswer: () => {
      setIsGenerating(true);
      setStreamingAnswer('');
    },
    onAnswerChunk: (data) => {
      setStreamingAnswer((prev) => prev + data.chunk);
    },
    onAnswerComplete: (_data) => {
      setIsGenerating(false);
      setStreamingAnswer('');
      refreshSession();
    },
    onAnswerAudio: async (data) => {
      await playAudio(data.audio);
    },
    onError: (err) => {
      showError(err.message);
      setIsGenerating(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingAnswer]);

  useEffect(() => {
    if (session && isConnected) {
      joinSession(session.id);
    }
  }, [session, isConnected, joinSession]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        if (session) endAudio(session.id, audioBlob);
      };

      mediaRecorder.start(1000);
      setRecording(true);
    } catch (err) {
      showError('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    if (session && isConnected) {
      sendQuestion(session.id, question);
    } else {
      onSendMessage(question);
    }
    setQuestion('');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant={isConnected ? 'success' : isReconnecting ? 'warning' : 'default'}>
          {isConnected ? '实时连接已建立' : isReconnecting ? '正在重连...' : '正在连接...'}
        </Badge>
        {isConnected && latency > 0 && (
          <Badge variant="default">
            <IconWifi /> {latency}ms
          </Badge>
        )}
      </div>

      {messages.length > 0 && (
        <div className="space-y-3 mb-4" style={{ maxHeight: 300, overflowY: 'auto' }}>
          {messages.map((msg, idx) => (
            <GlassCard key={idx} padding="sm" variant={msg.role === 'user' ? 'indigo' : 'default'}>
              <Text strong className="block mb-2">
                {msg.role === 'user' ? '你' : 'AI 参考答案'}
              </Text>
              <StreamingMarkdownBubble content={msg.content} isStreaming={false} />
            </GlassCard>
          ))}
        </div>
      )}

      {streamingAnswer && (
        <GlassCard padding="sm" variant="warm" className="mb-4" style={{ borderLeft: '3px solid var(--warning-color)' }}>
          <Text strong className="block mb-2">AI 参考答案</Text>
          <StreamingMarkdownBubble content={streamingAnswer} isStreaming={isGenerating} />
        </GlassCard>
      )}

      {isGenerating && !streamingAnswer && (
        <div className="text-center py-4 text-[var(--text-secondary)]">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          正在生成答案...
        </div>
      )}

      <GlassCard padding="md" className="mb-4">
        <Text strong className="block mb-3">请输入面试官的问题：</Text>
        <TextArea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：请介绍一下你的项目经验"
          disabled={processing || isGenerating || recording}
        />

        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant={recording ? 'danger' : 'secondary'}
            onClick={recording ? stopRecording : startRecording}
            disabled={processing || isGenerating || !isConnected}
            className="!w-16 !h-16 !rounded-full"
          >
            {recording ? <IconStop size={24} /> : <IconMicrophone size={24} />}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={recording || processing || isGenerating || !question.trim()}
            loading={processing || isGenerating}
          >
            <IconSend /> 获取参考答案
          </Button>
        </div>

        <Text type="secondary" className="block text-center mt-3">
          {recording
            ? '正在录音...'
            : !isConnected
              ? '等待连接...'
              : '输入问题或点击麦克风语音输入'}
        </Text>
      </GlassCard>

      <GlassCard padding="sm" variant="warm">
        <Text type="secondary">
          <IconBulb className="mr-2" />
          提示：在电话面试中，当面试官提问后，快速将问题输入或使用语音输入，系统会实时生成参考答案供你参考。
        </Text>
      </GlassCard>

      <div ref={messagesEndRef} />
    </div>
  );
};

const MockModeView: React.FC<{
  currentQuestion: InterviewQuestion;
  answerText: string;
  setAnswerText: (text: string) => void;
  recording: boolean;
  processing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  handleSubmitAnswer: () => void;
}> = ({ currentQuestion, answerText, setAnswerText, recording, processing, startRecording, stopRecording, handleSubmitAnswer }) => {
  return (
    <>
      <GlassCard padding="md" variant="indigo" className="mb-4">
        <Badge variant="primary" className="mb-3">{currentQuestion.questionType}</Badge>
        <Title level={4} style={{ margin: 0 }}>{currentQuestion.question}</Title>
        {currentQuestion.tips && currentQuestion.tips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
            <Text strong type="secondary" className="block mb-2">答题提示:</Text>
            <ul className="list-disc list-inside text-sm text-[var(--text-secondary)]">
              {currentQuestion.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      <div className="mb-4">
        <Text strong className="block mb-2">你的回答</Text>
        <TextArea
          rows={6}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="请输入你的回答..."
          disabled={processing || recording}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant={recording ? 'danger' : 'secondary'}
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          className="!w-16 !h-16 !rounded-full"
        >
          {recording ? <IconStop size={24} /> : <IconMicrophone size={24} />}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmitAnswer}
          disabled={recording || processing || !answerText.trim()}
          loading={processing}
        >
          <IconSend /> 提交回答
        </Button>
      </div>

      <Text type="secondary" className="block text-center mt-3">
        {recording ? '正在录音...' : '点击麦克风开始录音或直接输入回答'}
      </Text>
    </>
  );
};

export default InterviewPage;