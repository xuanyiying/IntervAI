import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores';

export interface TaskProgressEvent {
  taskId: string;
  status: string;
  progress: number;
  message: string;
  subtaskResults?: any[];
  timestamp: number;
}

export interface TeamStatusEvent {
  healthy: boolean;
  activeAgents: number;
  queueDepth: number;
  timestamp: number;
}

export interface TaskCompleteEvent {
  taskId: string;
  status: string;
  progress: number;
  message: string;
  output?: any;
  executionTimeMs: number;
  timestamp: number;
}

export interface TaskErrorEvent {
  taskId?: string;
  status?: string;
  message: string;
  retryable?: boolean;
  timestamp: number;
}

interface UseTeamSocketOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onTaskProgress?: (event: TaskProgressEvent) => void;
  onTaskComplete?: (event: TaskCompleteEvent) => void;
  onTaskError?: (event: TaskErrorEvent) => void;
  onTeamStatus?: (event: TeamStatusEvent) => void;
  onTeamMetrics?: (event: any) => void;
}

export const useTeamSocket = (options: UseTeamSocketOptions = {}) => {
  const {
    onConnected,
    onDisconnected,
    onTaskProgress,
    onTaskComplete,
    onTaskError,
    onTeamStatus,
    onTeamMetrics,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    socketRef.current = io(`${apiUrl}/team`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      onConnected?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnected?.();
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
    });

    socket.on('error', (err) => {
      setError(err.message || 'Connection error');
    });

    socket.on('connected', (data) => {
      console.log('Team socket connected:', data);
    });

    socket.on('task:progress', (event: TaskProgressEvent) => {
      onTaskProgress?.(event);
    });

    socket.on('task:complete', (event: TaskCompleteEvent) => {
      onTaskComplete?.(event);
    });

    socket.on('task:error', (event: TaskErrorEvent) => {
      onTaskError?.(event);
    });

    socket.on('task:cancelled', (event: any) => {
      console.log('Task cancelled:', event);
    });

    socket.on('team:status', (event: TeamStatusEvent) => {
      onTeamStatus?.(event);
    });

    socket.on('team:metrics', (event: any) => {
      onTeamMetrics?.(event);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const submitTask = useCallback((type: string, data: Record<string, any>, priority?: number) => {
    if (!socketRef.current?.connected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('task:submit', { type, data, priority });
  }, []);

  const getTaskStatus = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('task:status', { taskId });
  }, []);

  const cancelTask = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('task:cancel', { taskId });
  }, []);

  const requestTeamStatus = useCallback(() => {
    if (!socketRef.current?.connected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('team:status');
  }, []);

  const requestTeamMetrics = useCallback(() => {
    if (!socketRef.current?.connected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('team:metrics');
  }, []);

  return {
    isConnected,
    error,
    submitTask,
    getTaskStatus,
    cancelTask,
    requestTeamStatus,
    requestTeamMetrics,
  };
};

export default useTeamSocket;
