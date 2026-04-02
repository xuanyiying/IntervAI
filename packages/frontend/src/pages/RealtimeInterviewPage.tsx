import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Space,
  Spin,
  message,
  Input,
  Divider,
  Select,
  Form,
  List,
  Badge,
} from 'antd';
import {
  AudioOutlined,
  StopOutlined,
  SendOutlined,
  UserOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  realtimeInterviewService,
  CreateRealtimeSessionDto,
  AnswerStyle,
} from '../services/realtime-interview-service';
import { useRealtimeInterviewSocket } from '../hooks/useRealtimeInterviewSocket';
import { useTranslation } from 'react-i18next';
import type { InterviewSession, InterviewMessage } from '@/types';
import StreamingMarkdownBubble from '../components/StreamingMarkdownBubble';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const RealtimeInterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    joinSession,
    sendAudioChunk,
    endAudio,
    sendQuestion,
  } = useRealtimeInterviewSocket({
    onConnected: () => {
      if (session) {
        joinSession(session.id);
      }
    },
    onTranscription: (data) => {
      setCurrentQuestion(data.text);
    },
    onGeneratingAnswer: () => {
      setIsGenerating(true);
      setStreamingAnswer('');
    },
    onAnswerChunk: (data) => {
      setStreamingAnswer((prev) => prev + data.chunk);
    },
    onAnswerComplete: (data) => {
      setIsGenerating(false);
      setStreamingAnswer('');
      refreshSession();
    },
    onAnswerAudio: async (data) => {
      await playAudio(data.audio);
    },
    onError: (err) => {
      message.error(err.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingAnswer]);

  const refreshSession = async () => {
    if (!session) return;
    try {
      const data = await realtimeInterviewService.getSession(session.id);
      setMessages(data.messages.filter((m) => m.role !== 'SYSTEM'));
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  const createSession = async (values: CreateRealtimeSessionDto) => {
    setLoading(true);
    try {
      const newSession = await realtimeInterviewService.createSession(values);
      setSession(newSession);
      setStep(1);
      message.success('Session created successfully!');
    } catch (error) {
      console.error('Failed to create session:', error);
      message.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const unlockAudioContext = async () => {
    if (audioContextUnlocked) return true;
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      setAudioContextUnlocked(true);
      return true;
    } catch (error) {
      console.error('Failed to unlock audio context:', error);
      return false;
    }
  };

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

  const startRecording = async () => {
    try {
      const unlocked = await unlockAudioContext();
      if (!unlocked) {
        message.warning('Please click anywhere to enable audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
        },
      });

      streamRef.current = stream;

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
      message.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!session || !currentQuestion.trim()) {
      message.warning('Please enter a question');
      return;
    }

    try {
      sendQuestion(session.id, currentQuestion);
      setCurrentQuestion('');
    } catch (error) {
      console.error('Failed to send question:', error);
      message.error('Failed to send question');
    }
  };

  if (step === 0) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <Title level={3}>实时面试辅助</Title>
          <Paragraph>
            准备好你的面试，让 AI 帮助你生成最佳回答！
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={createSession}
            initialValues={{ answerStyle: AnswerStyle.PROFESSIONAL }}
          >
            <Form.Item
              name="title"
              label="会话名称"
              rules={[{ required: true, message: '请输入会话名称' }]}
            >
              <Input placeholder="例如：Google 产品经理面试" />
            </Form.Item>

            <Form.Item name="resumeData" label="简历信息">
              <TextArea
                rows={4}
                placeholder="粘贴你的简历内容，或者选择已有简历..."
              />
            </Form.Item>

            <Form.Item name="jobDescription" label="职位描述">
              <TextArea
                rows={4}
                placeholder="粘贴目标职位的描述信息..."
              />
            </Form.Item>

            <Form.Item name="answerStyle" label="回答风格">
              <Select>
                <Option value={AnswerStyle.CONCISE}>简洁</Option>
                <Option value={AnswerStyle.DETAILED}>详细</Option>
                <Option value={AnswerStyle.PROFESSIONAL}>专业</Option>
                <Option value={AnswerStyle.CASUAL}>轻松</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" size="large" htmlType="submit" loading={loading} block>
                开始实时辅助
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <BulbOutlined />
            <span>实时面试辅助</span>
            <Badge
              status={isConnected ? 'success' : 'default'}
              text={isConnected ? '已连接' : '连接中...'}
            />
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => setStep(0)}>返回配置</Button>
            <Button danger onClick={() => navigate('/')}>
              退出
            </Button>
          </Space>
        }
      >
        <div
          style={{
            height: '500px',
            overflowY: 'auto',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <Paragraph>输入面试官的问题，AI 将为你生成最佳回答！</Paragraph>
            </div>
          ) : (
            <List
              dataSource={messages}
              renderItem={(msg) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <Card
                    size="small"
                    style={{
                      maxWidth: '80%',
                      marginLeft: msg.role === 'USER' ? 'auto' : '0',
                      backgroundColor: msg.role === 'USER' ? '#e6f7ff' : '#fff',
                    }}
                  >
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                      {msg.role === 'USER' ? '面试官' : 'AI 助手'}
                    </Text>
                    <StreamingMarkdownBubble content={msg.content} />
                  </Card>
                </List.Item>
              )}
            />
          )}

          {streamingAnswer && (
            <Card
              size="small"
              style={{
                maxWidth: '80%',
                marginTop: '12px',
                backgroundColor: '#fff',
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                AI 助手
              </Text>
              <StreamingMarkdownBubble content={streamingAnswer} />
            </Card>
          )}

          {isGenerating && !streamingAnswer && (
            <div style={{ padding: '16px', color: '#1890ff' }}>
              <Spin size="small" /> 正在生成答案...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Divider />

        <div>
          <TextArea
            rows={3}
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="输入面试官的问题..."
            disabled={isGenerating || recording}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendQuestion();
              }
            }}
          />

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Space size="large">
              {!recording ? (
                <Button
                  shape="circle"
                  icon={<AudioOutlined style={{ fontSize: '24px' }} />}
                  size="large"
                  style={{ width: '64px', height: '64px' }}
                  onClick={startRecording}
                  disabled={isGenerating}
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
                onClick={handleSendQuestion}
                disabled={recording || isGenerating || !currentQuestion.trim()}
                loading={isGenerating}
              >
                发送问题
              </Button>
            </Space>

            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">
                {recording
                  ? '正在录音...'
                  : isGenerating
                  ? '正在生成答案...'
                  : '输入问题或点击麦克风进行语音输入'}
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RealtimeInterviewPage;
