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
} from 'antd';
import { AudioOutlined, StopOutlined, SendOutlined } from '@ant-design/icons';
import { interviewService } from '../services/interview-service';
import { InterviewQuestion, InterviewSession } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const InterviewPage: React.FC = () => {
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

  // Structured Interview State
  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerText, setAnswerText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (optimizationId) {
      initializeSession();
    }
  }, [optimizationId]);

  const initializeSession = async () => {
    try {
      setLoading(true);

      // Try to get active session
      const activeSession = await interviewService.getActiveSession(
        optimizationId!
      );

      if (activeSession) {
        setSession(activeSession);
        // Restore state
        const state = await interviewService.getCurrentState(activeSession.id);
        if (state.isCompleted || state.status === 'COMPLETED') {
          handleCompletion(activeSession.id);
        } else {
          setCurrentIndex(state.currentIndex || 0);
          setTotalQuestions(state.totalQuestions || 0);
          setCurrentQuestion(state.currentQuestion || null);
        }
      } else {
        // Start new session
        const result = await interviewService.startSession(optimizationId!);
        setSession(result.session);
        setCurrentQuestion(result.firstQuestion);
        // We need to know total questions. The startSession response might need update or we fetch it.
        // For now, let's assume 10 or fetch from state.
        // Let's fetch state to be sure or update startSession return type.
        // Efficient way: startSession returns firstQuestion. We can assume index 0.
        // To get total, we might need to fetch state or questions list.
        // Let's call getCurrentState immediately to sync totals.
        const state = await interviewService.getCurrentState(result.session.id);
        setTotalQuestions(state.totalQuestions || 10);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      message.error('Failed to start interview');
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
      message.error('Microphone access denied');
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
      message.warning('Please provide an answer (text or audio)');
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
        answerText || '[Audio Answer]',
        audioUrl
      );

      setAnswerText(''); // Clear input

      if (result.isCompleted) {
        handleCompletion(session.id);
      } else if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setCurrentIndex((prev) => prev + 1);
        message.success('Answer submitted! Next question...');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      message.error('Failed to submit answer');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletion = (sessionId: string) => {
    message.success('Interview completed! Generating feedback...');
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
            content: updatedSession.feedback || 'No feedback generated.',
          });
          setFeedbackModalVisible(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          message.warning(
            'Feedback generation is taking longer than expected. Check "My Interviews" later.'
          );
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
      title: 'End Interview?',
      content:
        'Are you sure you want to end the interview early? You will receive feedback on answered questions.',
      onOk: async () => {
        try {
          await interviewService.endSession(session.id);
          handleCompletion(session.id);
        } catch (error) {
          message.error('Failed to end session');
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
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
              Mock Interview
            </Title>
            <Text type="secondary">
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
          </div>
        }
        extra={
          <Button danger onClick={endSessionEarly}>
            End Early
          </Button>
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
                      Tips:
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

              <Divider>Your Answer</Divider>

              <TextArea
                rows={6}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here or record audio..."
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
                    Submit Answer
                  </Button>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    {recording
                      ? 'Recording... Tap to stop'
                      : 'Record audio or type answer'}
                  </Text>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Session Completed or Error Loading Question</Text>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="Interview Feedback"
        open={feedbackModalVisible}
        onOk={() => navigate('/dashboard')}
        onCancel={() => navigate('/dashboard')}
        width={800}
      >
        {feedbackData && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4}>Score: {feedbackData.score}/100</Title>
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
