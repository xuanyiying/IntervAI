import {
  AudioMutedOutlined,
  AudioOutlined,
  LoadingOutlined,
  PhoneOutlined,
  ReloadOutlined,
  RobotOutlined,
  SoundOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  message,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInterviewSocket } from '../hooks/useInterviewSocket';

const { Title, Text } = Typography;

interface VoiceInterviewCallProps {
  sessionId: string;
  onClose: () => void;
  voiceId?: string;
}

const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
};

const SILENCE_THRESHOLD = 15;
const SILENCE_DURATION_MS = 1500;
const MIN_QUESTION_LENGTH = 3;

const VoiceInterviewCall: React.FC<VoiceInterviewCallProps> = ({
  sessionId,
  onClose,
  voiceId,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [status, setStatus] = useState<
    | 'idle'
    | 'connecting'
    | 'listening'
    | 'thinking'
    | 'speaking'
    | 'reconnecting'
  >('idle');
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [audioContextUnlocked, setAudioContextUnlocked] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [browserInfo, setBrowserInfo] = useState<string>('');
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [detectedQuestion, setDetectedQuestion] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const currentAudioMimeType = useRef<string>('');
  const aiAudioContextRef = useRef<AudioContext | null>(null);

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSilentRef = useRef<boolean>(false);
  const questionBufferRef = useRef<Blob[]>([]);
  const volumeDataRef = useRef<Uint8Array>(new Uint8Array(0));

  const {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    latency,
    joinSession,
    endAudio,
    sendQuestionDetected,
    reconnect,
  } = useInterviewSocket({
    mode: 'assist',
    onConnected: () => {
      setStatus('connecting');
      joinSession(sessionId, voiceId);
    },
    onAiAudio: (data) => {
      playAiAudio(data.audio);
    },
    onTranscription: (data) => {
      console.log('User said:', data.text);
    },
    onAiResponse: (data) => {
      console.log('AI said:', data.text);
    },
    onReconnecting: (_attempt) => {
      setStatus('reconnecting');
    },
    onReconnected: () => {
      setStatus('listening');
      startRecordingAfterPause();
    },
    onError: (err) => {
      console.error('Socket error:', err.message);
      message.error(err.message);
    },
    onQuestionDetected: (data) => {
      setDetectedQuestion(data.text);
      if (data.isQuestion && data.text.trim().length >= MIN_QUESTION_LENGTH) {
        message.info({
          content: `检测到问题: ${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}`,
          duration: 3,
        });
      }
    },
    onGeneratingAnswer: () => {
      setStatus('thinking');
    },
  });

  useEffect(() => {
    const checkBrowserSupport = () => {
      const hasMediaDevices = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasAudioContext =
        typeof AudioContext !== 'undefined' ||
        typeof (window as any).webkitAudioContext !== 'undefined';

      const ua = navigator.userAgent;
      let browser = 'Unknown';
      if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
      } else if (ua.includes('Chrome')) {
        browser = 'Chrome';
      } else if (ua.includes('Firefox')) {
        browser = 'Firefox';
      } else if (ua.includes('Edge')) {
        browser = 'Edge';
      }

      setBrowserInfo(browser);
      setBrowserSupported(
        hasMediaDevices && hasMediaRecorder && hasAudioContext
      );

      if (!hasMediaDevices || !hasMediaRecorder) {
        message.error(
          'Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.'
        );
      }
    };

    checkBrowserSupport();
  }, []);

  useEffect(() => {
    if (isConnected && status === 'connecting') {
      startCall();
    }
  }, [isConnected, status]);

  useEffect(() => {
    if (isCalling) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCalling]);

  const checkSilence = useCallback(() => {
    if (!analyserRef.current || !autoDetectMode || status !== 'listening')
      return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    volumeDataRef.current = dataArray;

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setUserVolume(average);

    if (average < SILENCE_THRESHOLD) {
      if (!isSilentRef.current) {
        isSilentRef.current = true;
        silenceTimerRef.current = setTimeout(() => {
          onSilenceDetected();
        }, SILENCE_DURATION_MS);
      }
    } else {
      isSilentRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    if (isCalling && status === 'listening') {
      requestAnimationFrame(checkSilence);
    }
  }, [autoDetectMode, status, isCalling]);

  const onSilenceDetected = useCallback(() => {
    if (!autoDetectMode || questionBufferRef.current.length === 0) return;

    const audioBlob = new Blob(questionBufferRef.current, {
      type: currentAudioMimeType.current,
    });

    if (audioBlob.size < 1000) {
      questionBufferRef.current = [];
      return;
    }

    setStatus('thinking');

    sendQuestionDetected(sessionId, audioBlob);

    questionBufferRef.current = [];

    setTimeout(() => {
      if (status === 'thinking' || status === 'speaking') {
        startRecordingAfterPause();
      }
    }, 500);
  }, [autoDetectMode, sessionId, sendQuestionDetected, status]);

  const startRecordingAfterPause = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused' &&
      streamRef.current
    ) {
      try {
        mediaRecorderRef.current.resume();
        setStatus('listening');
        requestAnimationFrame(checkSilence);
      } catch (e) {
        console.warn('Failed to resume recording:', e);
      }
    } else if (
      mediaRecorderRef.current?.state === 'inactive' &&
      streamRef.current
    ) {
      try {
        mediaRecorderRef.current.start(1000);
        setStatus('listening');
        requestAnimationFrame(checkSilence);
      } catch (e) {
        console.warn('Failed to restart recording:', e);
      }
    }
  }, [checkSilence]);

  const unlockAudioContext = useCallback(async () => {
    if (audioContextUnlocked) return true;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      audioContextRef.current = ctx;
      setAudioContextUnlocked(true);
      return true;
    } catch (error) {
      console.error('Failed to unlock audio context:', error);
      return false;
    }
  }, [audioContextUnlocked]);

  const startCall = async () => {
    if (!browserSupported) {
      message.error('Browser not supported');
      return;
    }

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
      setIsCalling(true);
      setStatus('listening');

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        let source: MediaStreamAudioSourceNode | undefined;
        try {
          source = audioContextRef.current.createMediaStreamSource(stream);
        } catch (e) {
          console.warn('createMediaStreamSource failed, using fallback:', e);
          setIsCalling(true);
          setStatus('listening');
        }

        if (source) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);

          if (autoDetectMode) {
            requestAnimationFrame(checkSilence);
          } else {
            const dataArray = new Uint8Array(
              analyserRef.current.frequencyBinCount
            );
            const updateVolume = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              const average =
                dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              setUserVolume(average);
              if (isCalling) requestAnimationFrame(updateVolume);
            };
            updateVolume();
          }
        }
      }

      currentAudioMimeType.current = getSupportedMimeType();
      console.log('Using audio format:', currentAudioMimeType.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: currentAudioMimeType.current,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);

          if (autoDetectMode) {
            questionBufferRef.current.push(e.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: currentAudioMimeType.current,
        });
        audioChunksRef.current = [];
        questionBufferRef.current = [];
        setStatus('thinking');

        if (!autoDetectMode) {
          endAudio(sessionId, audioBlob);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        message.error('Recording error occurred');
      };

      mediaRecorder.start(1000);
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setStatus('idle');

      if (err.name === 'NotAllowedError') {
        message.error(
          'Microphone access denied. Please allow microphone access and try again.'
        );
      } else if (err.name === 'NotFoundError') {
        message.error(
          'No microphone found. Please connect a microphone and try again.'
        );
      } else if (err.name === 'NotReadableError') {
        message.error('Microphone is being used by another application.');
      } else if (err.name === 'OverconstrainedError') {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = fallbackStream;
        setIsCalling(true);
        setStatus('listening');
      } else {
        message.error('Failed to start voice call. Please try again.');
      }
    }
  };

  const stopCall = () => {
    setIsCalling(false);
    setStatus('idle');
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();
    aiAudioContextRef.current?.close();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    onClose();
  };

  const playAiAudio = async (audioBuffer: ArrayBuffer) => {
    try {
      setStatus('speaking');

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
      }

      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const aiCtx = new AudioContextClass();
      aiAudioContextRef.current = aiCtx;

      if (aiCtx.state === 'suspended') {
        await aiCtx.resume();
      }

      let useAnalyser = true;
      let source: AudioNode | undefined;
      let aiAnalyser: AnalyserNode | null = null;

      try {
        source = aiCtx.createMediaElementSource(audio);
        aiAnalyser = aiCtx.createAnalyser();
        source.connect(aiAnalyser);
        aiAnalyser.connect(aiCtx.destination);
      } catch (e) {
        useAnalyser = false;
        console.warn(
          'createMediaElementSource not supported, using direct playback:',
          e
        );
      }

      if (useAnalyser && aiAnalyser) {
        const dataArray = new Uint8Array(aiAnalyser.frequencyBinCount);
        const updateAiVolume = () => {
          aiAnalyser!.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAiVolume(average);
          if (!audio.paused) requestAnimationFrame(updateAiVolume);
        };

        audio.onplay = () => updateAiVolume();
      }

      audio.onended = () => {
        setStatus('listening');
        setAiVolume(0);
        aiCtx.close();
        URL.revokeObjectURL(url);

        if (mediaRecorderRef.current?.state === 'paused') {
          mediaRecorderRef.current.resume();
          if (autoDetectMode) {
            requestAnimationFrame(checkSilence);
          }
        } else if (mediaRecorderRef.current?.state === 'inactive') {
          mediaRecorderRef.current.start(1000);
          if (autoDetectMode) {
            requestAnimationFrame(checkSilence);
          }
        }
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setStatus('listening');
        aiCtx.close();
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play AI audio:', error);
      setStatus('listening');
    }
  };

  const handleReconnect = () => {
    reconnect();
    setStatus('connecting');
  };

  const toggleAutoDetect = (checked: boolean) => {
    setAutoDetectMode(checked);
    if (checked && status === 'listening' && analyserRef.current) {
      requestAnimationFrame(checkSilence);
    }
    message.success(checked ? '已开启自动检测模式' : '已切换为手动模式');
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLatencyColor = () => {
    if (latency < 100) return '#52c41a';
    if (latency < 200) return '#faad14';
    return '#f5222d';
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return autoDetectMode ? 'Listening (Auto)' : 'Listening...';
      case 'thinking':
        return 'Processing...';
      case 'speaking':
        return 'AI Speaking';
      case 'reconnecting':
        return `Reconnecting (${reconnectAttempt}/5)...`;
      default:
        return 'Unknown';
    }
  };

  return (
    <Card
      style={{
        background: '#141414',
        borderRadius: 24,
        border: '1px solid #303030',
        overflow: 'hidden',
        position: 'relative',
        height: 580,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      bodyStyle={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 40,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Badge
            status={
              isReconnecting ? 'warning' : isConnected ? 'success' : 'error'
            }
          />
          <Text style={{ color: '#8c8c8c' }}>{getStatusText()}</Text>
          {autoDetectMode && status === 'listening' && (
            <Tag icon={<RobotOutlined />} color="blue">
              Auto-Detect
            </Tag>
          )}
        </Space>
        <Space>
          {browserInfo && (
            <Text style={{ color: '#595959', fontSize: 12 }}>
              {browserInfo}
            </Text>
          )}
          <Tooltip title={`Latency: ${latency}ms`}>
            <Space style={{ color: getLatencyColor() }}>
              <WifiOutlined />
              <Text style={{ color: 'inherit', fontSize: 12 }}>
                {latency}ms
              </Text>
            </Space>
          </Tooltip>
        </Space>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{
              scale: status === 'speaking' ? [1, 1.2, 1] : 1,
              opacity: status === 'speaking' ? 1 : 0.5,
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              boxShadow: `0 0 ${aiVolume}px rgba(24, 144, 255, 0.5)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <PhoneOutlined style={{ fontSize: 40, color: 'white' }} />
          </motion.div>
          <AnimatePresence>
            {status === 'thinking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  bottom: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <Space style={{ color: '#1890ff' }}>
                  <LoadingOutlined />
                  <Text style={{ color: '#1890ff' }}>Thinking...</Text>
                </Space>
              </motion.div>
            )}
            {status === 'reconnecting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  bottom: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
              >
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={handleReconnect}
                  size="small"
                >
                  Retry Now
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {detectedQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: 400,
              padding: '12px 16px',
              background: 'rgba(24, 144, 255, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(24, 144, 255, 0.3)',
            }}
          >
            <Space>
              <SoundOutlined style={{ color: '#1890ff' }} />
              <Text style={{ color: '#d9d9d9', fontSize: 13 }}>
                {detectedQuestion.length > 80
                  ? detectedQuestion.substring(0, 80) + '...'
                  : detectedQuestion}
              </Text>
            </Space>
          </motion.div>
        )}

        <div
          style={{ display: 'flex', gap: 4, alignItems: 'center', height: 40 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isMuted
                  ? 4
                  : Math.max(4, userVolume * Math.random() * 2),
              }}
              style={{
                width: 4,
                background: isMuted ? '#434343' : '#52c41a',
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Title level={4} style={{ color: 'white', margin: 0 }}>
          {formatDuration(callDuration)}
        </Title>

        <Space size={8}>
          <Space size={4} style={{ marginRight: 16 }}>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Auto</Text>
            <Switch
              size="small"
              checked={autoDetectMode}
              onChange={toggleAutoDetect}
              disabled={!isCalling}
            />
          </Space>

          <Space size={32}>
            <Button
              shape="circle"
              size="large"
              icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={() => setIsMuted(!isMuted)}
              disabled={!isCalling}
              style={{
                width: 64,
                height: 64,
                background: isMuted ? '#ff4d4f' : '#303030',
                border: 'none',
                color: 'white',
              }}
            />
            <Button
              shape="circle"
              size="large"
              danger
              type="primary"
              icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
              onClick={stopCall}
              style={{ width: 80, height: 80 }}
            />
          </Space>
        </Space>
      </div>

      {!browserSupported && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            padding: 12,
            background: '#ff4d4f',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>
            Your browser may not fully support voice features. Please use
            Chrome, Firefox, or Safari for the best experience.
          </Text>
        </div>
      )}
    </Card>
  );
};

export default VoiceInterviewCall;
