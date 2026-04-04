import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export type InterviewMode = 'mock' | 'assist';

export interface InterviewSocketOptions {
  mode?: InterviewMode;
  onTranscription?: (data: { text: string }) => void;
  onTranscriptionPartial?: (data: { text: string }) => void;
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
  onQuestionDetected?: (data: { text: string; isQuestion: boolean }) => void;
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
  const lastKnownStatusRef = useRef<string>('idle');
  const reconnectRestoreDoneRef = useRef<boolean>(false);

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
        options?.onConnected?.();
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
        options?.onDisconnected?.();

        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });

      socket.io.on('reconnect_attempt', (attempt) => {
        setIsReconnecting(true);
        setReconnectAttempt(attempt);
        options?.onReconnecting?.(attempt);
      });

      socket.io.on('reconnect', () => {
        setIsReconnecting(false);
        setReconnectAttempt(0);
        reconnectRestoreDoneRef.current = false;
        options?.onReconnected?.();

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
        options?.onError?.({
          message: 'Connection lost. Please refresh the page.',
        });
      });

      socket.on('pong', () => {
        const currentLatency = Date.now() - pingStartTimeRef.current;
        setLatency(currentLatency);
        options?.onLatencyUpdate?.(currentLatency);
      });

      socket.on('joined_session', (data) => {
        console.log(`Joined ${mode} interview session:`, data.sessionId);
      });

      socket.on('joined_interview', (data) => {
        console.log(`Joined ${mode} interview session:`, data.sessionId);
      });

      socket.on('transcription', (data) => {
        options?.onTranscription?.(data);
      });

      socket.on('transcription_partial', (data) => {
        options?.onTranscriptionPartial?.(data);
      });

      socket.on('ai_response', (data) => {
        options?.onAiResponse?.(data);
      });

      socket.on('ai_audio', (data) => {
        options?.onAiAudio?.(data);
        options?.onAnswerAudio?.(data);
      });

      socket.on('generating_answer', () => {
        options?.onGeneratingAnswer?.();
      });

      socket.on('answer_chunk', (data) => {
        options?.onAnswerChunk?.(data);
      });

      socket.on('answer_complete', (data) => {
        options?.onAnswerComplete?.(data);
      });

      socket.on('answer_audio', (data) => {
        options?.onAnswerAudio?.(data);
      });

      socket.on('question_detected', (data) => {
        options?.onQuestionDetected?.(data);
      });

      socket.on('interview_completed', () => {
        options?.onCompleted?.();
      });

      socket.on('error', (data) => {
        options?.onError?.(data);
      });
    },
    [options, startLatencyCheck, mode]
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
      transports: ['websocket'],
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

  const sendAudioChunk = useCallback((sessionId: string, chunk: Blob) => {
    socketRef.current?.emit('audio_chunk', { sessionId, chunk });
  }, []);

  const endAudio = useCallback((sessionId: string, audioBuffer: Blob) => {
    socketRef.current?.emit('end_audio', { sessionId, audioBuffer });
  }, []);

  const sendQuestionDetected = useCallback((sessionId: string, audioBuffer: Blob) => {
    socketRef.current?.emit('detect_question', { sessionId, audioBuffer });
  }, []);

  const sendQuestion = useCallback((sessionId: string, question: string) => {
    socketRef.current?.emit('send_question', { sessionId, question });
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
    disconnect,
    reconnect,
  };
};
