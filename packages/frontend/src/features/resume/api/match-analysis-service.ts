import axios from '@/shared/lib/axios';

export interface RadarEntry {
  dimension:
    | 'skills'
    | 'experience'
    | 'education'
    | 'softSkills'
    | 'hiddenRequirements'
    | 'development';
  label: string;
  score: number;
}

export interface MatchGap {
  area: string;
  expectation: string;
  reality: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MatchAnalysisResult {
  analysis: string;
  overallScore: number;
  confidence: string;
  radar: RadarEntry[];
  breakdown: {
    skills: {
      score: number;
      matched: string[];
      missing: string[];
      partial: string[];
    };
    experience: {
      score: number;
      yearsRequired?: number;
      yearsCandidate?: number;
      relevantExperience: string[];
    };
    education: {
      score: number;
      requirements: string[];
      candidateEducation: string[];
      gap: string[];
    };
    softSkills: {
      score: number;
      required: string[];
      evidenced: string[];
      gap: string[];
    };
    hiddenRequirements: {
      score: number;
      identified: string[];
      aligned: string[];
      risk: string[];
    };
    development: {
      score: number;
      signals: string[];
      trajectory: string;
      fitForRole: string;
    };
  };
  gaps: MatchGap[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  interviewFocus: string[];
  learningPath?: Array<{
    skill: string;
    resources: string[];
    estimatedTime: string;
  }>;
}

/**
 * Service for JD-vs-resume match analysis.
 */
export const matchAnalysisService = {
  /**
   * Run a fresh match analysis for a resume against a job.
   * @param resumeId - The resume ID
   * @param jobId - The job ID
   * @returns The match analysis result
   */
  analyzeMatch: async (
    resumeId: string,
    jobId: string
  ): Promise<MatchAnalysisResult> => {
    const response = await axios.post<MatchAnalysisResult>(
      '/match-analysis/analyze',
      { resumeId, jobId }
    );
    return response.data;
  },

  /**
   * Get the cached match analysis for a resume-job pair.
   * @param resumeId - The resume ID
   * @param jobId - The job ID
   * @returns The match analysis result
   */
  getMatchAnalysis: async (
    resumeId: string,
    jobId: string
  ): Promise<MatchAnalysisResult> => {
    const response = await axios.get<MatchAnalysisResult>(
      `/match-analysis/${resumeId}/${jobId}`
    );
    return response.data;
  },
};
