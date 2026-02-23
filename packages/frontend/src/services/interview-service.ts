import axios from '../config/axios';
import { upload } from './upload-service';
import type {
  InterviewQuestion,
  InterviewSession,
  InterviewMessage,
} from '@/types';

export interface InterviewReportAnalysis {
  overallScore: number;
  dimensions: {
    accuracy: number;
    fluency: number;
    logicalThinking: number;
    professionalKnowledge: number;
    communication: number;
    confidence: number;
  };
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    questionId: string;
    question: string;
    answer: string;
    score: number;
    feedback: string;
    keywords: string[];
    suggestions: string[];
  }[];
  recommendations: string[];
  nextSteps: string[];
}

export interface InterviewReport {
  sessionId: string;
  generatedAt: string;
  candidateInfo: {
    name: string;
    email?: string;
  };
  jobInfo: {
    title: string;
    company: string;
  };
  interviewDuration: number;
  totalQuestions: number;
  answeredQuestions: number;
  transcript: {
    role: string;
    content: string;
    timestamp: string;
  }[];
  analysis: InterviewReportAnalysis;
  markdown: string;
}

export interface InterviewerPersona {
  id: string;
  name: string;
  style:
    | 'STRICT'
    | 'FRIENDLY'
    | 'TECHNICAL'
    | 'HR'
    | 'SUPPORTIVE'
    | 'CHALLENGING';
  company: string | null;
  position: string | null;
  avatarUrl: string | null;
  description: string;
  traits: string[];
  questionStyle: Record<string, any>;
  systemPrompt: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for managing AI-powered interview sessions and question generation
 */
export const interviewService = {
  /**
   * Get all interviewer personas
   * @param includeInactive - Whether to include inactive personas
   * @returns List of interviewer personas
   */
  getPersonas: async (
    includeInactive = false
  ): Promise<InterviewerPersona[]> => {
    const response = await axios.get<InterviewerPersona[]>(
      '/interviewer-personas',
      {
        params: { includeInactive },
      }
    );
    return response.data;
  },

  /**
   * Get recommended persona based on job description and resume
   * @param jobDescription - The job description
   * @param resumeData - The resume data
   * @returns The recommended persona
   */
  getRecommendedPersona: async (
    jobDescription?: string,
    resumeData?: any
  ): Promise<InterviewerPersona> => {
    const response = await axios.get<InterviewerPersona>(
      '/interviewer-personas/recommended',
      {
        params: {
          jobDescription,
          resumeData: resumeData ? JSON.stringify(resumeData) : undefined,
        },
      }
    );
    return response.data;
  },

  /**
   * Start a new interview session for a given optimization
   * @param optimizationId - The ID of the optimization to base the interview on
   * @param voiceId - Optional voice ID for audio interviews
   * @param personaId - Optional persona ID for custom interviewer
   * @returns The created interview session and the first question
   */
  startSession: async (
    optimizationId: string,
    voiceId?: string,
    personaId?: string
  ): Promise<{
    session: InterviewSession;
    firstQuestion: InterviewQuestion;
  }> => {
    const response = await axios.post<{
      session: InterviewSession;
      firstQuestion: InterviewQuestion;
    }>('/interview/session', {
      optimizationId,
      voiceId,
      personaId,
    });
    return response.data;
  },

  /**
   * Submit an answer for the current question
   * @param sessionId - The ID of the active session
   * @param content - The answer content
   * @param audioUrl - Optional URL to an audio recording of the answer
   * @returns The next question (if any) and completion status
   */
  submitAnswer: async (
    sessionId: string,
    content: string,
    audioUrl?: string
  ): Promise<{
    nextQuestion: InterviewQuestion | null;
    isCompleted: boolean;
  }> => {
    const response = await axios.post<{
      nextQuestion: InterviewQuestion | null;
      isCompleted: boolean;
    }>(`/interview/session/${sessionId}/answer`, {
      content,
      audioUrl,
    });
    return response.data;
  },

  /**
   * Get the current state of the interview session
   * @param sessionId - The ID of the session
   * @returns The current question index, question, and status
   */
  getCurrentState: async (
    sessionId: string
  ): Promise<{
    currentIndex?: number;
    currentQuestion?: InterviewQuestion;
    totalQuestions?: number;
    status: string;
    isCompleted?: boolean;
  }> => {
    const response = await axios.get(`/interview/session/${sessionId}/current`);
    return response.data;
  },

  /**
   * Send a message in an active interview session (Deprecated - use submitAnswer)
   * @param sessionId - The ID of the active session
   * @param content - The message content
   * @param audioUrl - Optional URL to an audio recording of the message
   * @returns The user's message and the AI's response
   */
  sendMessage: async (
    sessionId: string,
    content: string,
    audioUrl?: string
  ): Promise<{
    userMessage: InterviewMessage;
    aiMessage: InterviewMessage;
  }> => {
    const response = await axios.post<{
      userMessage: InterviewMessage;
      aiMessage: InterviewMessage;
    }>(`/interview/session/${sessionId}/message`, {
      content,
      audioUrl,
    });
    return response.data;
  },

  /**
   * End an active interview session
   * @param sessionId - The ID of the session to end
   * @returns The updated interview session
   */
  endSession: async (sessionId: string): Promise<InterviewSession> => {
    const response = await axios.post<InterviewSession>(
      `/interview/session/${sessionId}/end`
    );
    return response.data;
  },

  /**
   * Upload an audio recording for an interview message
   * @param file - The audio file blob
   * @returns The URL of the uploaded audio file
   */
  uploadAudio: async (file: Blob): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file, 'recording.webm');
    formData.append('fileType', 'AUDIO');
    formData.append('category', 'interview_recording');

