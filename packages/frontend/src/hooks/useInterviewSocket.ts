import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export interface InterviewSocketOptions {
  onTranscription?: (data: { text: string }) => void;
  onAiResponse?: (data: { text: string }) => void;
  onAiAudio?: (data: { audio: ArrayBuffer }) => void;
  onCompleted?: () => void;
  onError?: (error: { message: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export const useInterviewSocket = (options?: InterviewSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

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
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      options?.onConnected?.();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      options?.onDisconnected?.();
    });

    socketRef.current.on('transcription', (data) => {
      options?.onTranscription?.(data);
    });

    socketRef.current.on('ai_response', (data) => {
      options?.onAiResponse?.(data);
    });

    socketRef.current.on('ai_audio', (data) => {
      options?.onAiAudio?.(data);
    });

    socketRef.current.on('interview_completed', () => {
      options?.onCompleted?.();
    });

    socketRef.current.on('error', (data) => {
      options?.onError?.(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  const joinInterview = useCallback((sessionId: string) => {
    socketRef.current?.emit('join_interview', { sessionId });
  }, []);

  const sendAudioChunk = useCallback((sessionId: string, chunk: Blob) => {
    socketRef.current?.emit('audio_chunk', { sessionId, chunk });
  }, []);

  const endAudio = useCallback((sessionId: string, audioBuffer: Blob) => {
    socketRef.current?.emit('end_audio', { sessionId, audioBuffer });
  }, []);

  return {
    isConnected,
    joinInterview,
    sendAudioChunk,
    endAudio,
  };
};
