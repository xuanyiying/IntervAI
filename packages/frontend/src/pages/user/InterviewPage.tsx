import StreamingMarkdownBubble from '@/components/StreamingMarkdownBubble';
import { useInterviewSocket } from '@/hooks/useInterviewSocket';
import '@/styles/agents.css';
import '@/styles/common.css';
import { InterviewQuestion, InterviewSession } from '@/types';
import {
  AudioOutlined,
  BulbOutlined,
  MessageOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Divider,
  Input,
  message,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PersonaSelector } from '../../components/PersonaSelector';
import VoiceInterviewCall from '../../components/VoiceInterviewCall';
import VoiceManager from '../../components/VoiceManager';
import axios from '../../config/axios';
import {
  InterviewerPersona,
  interviewService,
} from '../../services/interview-service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 面试模式类型
type InterviewMode = 'mock' | 'assist';
// 语言类型
type InterviewLanguage = 'zh' | 'en';

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
  const [selectedPersonaId, setSelectedPersonaId] = useState<
    string | undefined
  >();
  const [currentStep, setCurrentStep] = useState(0);
  const [resolvedOptimizationId, setResolvedOptimizationId] = useState<
    string | null
  >(null);

  // 新增：面试模式和语言选择
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

      let effectiveOptimizationId =
        optimizationId || resolvedOptimizationId || undefined;

      if (!effectiveOptimizationId) {
        if (interviewMode === 'assist') {
          try {
            const { data: optimizations } =
              await axios.get<any[]>('/optimizations');
            if (optimizations && optimizations.length > 0) {
              effectiveOptimizationId = optimizations[0].id;
              setResolvedOptimizationId(optimizations[0].id);
            }
          } catch (e) {
            console.warn('Could not fetch optimizations, starting without one');
          }
        }

        if (!effectiveOptimizationId && interviewMode === 'mock') {
          message.warning(
            t('interview.optimization_required', '模拟面试需要先进行简历优化')
          );
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

  // 辅助面试模式：发送问题，获取参考答案
  const handleSendMessage = async (question: string) => {
    if (!session || !question.trim()) {
      return;
    }

    try {
      setProcessing(true);
      await interviewService.sendMessage(session.id, question);
      // AI 返回的参考答案已经包含在消息中
      // 可以选择刷新会话状态显示新消息
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error(t('interview.send_failed'));
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
            {t('interview.setup_title', '面试设置')}
          </Title>

          {/* 面试模式选择 */}
          <div className="mb-6">
            <Text strong className="mb-2" style={{ display: 'block' }}>
              {t('interview.mode_label', '面试模式')}
            </Text>
            <Radio.Group
              value={interviewMode}
              onChange={(e) => setInterviewMode(e.target.value)}
              className="w-full"
            >
              <Radio.Button value="assist" className="w-1/2 text-center py-3">
                <MessageOutlined className="mr-2" />
                {t('interview.mode_assist', '辅助面试')}
                <div className="text-xs text-gray-500 mt-1">
                  {t('interview.mode_assist_desc', '实时获取参考答案')}
                </div>
              </Radio.Button>
              <Radio.Button value="mock" className="w-1/2 text-center py-3">
                <QuestionCircleOutlined className="mr-2" />
                {t('interview.mode_mock', '模拟面试')}
                <div className="text-xs text-gray-500 mt-1">
                  {t('interview.mode_mock_desc', 'AI 提问你回答')}
                </div>
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* 语言选择 */}
          <div className="mb-6">
            <Text strong className="mb-2" style={{ display: 'block' }}>
              {t('interview.language_label', '答案语言')}
            </Text>
            <Select
              value={language}
              onChange={setLanguage}
              style={{ width: 200 }}
              options={[
                { value: 'zh', label: t('interview.language_zh', '中文') },
                { value: 'en', label: t('interview.language_en', 'English') },
              ]}
            />
          </div>

          <Divider />

          {/* 面试官选择 - 仅在模拟面试模式显示 */}
          {interviewMode === 'mock' && (
            <>
              <Title level={4} className="mb-4">
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
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              type="primary"
              size="large"
              onClick={() => setCurrentStep(1)}
              disabled={interviewMode === 'mock' && !selectedPersonaId}
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
                {interviewMode === 'assist'
                  ? t('interview.assist_title', '面试助手')
                  : t('interview.title')}
              </Title>
              {interviewMode === 'mock' && (
                <Text type="secondary">
                  {t('interview.question_progress', {
                    current: currentIndex + 1,
                    total: totalQuestions,
                  })}
                </Text>
              )}
            </div>
          }
          extra={
            <Space>
              {interviewMode === 'mock' && (
                <Button
                  type="primary"
                  ghost
                  icon={<PhoneOutlined />}
                  onClick={() => setIsVoiceCallActive(true)}
                  disabled={loading}
                >
                  Start Voice Call
                </Button>
              )}
              <Button danger onClick={endSessionEarly}>
                {t('interview.end_early')}
              </Button>
            </Space>
          }
        >
          {interviewMode === 'mock' && (
            <Progress
              percent={Math.round((currentIndex / totalQuestions) * 100)}
              showInfo={false}
            />
          )}

          <div style={{ marginTop: '24px', minHeight: '300px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            ) : interviewMode === 'assist' ? (
              // 辅助面试模式：用户输入问题，AI 生成参考答案
              <AssistModeView
                session={session}
                processing={processing}
                onSendMessage={handleSendMessage}
                t={t}
              />
            ) : currentQuestion ? (
              // 模拟面试模式：显示问题，用户回答
              <MockModeView
                currentQuestion={currentQuestion}
                answerText={answerText}
                setAnswerText={setAnswerText}
                recording={recording}
                processing={processing}
                startRecording={startRecording}
                stopRecording={stopRecording}
                handleSubmitAnswer={() => handleSubmitAnswer()}
                t={t}
              />
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

// 辅助面试模式组件：支持语音输入和流式答案
const AssistModeView: React.FC<{
  session: InterviewSession | null;
  processing: boolean;
  onSendMessage: (question: string) => void;
  t: any;
}> = ({ session, processing, onSendMessage, t }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recording, setRecording] = useState(false);

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
    } catch (error) {
      console.error('Failed to play audio:', error);
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
            role:
              m.role === 'USER' ? ('user' as const) : ('assistant' as const),
            content: m.content,
          }))
      );
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const {
    isConnected,
    isReconnecting,
    latency,
    joinSession,
    sendQuestion,
    endAudio,
  } = useInterviewSocket({
    mode: 'assist',
    onConnected: () => {
      if (session) {
        joinSession(session.id);
      }
    },
    onTranscription: (data) => {
      setQuestion(data.text);
    },
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
      message.error(err.message);
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });

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
        stream.getTracks().forEach((track) => track.stop());
        if (session) {
          endAudio(session.id, audioBlob);
        }
      };

      mediaRecorder.start(1000);
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
      {/* 连接状态指示器 */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Badge
          status={
            isConnected ? 'success' : isReconnecting ? 'warning' : 'default'
          }
        />
        <Text type="secondary">
          {isConnected
            ? t('interview.realtime_connected', '实时连接已建立')
            : isReconnecting
              ? t('interview.reconnecting', '正在重连...')
              : t('interview.connecting', '正在连接...')}
        </Text>
        {isConnected && latency > 0 && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            <WifiOutlined /> {latency}ms
          </Text>
        )}
      </div>

      {/* 消息历史 */}
      {messages.length > 0 && (
        <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
          {messages.map((msg, idx) => (
            <Card
              key={idx}
              size="small"
              style={{
                marginBottom: 8,
                backgroundColor: msg.role === 'user' ? '#f0f5ff' : '#f6ffed',
              }}
            >
              <Text strong>
                {msg.role === 'user' ? '👤 你' : '🤖 AI 参考答案'}
              </Text>
              <div style={{ marginTop: 8 }}>
                <StreamingMarkdownBubble
                  content={msg.content}
                  isStreaming={false}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 流式答案显示 */}
      {streamingAnswer && (
        <Card
          size="small"
          style={{
            marginBottom: 16,
            backgroundColor: '#f6ffed',
            borderLeft: '3px solid #52c41a',
          }}
        >
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            🤖 {t('interview.ai_answer', 'AI 参考答案')}
          </Text>
          <StreamingMarkdownBubble
            content={streamingAnswer}
            isStreaming={isGenerating}
          />
        </Card>
      )}

      {/* 正在生成提示 */}
      {isGenerating && !streamingAnswer && (
        <div style={{ padding: 16, textAlign: 'center', color: '#1890ff' }}>
          <Spin size="small" />{' '}
          {t('interview.generating_answer', '正在生成答案...')}
        </div>
      )}

      {/* 问题输入区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('interview.assist_input_label', '请输入面试官的问题：')}
        </Text>
        <TextArea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t(
            'interview.assist_input_placeholder',
            '例如：请介绍一下你的项目经验'
          )}
          disabled={processing || isGenerating || recording}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Space size="large">
            {!recording ? (
              <Button
                shape="circle"
                icon={<AudioOutlined style={{ fontSize: '24px' }} />}
                size="large"
                style={{ width: '64px', height: '64px' }}
                onClick={startRecording}
                disabled={processing || isGenerating || !isConnected}
                title={t('interview.voice_input', '语音输入')}
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
                title={t('interview.stop_recording', '停止录音')}
              />
            )}

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              disabled={
                recording || processing || isGenerating || !question.trim()
              }
              loading={processing || isGenerating}
            >
              {t('interview.assist_submit', '获取参考答案')}
            </Button>
          </Space>

          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {recording
                ? t('interview.recording_hint_recording', '正在录音...')
                : !isConnected
                  ? t('interview.waiting_connection', '等待连接...')
                  : t(
                      'interview.input_or_voice',
                      '输入问题或点击麦克风语音输入'
                    )}
            </Text>
          </div>
        </div>
      </Card>

      {/* 使用提示 */}
      <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
        <Text type="secondary">
          <BulbOutlined style={{ marginRight: 8 }} />
          {t(
            'interview.assist_hint',
            '提示：在电话面试中，当面试官提问后，快速将问题输入或使用语音输入，系统会实时生成参考答案供你参考。'
          )}
        </Text>
      </Card>

      <div ref={messagesEndRef} />
    </div>
  );
};

// 模拟面试模式组件：显示问题，用户回答
const MockModeView: React.FC<{
  currentQuestion: InterviewQuestion;
  answerText: string;
  setAnswerText: (text: string) => void;
  recording: boolean;
  processing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  handleSubmitAnswer: () => void;
  t: any;
}> = ({
  currentQuestion,
  answerText,
  setAnswerText,
  recording,
  processing,
  startRecording,
  stopRecording,
  handleSubmitAnswer,
  t,
}) => {
  return (
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
            onClick={handleSubmitAnswer}
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
  );
};

export default InterviewPage;