    return upload<{ url: string }>('/storage/upload', formData);
  },

  /**
   * Transcribe audio file
   * @param file - The audio file blob
   * @returns The transcribed text
   */
  transcribeAudio: async (file: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('file', file, 'recording.webm');

    return upload<{ text: string }>('/resumes/audio/transcribe', formData);
  },

  /**
   * Get details of a specific interview session
   * @param sessionId - The ID of the session
   * @returns The interview session details
   */
  getSession: async (sessionId: string): Promise<InterviewSession> => {
    const response = await axios.get<InterviewSession>(
      `/interview/session/${sessionId}`
    );
    return response.data;
  },

  /**
   * Get the active interview session for an optimization, if any
   * @param optimizationId - The ID of the optimization
   * @returns The active session or null
   */
  getActiveSession: async (
    optimizationId: string
  ): Promise<InterviewSession | null> => {
    const response = await axios.get<InterviewSession | null>(
      `/interview/active-session/${optimizationId}`
    );
    return response.data;
  },

  /**
   * Generate interview questions based on an optimization
   * @param optimizationId - The ID of the optimization
   * @returns A list of generated interview questions
   */
  generateQuestions: async (
    optimizationId: string
  ): Promise<InterviewQuestion[]> => {
    const response = await axios.post<InterviewQuestion[]>(
      '/resumes/questions',
      {
        optimizationId,
      }
    );
    return response.data;
  },

  /**
   * Get existing interview questions for an optimization
   * @param optimizationId - The ID of the optimization
   * @returns A list of interview questions
   */
  getQuestions: async (
    optimizationId: string
  ): Promise<InterviewQuestion[]> => {
    const response = await axios.get<InterviewQuestion[]>(
      `/interview/questions/${optimizationId}`
    );
    return response.data;
  },

  /**
   * Export interview preparation materials as a PDF
   * @param optimizationId - The ID of the optimization
   * @returns The URL of the generated PDF
   */
  exportInterviewPrep: async (optimizationId: string): Promise<string> => {
    const response = await axios.get(`/interview/export/${optimizationId}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `interview-prep-${optimizationId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    return url;
  },

  /**
   * Get interview preparation guide or strategy
   * @param params - Configuration for the guide generation
   * @returns The generated guide content
   */
  getPreparationGuide: async (params: {
    type: 'guide' | 'strategy' | 'star';
    language?: string;
    resumeData?: Record<string, any>;
    jobDescription?: string;
    question?: string;
  }): Promise<{ content: string }> => {
    const response = await axios.post<{ content: string }>(
      '/resumes/preparation-guide',
      params
    );
    return response.data;
  },

  getReport: async (sessionId: string): Promise<InterviewReport> => {
    const response = await axios.get<InterviewReport>(
      `/interview/session/${sessionId}/report`
    );
    return response.data;
  },

  downloadReport: async (sessionId: string): Promise<void> => {
    const report = await interviewService.getReport(sessionId);
    const blob = new Blob([report.markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `interview-report-${sessionId}.md`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
