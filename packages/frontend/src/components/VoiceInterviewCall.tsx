import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Space, Typography, Card, Badge, Tooltip } from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  PhoneOutlined,
  LoadingOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterviewSocket } from '../hooks/useInterviewSocket';

const { Title, Text } = Typography;

interface VoiceInterviewCallProps {
  sessionId: string;
  onClose: () => void;
  voiceId?: string;
}

const VoiceInterviewCall: React.FC<VoiceInterviewCallProps> = ({
  sessionId,
  onClose,
  voiceId,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'
  >('idle');
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [networkLatency, setNetworkLatency] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { isConnected, joinInterview, endAudio } = useInterviewSocket({
    onConnected: () => {
      setStatus('connecting');
      joinInterview(sessionId);
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
    onError: (err) => {
      console.error('Socket error:', err.message);
    },
  });

  useEffect(() => {
    if (isConnected && status === 'connecting') {
      startCall();
    }
  }, [isConnected, status]);

  useEffect(() => {
    if (isCalling) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
        // Simulate network latency check
        setNetworkLatency(Math.floor(Math.random() * 50) + 20);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCalling]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsCalling(true);
      setStatus('listening');

      // Set up Audio Context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setUserVolume(average);
        if (isCalling) requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // MediaRecorder for sending audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        audioChunksRef.current = [];
        setStatus('thinking');
        endAudio(sessionId, audioBlob);
      };

      // Start capturing chunks
      mediaRecorder.start(1000); // chunk every second
    } catch (err) {
      console.error('Failed to start call:', err);
      setStatus('idle');
    }
  };

  const stopCall = () => {
    setIsCalling(false);
    setStatus('idle');
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop());
    audioContextRef.current?.close();
    onClose();
  };

  const playAiAudio = (audioBuffer: ArrayBuffer) => {
    setStatus('speaking');
    const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Visualization for AI audio
    const aiCtx = new AudioContext();
    const source = aiCtx.createMediaElementSource(audio);
    const aiAnalyser = aiCtx.createAnalyser();
    source.connect(aiAnalyser);
    aiAnalyser.connect(aiCtx.destination);

    const dataArray = new Uint8Array(aiAnalyser.frequencyBinCount);
    const updateAiVolume = () => {
      aiAnalyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAiVolume(average);
      if (!audio.paused) requestAnimationFrame(updateAiVolume);
    };

    audio.onplay = () => updateAiVolume();
    audio.onended = () => {
      setStatus('listening');
      setAiVolume(0);
      aiCtx.close();
      // Resume user recording if needed or wait for user to speak
      if (mediaRecorderRef.current?.state === 'inactive') {
        mediaRecorderRef.current.start(1000);
      }
    };
    audio.play();
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      style={{
        background: '#141414',
        borderRadius: 24,
        border: '1px solid #303030',
        overflow: 'hidden',
        position: 'relative',
        height: 500,
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
      {/* Top Header */}
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
          <Badge status={isConnected ? 'success' : 'error'} />
          <Text style={{ color: '#8c8c8c' }}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </Space>
        <Tooltip title={`Latency: ${networkLatency}ms`}>
          <Space
            style={{ color: networkLatency > 100 ? '#faad14' : '#52c41a' }}
          >
            <WifiOutlined />
            <Text style={{ color: 'inherit', fontSize: 12 }}>
              {networkLatency}ms
            </Text>
          </Space>
        </Tooltip>
      </div>

      {/* Main Visualization Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* AI Voice Visualizer */}
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
          </AnimatePresence>
        </div>

        {/* User Voice Visualizer */}
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

      {/* Footer Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Title level={4} style={{ color: 'white', margin: 0 }}>
          {formatDuration(callDuration)}
        </Title>
        <Space size={32}>
          <Button
            shape="circle"
            size="large"
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => setIsMuted(!isMuted)}
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
      </div>
    </Card>
  );
};

export default VoiceInterviewCall;
