import { Button, Switch, Text, useToast } from '@/components/ui';
import { useInterviewSocket } from '../hooks/useInterviewSocket';
import {
  ASSIST_SAMPLE_RATE,
  PcmStreamPlayer,
  floatTo16BitBase64,
  frameVolume,
} from '../utils/pcm';
import {
  IconBulb,
  IconCheck,
  IconMic,
  IconPhone,
  IconStop,
  IconWifi,
} from '../pages/user/interview/icons';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceInterviewCallProps {
  sessionId: string;
  onClose: () => void;
  voiceId?: string;
  /** 'mock' joins the /interview namespace (AI asks, answers are submitted);
   *  'assist' joins /realtime-interview. Defaults to 'mock'. */
  mode?: 'mock' | 'assist';
  /** Called when the mock interview completes during the call. */
  onCompleted?: () => void;
  /** Current question text, displayed inside the call for mock interviews. */
  currentQuestionText?: string;
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
/** Local loudness (0..1) that counts as the user interrupting the AI. */
const BARGE_IN_VOLUME = 0.45;
/** How long to wait for the realtime engine before falling back to legacy. */
const VOICE_FALLBACK_TIMEOUT_MS = 3000;

type VoiceEngine = 'pending' | 'realtime' | 'legacy';

const VoiceInterviewCall: React.FC<VoiceInterviewCallProps> = ({
  sessionId,
  onClose,
  voiceId,
  mode = 'mock',
  onCompleted,
  currentQuestionText,
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
  const [autoDetectMode, setAutoDetectMode] = useState(mode !== 'mock');
  const [detectedQuestion, setDetectedQuestion] = useState<string>('');
  /** Live Q&A transcript shown inside the call. */
  const [dialog, setDialog] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [partialText, setPartialText] = useState('');
  const dialogScrollRef = useRef<HTMLDivElement>(null);
  const { success, error: showError, info } = useToast();

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

  // ---- realtime voice call engine state ----
  const voiceEngineRef = useRef<VoiceEngine>('legacy');
  const voiceFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pcmPlayerRef = useRef<PcmStreamPlayer | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const aiSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('legacy');

  const applyVoiceEngine = (engine: VoiceEngine) => {
    voiceEngineRef.current = engine;
    setVoiceEngine(engine);
  };

  const clearVoiceFallbackTimer = () => {
    if (voiceFallbackTimerRef.current) {
      clearTimeout(voiceFallbackTimerRef.current);
      voiceFallbackTimerRef.current = null;
    }
  };

  const {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    latency,
    joinSession,
    endAudio,
    sendQuestionDetected,
    startVoiceStream,
    sendVoiceAudio,
    stopVoiceStream,
    reconnect,
  } = useInterviewSocket({
    mode,
    onConnected: () => {
      setStatus('connecting');
      joinSession(sessionId, voiceId);
    },
    onCompleted: () => {
      success('面试完成，正在生成报告...');
      setIsCalling(false);
      onCompleted?.();
      setTimeout(() => onClose(), 1200);
    },
    onAiAudio: (data) => {
      playAiAudio(data.audio);
    },
    onTranscription: (data) => {
      // Mock: final user utterance from `end_audio`. Show it as a bubble.
      if (!data.text || data.final === false) return;
      setPartialText('');
      setDialog((prev) => [...prev.slice(-49), { role: 'user', text: data.text }]);
    },
    onTranscriptionPartial: (data) => {
      setPartialText(data.text);
    },
    onAiResponse: (data) => {
      if (!data.text) return;
      setDialog((prev) => [...prev.slice(-49), { role: 'ai', text: data.text }]);
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
      showError(err.message);
    },
    onQuestionDetected: (data) => {
      setDetectedQuestion(data.text);
      if (data.isQuestion && data.text.trim().length >= MIN_QUESTION_LENGTH) {
        info(
          `检测到问题: ${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}`
        );
      }
    },
    onGeneratingAnswer: () => {
      setStatus('thinking');
    },
    onVoiceStarted: () => {
      if (voiceEngineRef.current === 'realtime') return;
      applyVoiceEngine('realtime');
      clearVoiceFallbackTimer();
      startPcmCapture();
      setStatus('listening');
    },
    onVoiceStopped: () => {
      /* teardown handled in stopCall */
    },
    onVoiceError: () => {
      if (voiceEngineRef.current === 'legacy') return;
      const wasRealtime = voiceEngineRef.current === 'realtime';
      applyVoiceEngine('legacy');
      clearVoiceFallbackTimer();
      if (wasRealtime) {
        stopPcmCapture();
        pcmPlayerRef.current?.dispose();
        pcmPlayerRef.current = null;
        aiSpeakingRef.current = false;
        showError('实时语音连接中断，已切换为标准模式');
      }
      startLegacyRecording();
      setStatus('listening');
    },
    onAiAudioChunk: (data) => {
      playRealtimeChunk(data.audio);
    },
    onAiAudioStop: (data) => {
      stopRealtimePlayback(data.cancelled);
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
      let browser = '未知';
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
        showError('当前浏览器不支持录音，请使用 Chrome、Firefox 或 Safari');
      }
    };

    checkBrowserSupport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected && status === 'connecting') {
      startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Keep the live Q&A dialog pinned to the newest line.
  useEffect(() => {
    const el = dialogScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dialog, partialText]);

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

  // ------------------------------------------------------------------
  // Realtime voice engine (mock call): PCM capture + streaming playback
  // ------------------------------------------------------------------

  /** Extracted legacy MediaRecorder pipeline (assist + mock fallback). */
  const startLegacyRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: currentAudioMimeType.current || getSupportedMimeType(),
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

      mediaRecorder.onstop = () => {
        if (voiceEngineRef.current === 'realtime') return;
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
        showError('录音出错');
      };

      mediaRecorder.start(1000);
    } catch (e) {
      console.warn('MediaRecorder unavailable:', e);
    }
  };

  /** 16 kHz PCM mic capture for the realtime engine (echo-gated). */
  const startPcmCapture = () => {
    const stream = streamRef.current;
    if (!stream || processorRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: ASSIST_SAMPLE_RATE });
      captureContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      captureSourceRef.current = source;

      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        setUserVolume(frameVolume(input) * 160);
        if (voiceEngineRef.current !== 'realtime') return;
        if (isMutedRef.current) return;

        // Echo gate: while the AI speaks, only loud local audio (the user
        // interrupting) is forwarded so speaker leak cannot barge in.
        if (aiSpeakingRef.current) {
          if (frameVolume(input) < BARGE_IN_VOLUME) return;
          pcmPlayerRef.current?.stop();
          aiSpeakingRef.current = false;
        }

        sendVoiceAudio(sessionId, floatTo16BitBase64(input));
      };

      source.connect(processor);
      // Muted destination keeps the processor pulling without playback.
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
    } catch (e) {
      console.warn('PCM capture failed, falling back to legacy:', e);
      applyVoiceEngine('legacy');
      startLegacyRecording();
    }
  };

  const stopPcmCapture = () => {
    const processor = processorRef.current;
    if (processor) {
      processor.onaudioprocess = null;
      try {
        processor.disconnect();
      } catch {
        /* noop */
      }
    }
    processorRef.current = null;
    try {
      captureSourceRef.current?.disconnect();
    } catch {
      /* noop */
    }
    captureSourceRef.current = null;
    captureContextRef.current?.close().catch(() => undefined);
    captureContextRef.current = null;
  };

  const playRealtimeChunk = (base64: string) => {
    if (!pcmPlayerRef.current) {
      pcmPlayerRef.current = new PcmStreamPlayer({
        onDrained: () => {
          aiSpeakingRef.current = false;
          setStatus((prev) => (prev === 'speaking' ? 'listening' : prev));
        },
      });
    }
    aiSpeakingRef.current = true;
    setStatus('speaking');
    pcmPlayerRef.current.playChunk(base64);
  };

  const stopRealtimePlayback = (cancelled?: boolean) => {
    if (!cancelled) return; // let the tail play out, onDrained resumes listening
    pcmPlayerRef.current?.stop();
    aiSpeakingRef.current = false;
    setStatus('listening');
  };

  const startCall = async () => {
    if (!browserSupported) {
      showError('当前浏览器不支持语音通话');
      return;
    }

    try {
      const unlocked = await unlockAudioContext();
      if (!unlocked) {
        showError('请先点击页面以启用音频');
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

      if (mode === 'mock') {
        // Prefer the end-to-end realtime engine; fall back to the legacy
        // MediaRecorder pipeline if the server rejects it or times out.
        applyVoiceEngine('pending');
        startVoiceStream(sessionId);
        voiceFallbackTimerRef.current = setTimeout(() => {
          if (voiceEngineRef.current === 'pending') {
            applyVoiceEngine('legacy');
            startLegacyRecording();
          }
        }, VOICE_FALLBACK_TIMEOUT_MS);
        return;
      }

      // Assist mode: legacy MediaRecorder + silence auto-detection.
      startLegacyRecording();
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setStatus('idle');

      if (err.name === 'NotAllowedError') {
        showError('无法访问麦克风，请在浏览器权限中允许后重试');
      } else if (err.name === 'NotFoundError') {
        showError('未检测到麦克风，请连接后重试');
      } else if (err.name === 'NotReadableError') {
        showError('麦克风被其他应用占用');
      } else if (err.name === 'OverconstrainedError') {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = fallbackStream;
        setIsCalling(true);
        setStatus('listening');
      } else {
        showError('启动语音通话失败，请重试');
      }
    }
  };

  /**
   * Mock mode: stop the current utterance and submit it as the answer.
   * The recorder restarts automatically after the AI finishes speaking the
   * next question (see playAiAudio's onended).
   */
  const submitCurrentAnswer = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (recorder.state === 'paused') {
      recorder.resume();
    }
    recorder.stop();
  };

  const stopCall = () => {
    setIsCalling(false);
    setStatus('idle');

    clearVoiceFallbackTimer();
    if (voiceEngineRef.current !== 'legacy') {
      stopVoiceStream(sessionId);
    }
    stopPcmCapture();
    pcmPlayerRef.current?.dispose();
    pcmPlayerRef.current = null;
    aiSpeakingRef.current = false;

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
    success(checked ? '已开启自动检测模式' : '已切换为手动模式');
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    // Actually gate the mic so muted audio never reaches the server.
    streamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !next));
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const latencyClass =
    latency < 100 ? 'ok' : latency < 200 ? 'warn' : 'live';

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '准备就绪';
      case 'connecting':
        return '连接中...';
      case 'listening':
        return autoDetectMode || voiceEngine === 'realtime'
          ? '聆听中（自动）'
          : '聆听中，说完请点击提交';
      case 'thinking':
        return '思考中...';
      case 'speaking':
        return 'AI 面试官正在说话';
      case 'reconnecting':
        return `重连中 (${reconnectAttempt}/5)...`;
      default:
        return '';
    }
  };

  return (
    <div className="iv-call">
      <div className="iv-row-between iv-call-header">
        <div className="iv-row">
          <span
            className={`iv-status-pill${
              isReconnecting ? ' warn' : isConnected ? ' ok' : ''
            }`}
          >
            {getStatusText()}
          </span>
          {mode === 'assist' && autoDetectMode && isCalling && (
            <span className="iv-status-pill ok">自动检测</span>
          )}
        </div>
        <div className="iv-row" style={{ gap: '0.5rem' }}>
          {browserInfo && (
            <Text type="secondary" style={{ fontSize: '0.72rem' }}>
              {browserInfo}
            </Text>
          )}
          {latency > 0 && (
            <span className={`iv-status-pill ${latencyClass}`}>
              <IconWifi size={12} /> {latency}ms
            </span>
          )}
        </div>
      </div>

      <div className="iv-call-body">
        <div className="iv-call-orb-wrap">
          <motion.div
            animate={{
              scale: status === 'speaking' ? [1, 1.15, 1] : 1,
              opacity: status === 'speaking' ? 1 : 0.75,
            }}
            transition={{ repeat: status === 'speaking' ? Infinity : 0, duration: 1.5 }}
            className="iv-call-orb"
            style={{ boxShadow: `0 0 ${Math.max(12, aiVolume)}px rgba(99, 102, 241, 0.55)` }}
          >
            {status === 'speaking' ? (
              <IconBulb size={38} />
            ) : (
              <IconMic size={38} />
            )}
          </motion.div>
          <AnimatePresence>
            {status === 'thinking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="iv-call-orb-hint"
              >
                <span className="iv-spinner" /> 思考中...
              </motion.div>
            )}
            {status === 'reconnecting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="iv-call-orb-hint"
              >
                <Button variant="ghost" size="sm" onClick={handleReconnect}>
                  立即重试
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {mode === 'mock' && currentQuestionText && (
          <div className="iv-question-card iv-call-question">
            <div className="iv-question-meta">
              <span className="iv-status-pill live">
                <span className="iv-rec-dot" /> 面试官提问
              </span>
            </div>
            <div className="iv-call-question-text">{currentQuestionText}</div>
          </div>
        )}

        {mode === 'assist' && detectedQuestion && (
          <div className="iv-call-question iv-msg-bubble user" style={{ margin: 0 }}>
            <div className="iv-msg-role">检测到的问题</div>
            <div className="iv-call-question-text">
              {detectedQuestion.length > 90
                ? detectedQuestion.substring(0, 90) + '...'
                : detectedQuestion}
            </div>
          </div>
        )}

        {(dialog.length > 0 || partialText) && (
          <div className="iv-call-dialog" ref={dialogScrollRef}>
            {dialog.map((m, idx) => (
              <div key={idx} className="iv-call-dialog-line">
                <span className={`iv-speaker-chip${m.role === 'user' ? ' self' : ''}`}>
                  {m.role === 'user' ? '我' : '面试官'}
                </span>
                <span className="iv-call-dialog-text">{m.text}</span>
              </div>
            ))}
            {partialText && (
              <div className="iv-call-dialog-line partial">
                <span className="iv-speaker-chip self">我</span>
                <span className="iv-call-dialog-text">{partialText}...</span>
              </div>
            )}
          </div>
        )}

        <div className="iv-viz">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="iv-viz-bar"
              style={{
                height: isMuted
                  ? 4
                  : Math.max(4, userVolume * (1 + ((i * 7) % 10) / 8) * 3),
                opacity: isMuted ? 0.3 : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="iv-call-footer">
        <div className="iv-call-duration">{formatDuration(callDuration)}</div>

        <div className="iv-row" style={{ justifyContent: 'center', gap: '1rem' }}>
          {mode === 'assist' && (
            <div className="iv-row" style={{ gap: '0.4rem' }}>
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                自动
              </Text>
              <Switch
                checked={autoDetectMode}
                onChange={toggleAutoDetect}
                disabled={!isCalling}
              />
            </div>
          )}

          {mode === 'mock' && (
            <Button
              variant="primary"
              onClick={submitCurrentAnswer}
              disabled={
                !isCalling ||
                status !== 'listening' ||
                isMuted ||
                voiceEngine !== 'legacy'
              }
              title={
                voiceEngine !== 'legacy'
                  ? '实时模式下自动断句，无需手动提交'
                  : undefined
              }
            >
              <IconCheck size={15} /> 提交本回答
            </Button>
          )}

          <Button
            variant={isMuted ? 'danger' : 'secondary'}
            onClick={toggleMute}
            disabled={!isCalling}
            className="iv-call-circle"
            title={isMuted ? '取消静音' : '静音'}
          >
            <IconMic size={22} />
          </Button>

          <Button
            variant="danger"
            onClick={stopCall}
            className="iv-call-circle iv-call-hangup"
            title="结束通话"
          >
            <IconPhone size={26} />
          </Button>
        </div>
      </div>

      {!browserSupported && (
        <div className="iv-tip" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
          <IconBulb size={15} />
          <span>当前浏览器可能不完全支持语音功能，建议使用 Chrome、Firefox 或 Safari。</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInterviewCall;
