import axios from '../config/axios';
import type { InterviewSession, InterviewMessage } from '@/types';

export enum AnswerStyle {
  CONCISE = 'concise',
  DETAILED = 'detailed',
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
}

export interface CreateRealtimeSessionDto {
  title: string;
  resumeId?: string;
  jobId?: string;
  resumeData?: string;
  jobDescription?: string;
  answerStyle?: AnswerStyle;
}

export interface RealtimeInterviewService {
  createSession: (dto: CreateRealtimeSessionDto) => Promise<InterviewSession>;
  getUserSessions: () => Promise<InterviewSession[]>;
  getSession: (sessionId: string) => Promise<InterviewSession & { messages: InterviewMessage[] }>;
  sendQuestion: (sessionId: string, question: string, audioUrl?: string) => Promise<{ userMessage: InterviewMessage; aiAnswer: string }>;
  endSession: (sessionId: string) => Promise<InterviewSession>;
}

export const realtimeInterviewService: RealtimeInterviewService = {
  createSession: async (dto: CreateRealtimeSessionDto) => {
    const response = await axios.post<InterviewSession>('/realtime-interview/session', dto);
    return response.data;
  },

  getUserSessions: async () => {
    const response = await axios.get<InterviewSession[]>('/realtime-interview/sessions');
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await axios.get<InterviewSession & { messages: InterviewMessage[] }>(
      `/realtime-interview/session/${sessionId}`
    );
    return response.data;
  },

  sendQuestion: async (sessionId: string, question: string, audioUrl?: string) => {
    const response = await axios.post<{ userMessage: InterviewMessage; aiAnswer: string }>(
      `/realtime-interview/session/${sessionId}/question`,
      { question, audioUrl }
    );
    return response.data;
  },

  endSession: async (sessionId: string) => {
    const response = await axios.post<InterviewSession>(
      `/realtime-interview/session/${sessionId}/end`
    );
    return response.data;
  },
};
