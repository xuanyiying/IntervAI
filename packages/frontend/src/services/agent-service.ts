import axios from '../config/axios';
import { ParsedResumeData, PitchPerfectAgentOutput } from '@/types';

export const pitchPerfectService = {
  generatePitch: async (
    resumeData: ParsedResumeData,
    jobDescription: string,
    style: 'technical' | 'managerial' | 'sales',
    duration: 30 | 60
  ): Promise<PitchPerfectAgentOutput> => {
    const response = await axios.post('/agents/pitch-perfect/generate', {
      resumeData,
      jobDescription,
      style,
      duration,
    });
    return response.data;
  },

  refinePitch: async (
    currentIntroduction: string,
    feedback: string
  ): Promise<{ refinedIntroduction: string }> => {
    const response = await axios.post('/agents/pitch-perfect/refine', {
      currentIntroduction,
      feedback,
    });
    return response.data;
  },
};

export const rolePlayService = {
  startInterview: async (
    jobDescription: string,
    interviewerStyle: 'strict' | 'friendly' | 'stress-test',
    focusAreas: string[],
    resumeData?: ParsedResumeData
  ): Promise<any> => {
    const response = await axios.post('/interview/session', {
      jobDescription,
      interviewerStyle,
      focusAreas,
      resumeData,
    });
    return response.data;
  },

  processResponse: async (
    sessionId: string,
    userResponse: string
  ): Promise<any> => {
    const response = await axios.post(
      `/interview/session/${sessionId}/answer`,
      {
        content: userResponse,
      }
    );
    return response.data;
  },

  concludeInterview: async (sessionId: string): Promise<any> => {
    const response = await axios.post(`/interview/session/${sessionId}/end`);
    return response.data;
  },

  getFeedback: async (sessionId: string): Promise<any> => {
    const response = await axios.get(
      `/interview/session/${sessionId}/feedback`
    );
    return response.data;
  },
};
