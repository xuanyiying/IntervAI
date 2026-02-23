import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export interface InterviewSocketOptions {
  onTranscription?: (data: { text: string }) => void;
  onTranscriptionPartial?: (data: { text: string }) => void;
  onAiResponse?: (data: { text: string }) => void;
  onAiAudio?: (data: { audio: ArrayBuffer }) => void;
  onCompleted?: () => void;
  onError?: (error: { message: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
  onLatencyUpdate?: (latency: number) => void;
}

export interface InterviewSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  latency: number;
  joinInterview: (sessionId: string) => void;
  sendAudioChunk: (sessionId: string, chunk: Blob) => void;
  endAudio: (sessionId: string, audioBuffer: Blob) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const LATENCY_CHECK_INTERVAL = 5000;

export const useInterviewSocket = (options?: InterviewSocketOptions): InterviewSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [latency, setLatency] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const latencyTimerRef = useRef<number | null>(null);
  const pingStartTimeRef = useRef<number>(0);
  const currentSessionIdRef = useRef<string | null>(null);

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

  const setupSocketEvents = useCallback((socket: Socket) => {
    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempt(0);
      options?.onConnected?.();
      startLatencyCheck();

      if (currentSessionIdRef.current) {
        socket.emit('join_interview', { sessionId: currentSessionIdRef.current });
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
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
      options?.onReconnected?.();
    });

    socket.io.on('reconnect_failed', () => {
      setIsReconnecting(false);
      options?.onError?.({ message: 'Connection lost. Please refresh the page.' });
    });

    socket.on('pong', () => {
      const currentLatency = Date.now() - pingStartTimeRef.current;
      setLatency(currentLatency);
      options?.onLatencyUpdate?.(currentLatency);
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
    });

    socket.on('interview_completed', () => {
      options?.onCompleted?.();
    });

    socket.on('error', (data) => {
      options?.onError?.(data);
    });
  }, [options, startLatencyCheck]);

  useEffect(() => {
    if (!user?.id) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    let serverUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
    if (!serverUrl || serverUrl.startsWith('/')) {
      serverUrl = window.location.origin;
    }

    const token = localStorage.getItem('auth_token');

    socketRef.current = io(`${serverUrl}/interview`, {
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
  }, [user?.id, setupSocketEvents, stopLatencyCheck]);

  const joinInterview = useCallback((sessionId: string) => {
    currentSessionIdRef.current = sessionId;
    socketRef.current?.emit('join_interview', { sessionId });
  }, []);

  const sendAudioChunk = useCallback((sessionId: string, chunk: Blob) => {
    socketRef.current?.emit('audio_chunk', { sessionId, chunk });
  }, []);

  const endAudio = useCallback((sessionId: string, audioBuffer: Blob) => {
    socketRef.current?.emit('end_audio', { sessionId, audioBuffer });
  }, []);

  const disconnect = useCallback(() => {
    stopLatencyCheck();
    socketRef.current?.disconnect();
  }, [stopLatencyCheck]);

  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  return {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    latency,
    joinInterview,
    sendAudioChunk,
    endAudio,
    disconnect,
    reconnect,
  };
};
