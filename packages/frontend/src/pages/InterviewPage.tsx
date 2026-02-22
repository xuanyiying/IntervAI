import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Space,
  Spin,
  message,
  Modal,
  Progress,
  Input,
  Divider,
  Steps,
} from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  SendOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { interviewService, InterviewerPersona } from '../services/interview-service';
import { InterviewQuestion, InterviewSession } from '@/types';
import { useTranslation } from 'react-i18next';
import VoiceManager from '../components/VoiceManager';
import VoiceInterviewCall from '../components/VoiceInterviewCall';
import { PersonaSelector } from '../components/PersonaSelector';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const InterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { optimizationId } = useParams<{ optimizationId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    score: number;
    content: string;
  } | null>(null);

  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>();
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);

  const [personas, setPersonas] = useState<InterviewerPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(0);

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
    } catch (error) {
      console.error('Failed to load personas:', error);
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

      const activeSession = await interviewService.getActiveSession(
        optimizationId!
      );

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
          optimizationId!,
          selectedVoiceId,
          selectedPersonaId
        );
        setSession(result.session);
        setCurrentQuestion(result.firstQuestion);
        const state = await interviewService.getCurrentState(result.session.id);
        setTotalQuestions(state.totalQuestions || 10);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      message.error(t('interview.start_failed'));
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        await handleSubmitAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      message.error(t('interview.microphone_denied'));
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
      message.warning(t('interview.answer_required'));
      return;
    }

    try {
      setProcessing(true);
      let audioUrl: string | undefined;

      if (audioBlob) {
        const uploadResult = await interviewService.uploadAudio(audioBlob);
        audioUrl = uploadResult.url;

        // Optional: Transcribe for display or just send URL
        if (!answerText) {
          const transcription =
            await interviewService.transcribeAudio(audioBlob);
          setAnswerText(transcription.text); // Just to show what was heard
        }
      }

      const result = await interviewService.submitAnswer(
        session.id,
        answerText || t('interview.audio_answer'),
        audioUrl
      );

      setAnswerText(''); // Clear input

      if (result.isCompleted) {
        handleCompletion(session.id);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCurrentIndex((prev) => prev + 1);
        message.success(t('interview.answer_submitted_next'));
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      message.error(t('interview.submit_failed'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletion = (sessionId: string) => {
    message.success(t('interview.completed_generating_feedback'));
    pollFeedback(sessionId);
  };

  const pollFeedback = (sessionId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes (since queue might take time)
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const updatedSession = await interviewService.getSession(sessionId);
        if (
          updatedSession.status === 'EVALUATED' || // Check for EVALUATED status from new logic
          (updatedSession.status === 'COMPLETED' && updatedSession.feedback) // Fallback
        ) {
          clearInterval(pollInterval);
          setFeedbackData({
            score: updatedSession.score || 0,
            content: updatedSession.feedback || t('interview.no_feedback'),
          });
          setFeedbackModalVisible(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          message.warning(t('interview.feedback_slow'));
          navigate('/dashboard');
        }
      } catch (e) {
        clearInterval(pollInterval);
      }
    }, 2000);
  };

  const endSessionEarly = async () => {
    if (!session) return;
    Modal.confirm({
      title: t('interview.end_confirm_title'),
      content: t('interview.end_confirm_content'),
      onOk: async () => {
        try {
          await interviewService.endSession(session.id);
          handleCompletion(session.id);
        } catch (error) {
          message.error(t('interview.end_failed'));
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Steps
        current={currentStep}
        className="mb-8"
        items={[
          {
            title: t('interview.select_persona', '选择面试官'),
            icon: <UserOutlined />,
          },
          {
            title: t('interview.interview', '面试进行中'),
            icon: <PhoneOutlined />,
          },
        ]}
      />

      {currentStep === 0 && (
        <Card className="mb-6">
          <Title level={3} className="mb-4">
            {t('interview.choose_interviewer', '选择你的面试官')}
          </Title>
          <Paragraph className="mb-6">
            {t(
              'interview.persona_description',
              '不同的面试官有不同的风格和侧重点，选择最适合你的面试官来提升面试体验。'
            )}
          </Paragraph>
          <PersonaSelector
            personas={personas}
            selectedPersonaId={selectedPersonaId}
            onSelect={setSelectedPersonaId}
          />
          <div className="mt-6 flex justify-end">
            <Button
              type="primary"
              size="large"
              onClick={() => setCurrentStep(1)}
              disabled={!selectedPersonaId}
            >
              {t('interview.start_interview', '开始面试')}
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 1 && (
        <Card
          title={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                {t('interview.title')}
              </Title>
              <Text type="secondary">
                {t('interview.question_progress', {
                  current: currentIndex + 1,
                  total: totalQuestions,
                })}
              </Text>
            </div>
          }
          extra={
            <Space>
              <Button
                type="primary"
                ghost
                icon={<PhoneOutlined />}
                onClick={() => setIsVoiceCallActive(true)}
                disabled={loading}
              >
                Start Voice Call
              </Button>
              <Button danger onClick={endSessionEarly}>
                {t('interview.end_early')}
              </Button>
            </Space>
          }
        >
          <Progress
            percent={Math.round((currentIndex / totalQuestions) * 100)}
            showInfo={false}
          />

          <div style={{ marginTop: '24px', minHeight: '300px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : currentQuestion ? (
              <>
                <Card
                  type="inner"
                  title={currentQuestion.questionType}
                  style={{ backgroundColor: '#f9f9f9' }}
                >
                  <Title level={4}>{currentQuestion.question}</Title>
                  {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary" strong>
                        {t('interview.tips')}:
                      </Text>
                      <ul>
                        {currentQuestion.tips.map((tip, idx) => (
                          <li key={idx}>
                            <Text type="secondary">{tip}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>

                <Divider>{t('interview.your_answer')}</Divider>

                <TextArea
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={t('interview.answer_placeholder')}
                  disabled={processing || recording}
                />

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <Space size="large">
                    {!recording ? (
                      <Button
                        shape="circle"
                        icon={<AudioOutlined style={{ fontSize: '24px' }} />}
                        size="large"
                        style={{ width: '64px', height: '64px' }}
                        onClick={startRecording}
                        disabled={processing}
                      />
                    ) : (
                      <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<StopOutlined style={{ fontSize: '24px' }} />}
                        size="large"
                        style={{ width: '64px', height: '64px' }}
                        onClick={stopRecording}
                      />
                    )}

                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={() => handleSubmitAnswer()}
                      disabled={recording || processing || !answerText.trim()}
                      loading={processing}
                    >
                      {t('interview.submit_answer')}
                    </Button>
                  </Space>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      {recording
                        ? t('interview.recording_hint_recording')
                        : t('interview.recording_hint_idle')}
                    </Text>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>{t('interview.session_completed_or_error')}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      <Modal
        title="Voice Interview Settings"
        open={isVoiceCallActive && !session}
        onCancel={() => setIsVoiceCallActive(false)}
        footer={null}
        width={800}
      >
        <VoiceManager
          onSelect={setSelectedVoiceId}
          selectedVoiceId={selectedVoiceId}
        />
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            onClick={initializeSession}
            disabled={!selectedVoiceId}
          >
            Start Interview with Selected Voice
          </Button>
        </div>
      </Modal>

      <Modal
        open={isVoiceCallActive && !!session}
        footer={null}
        closable={false}
        width={600}
        centered
        styles={{ body: { padding: 0 } }}
      >
        <VoiceInterviewCall
          sessionId={session?.id || ''}
          onClose={() => setIsVoiceCallActive(false)}
          voiceId={selectedVoiceId}
        />
      </Modal>

      <Modal
        title={t('interview.feedback_title')}
        open={feedbackModalVisible}
        onOk={() => navigate('/dashboard')}
        onCancel={() => navigate('/dashboard')}
        width={800}
      >
        {feedbackData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4}>
                {t('interview.score', { score: feedbackData.score })}
              </Title>
              <Progress
                type="circle"
                percent={feedbackData.score}
                strokeColor={
                  feedbackData.score >= 80
                    ? '#52c41a'
                    : feedbackData.score >= 60
                      ? '#faad14'
                      : '#f5222d'
                }
              />
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              <Paragraph>{feedbackData.content}</Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InterviewPage;
