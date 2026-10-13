import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export type InterviewMode = 'mock' | 'assist';
/** Audio source channel for realtime assist streams. */
export type AudioChannel = 'interviewer' | 'self';

export interface InterviewSocketOptions {
  mode?: InterviewMode;
  onTranscription?: (data: {
    text: string;
    final?: boolean;
    channel?: AudioChannel;
    speaker?: AudioChannel;
  }) => void;
  onTranscriptionPartial?: (data: {
    text: string;
    channel?: AudioChannel;
  }) => void;
  onAiResponse?: (data: { text: string }) => void;
  onAiAudio?: (data: { audio: ArrayBuffer }) => void;
  onGeneratingAnswer?: () => void;
  onAnswerChunk?: (data: { chunk: string }) => void;
  onAnswerComplete?: (data: { answer: string }) => void;
  onAnswerAudio?: (data: { audio: ArrayBuffer }) => void;
  onCompleted?: () => void;
  onError?: (error: { message: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
  onLatencyUpdate?: (latency: number) => void;
  onQuestionDetected?: (data: {
    text: string;
    isQuestion: boolean;
    auto?: boolean;
  }) => void;
  onStreamStarted?: (data: {
    sessionId: string;
    channel?: AudioChannel;
    resumed?: boolean;
  }) => void;
  onJoinedSession?: (data: {
    sessionId: string;
    realtimeAsrAvailable?: boolean;
    voiceprintAvailable?: boolean;
  }) => void;
  onStreamStopped?: (data: {
    sessionId: string;
    durationSec?: number;
    transcript?: string;
    recordingUrl?: string;
  }) => void;
  onAsrError?: (data: { message: string }) => void;
  onRecordingSaved?: (data: {
    sessionId: string;
    durationSec: number;
    hasRecording: boolean;
  }) => void;
  onVoiceStarted?: (data: { sessionId: string }) => void;
  onVoiceStopped?: (data: {
    sessionId: string;
    durationSec?: number;
    hasRecording?: boolean;
  }) => void;
  onVoiceError?: (data: { message: string }) => void;
  /** Streaming PCM chunk (base64, 24 kHz) of the AI interviewer's speech. */
  onAiAudioChunk?: (data: { audio: string }) => void;
  onAiAudioStop?: (data: { cancelled?: boolean }) => void;
}

export interface InterviewSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  latency: number;
  joinSession: (sessionId: string, voiceId?: string) => void;
  sendAudioChunk: (sessionId: string, chunk: Blob) => void;
  endAudio: (sessionId: string, audioBuffer: Blob) => void;
  sendQuestionDetected: (sessionId: string, audioBuffer: Blob) => void;
  sendQuestion: (sessionId: string, question: string) => void;
  startStream: (
    sessionId: string,
    options?: {
      sampleRate?: number;
      autoAnswer?: boolean;
      channel?: AudioChannel;
      record?: boolean;
    }
  ) => void;
  sendAudioData: (
    sessionId: string,
    pcmBase64: string,
    channel?: AudioChannel
  ) => void;
  setAutoAnswer: (sessionId: string, enabled: boolean) => void;
  stopStream: (sessionId: string, channel?: AudioChannel) => void;
  startVoiceStream: (sessionId: string) => void;
  sendVoiceAudio: (sessionId: string, pcmBase64: string) => void;
  stopVoiceStream: (sessionId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const LATENCY_CHECK_INTERVAL = 5000;

const NAMESPACE_MAP: Record<InterviewMode, string> = {
  mock: '/interview',
  assist: '/realtime-interview',
};

export const useInterviewSocket = (
  options?: InterviewSocketOptions
): InterviewSocketReturn => {
  const mode = options?.mode || 'mock';
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [latency, setLatency] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const latencyTimerRef = useRef<number | null>(null);
  const pingStartTimeRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string | null>(null);
  const currentVoiceIdRef = useRef<string | undefined>(undefined);
  const reconnectRestoreDoneRef = useRef<boolean>(false);

  /**
   * Keep the latest callbacks in a ref so the socket setup stays referentially
   * stable — otherwise every render (e.g. on transcription updates) would
   * tear down and re-create the connection.
   */
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { user } = useAuthStore();

  const startLatencyCheck = useCallback(() => {
    if (latencyTimerRef.current) {
      clearInterval(latencyTimerRef.current);
    }

    latencyTimerRef.current = window.setInterval(() => {
      if (socketRef.current?.connected) {
        pingStartTimeRef.current = Date.now();
        socketRef.current.emit('ping');
      }
    }, LATENCY_CHECK_INTERVAL);
  }, []);

  const stopLatencyCheck = useCallback(() => {
    if (latencyTimerRef.current) {
      clearInterval(latencyTimerRef.current);
      latencyTimerRef.current = null;
    }
  }, []);

  const setupSocketEvents = useCallback(
    (socket: Socket) => {
      socket.on('connect', () => {
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);
        optionsRef.current?.onConnected?.();
        startLatencyCheck();

        if (currentSessionIdRef.current && !reconnectRestoreDoneRef.current) {
          reconnectRestoreDoneRef.current = true;
          const eventName = mode === 'mock' ? 'join_interview' : 'join_session';
          socket.emit(eventName, {
            sessionId: currentSessionIdRef.current,
            ...(mode === 'assist' && currentVoiceIdRef.current
              ? { voiceId: currentVoiceIdRef.current }
              : {}),
          });
        }
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        reconnectRestoreDoneRef.current = false;
        optionsRef.current?.onDisconnected?.();

        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });

      socket.io.on('reconnect_attempt', (attempt) => {
        setIsReconnecting(true);
        setReconnectAttempt(attempt);
        optionsRef.current?.onReconnecting?.(attempt);
      });

      socket.io.on('reconnect', () => {
        setIsReconnecting(false);
        setReconnectAttempt(0);
        reconnectRestoreDoneRef.current = false;
        optionsRef.current?.onReconnected?.();

        if (currentSessionIdRef.current) {
          const eventName = mode === 'mock' ? 'join_interview' : 'join_session';
          socket.emit(eventName, {
            sessionId: currentSessionIdRef.current,
            ...(mode === 'assist' && currentVoiceIdRef.current
              ? { voiceId: currentVoiceIdRef.current }
              : {}),
          });
        }
      });

      socket.io.on('reconnect_failed', () => {
        setIsReconnecting(false);
        optionsRef.current?.onError?.({
          message: 'Connection lost. Please refresh the page.',
        });
      });

      socket.on('pong', () => {
        const currentLatency = Date.now() - pingStartTimeRef.current;
        setLatency(currentLatency);
        optionsRef.current?.onLatencyUpdate?.(currentLatency);
      });

      socket.on('joined_session', (data) => {
        console.log(`Joined ${mode} interview session:`, data.sessionId);
        optionsRef.current?.onJoinedSession?.(data);
      });

      socket.on('joined_interview', (data) => {
        console.log(`Joined ${mode} interview session:`, data.sessionId);
      });

      socket.on('transcription', (data) => {
        optionsRef.current?.onTranscription?.(data);
      });

      socket.on('transcription_partial', (data) => {
        optionsRef.current?.onTranscriptionPartial?.(data);
      });

      socket.on('ai_response', (data) => {
        optionsRef.current?.onAiResponse?.(data);
      });

      socket.on('ai_audio', (data) => {
        optionsRef.current?.onAiAudio?.(data);
        optionsRef.current?.onAnswerAudio?.(data);
      });

      socket.on('generating_answer', () => {
        optionsRef.current?.onGeneratingAnswer?.();
      });

      socket.on('answer_chunk', (data) => {
        optionsRef.current?.onAnswerChunk?.(data);
      });

      socket.on('answer_complete', (data) => {
        optionsRef.current?.onAnswerComplete?.(data);
      });

      socket.on('answer_audio', (data) => {
        optionsRef.current?.onAnswerAudio?.(data);
      });

      socket.on('question_detected', (data) => {
        optionsRef.current?.onQuestionDetected?.(data);
      });

      socket.on('stream_started', (data) => {
        optionsRef.current?.onStreamStarted?.(data);
      });

      socket.on('stream_stopped', (data) => {
        optionsRef.current?.onStreamStopped?.(data);
      });

      socket.on('asr_error', (data) => {
        optionsRef.current?.onAsrError?.(data);
      });

      socket.on('recording_saved', (data) => {
        optionsRef.current?.onRecordingSaved?.(data);
      });

      socket.on('voice_started', (data) => {
        optionsRef.current?.onVoiceStarted?.(data);
      });

      socket.on('voice_stopped', (data) => {
        optionsRef.current?.onVoiceStopped?.(data);
      });

      socket.on('voice_error', (data) => {
        optionsRef.current?.onVoiceError?.(data);
      });

      socket.on('ai_audio_chunk', (data) => {
        optionsRef.current?.onAiAudioChunk?.(data);
      });

      socket.on('ai_audio_stop', (data) => {
        optionsRef.current?.onAiAudioStop?.(data);
      });

      socket.on('interview_completed', () => {
        optionsRef.current?.onCompleted?.();
      });

      socket.on('error', (data) => {
        optionsRef.current?.onError?.(data);
      });
    },
    [startLatencyCheck, mode]
  );

  useEffect(() => {
    if (!user?.id) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    let serverUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    if (!serverUrl || serverUrl.startsWith('/')) {
      serverUrl = window.location.origin;
    }

    const token = localStorage.getItem('auth_token');
    const namespace = NAMESPACE_MAP[mode];

    socketRef.current = io(`${serverUrl}${namespace}`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    setupSocketEvents(socketRef.current);

    return () => {
      stopLatencyCheck();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, setupSocketEvents, stopLatencyCheck, mode]);

  const joinSession = useCallback(
    (sessionId: string, voiceId?: string) => {
      currentSessionIdRef.current = sessionId;
      currentVoiceIdRef.current = voiceId;
      reconnectRestoreDoneRef.current = false;
      const eventName = mode === 'mock' ? 'join_interview' : 'join_session';
      socketRef.current?.emit(eventName, {
        sessionId,
        ...(voiceId && mode === 'assist' ? { voiceId } : {}),
      });
    },
    [mode]
  );

  // Socket.IO cannot serialize Blob payloads; convert to ArrayBuffer first
  // so the server receives a Buffer instead of an empty object.
  const emitBlob = useCallback(
    (
      event: string,
      payload: Record<string, unknown>,
      blob: Blob,
      fieldName = 'audioBuffer'
    ) => {
      void blob.arrayBuffer().then((buffer) => {
        socketRef.current?.emit(event, { ...payload, [fieldName]: buffer });
      });
    },
    []
  );

  const sendAudioChunk = useCallback(
    (sessionId: string, chunk: Blob) => {
      emitBlob('audio_chunk', { sessionId }, chunk, 'chunk');
    },
    [emitBlob]
  );

  const endAudio = useCallback(
    (sessionId: string, audioBuffer: Blob) => {
      emitBlob('end_audio', { sessionId }, audioBuffer);
    },
    [emitBlob]
  );

  const sendQuestionDetected = useCallback(
    (sessionId: string, audioBuffer: Blob) => {
      emitBlob('detect_question', { sessionId }, audioBuffer);
    },
    [emitBlob]
  );

  const sendQuestion = useCallback((sessionId: string, question: string) => {
    socketRef.current?.emit('send_question', { sessionId, question });
  }, []);

  const startStream = useCallback(
    (
      sessionId: string,
      streamOptions?: {
        sampleRate?: number;
        autoAnswer?: boolean;
        channel?: AudioChannel;
      }
    ) => {
      socketRef.current?.emit('start_stream', {
        sessionId,
        ...streamOptions,
      });
    },
    []
  );

  const sendAudioData = useCallback(
    (sessionId: string, pcmBase64: string, channel?: AudioChannel) => {
      socketRef.current?.emit('audio_data', {
        sessionId,
        audio: pcmBase64,
        ...(channel ? { channel } : {}),
      });
    },
    []
  );

  const setAutoAnswer = useCallback((sessionId: string, enabled: boolean) => {
    socketRef.current?.emit('set_auto_answer', { sessionId, enabled });
  }, []);

  const stopStream = useCallback(
    (sessionId: string, channel?: AudioChannel) => {
      socketRef.current?.emit('stop_stream', {
        sessionId,
        ...(channel ? { channel } : {}),
      });
    },
    []
  );

  const startVoiceStream = useCallback((sessionId: string) => {
    socketRef.current?.emit('voice_start', { sessionId });
  }, []);

  const sendVoiceAudio = useCallback((sessionId: string, pcmBase64: string) => {
    socketRef.current?.emit('voice_audio', { sessionId, audio: pcmBase64 });
  }, []);

  const stopVoiceStream = useCallback((sessionId: string) => {
    socketRef.current?.emit('voice_stop', { sessionId });
  }, []);

  const disconnect = useCallback(() => {
    stopLatencyCheck();
    socketRef.current?.disconnect();
  }, [stopLatencyCheck]);

  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      reconnectRestoreDoneRef.current = false;
      socketRef.current.connect();
    }
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    latency,
    joinSession,
    sendAudioChunk,
    endAudio,
    sendQuestionDetected,
    sendQuestion,
    startStream,
    sendAudioData,
    setAutoAnswer,
    stopStream,
    startVoiceStream,
    sendVoiceAudio,
    stopVoiceStream,
    disconnect,
    reconnect,
  };
};
