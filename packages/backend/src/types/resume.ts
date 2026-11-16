/**
 * Resume-related data structures
 */

/**
 * Parsed resume data structure
 * Used across AI parsing and optimization features
 */
export interface ParsedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    achievements?: string[];
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    location?: string;
    description: string[];
    achievements?: string[];
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    highlights: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  /** LLM-generated concise profile (~150-200 words) for injecting into conversation context */
  contextSummary?: string;
  markdown?: string;
}

/**
 * Resume diagnosis result — shared contract between AI diagnosis,
 * rule-based fallback and the frontend analysis view.
 * Dimension caps: project 40 / skillMatch 20 / content 15 / structure 15 / expression 10.
 */
export interface ResumeDiagnosis {
  overallScore: number;
  scoreDetail: {
    projectScore: number;
    skillMatchScore: number;
    contentScore: number;
    structureScore: number;
    expressionScore: number;
  };
  language: 'zh' | 'en';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{
    category: string;
    priority: string;
    issue: string;
    recommendation: string;
  }>;
}

/**
 * Score results of matching a resume against a job description
 */
export interface MatchScore {
  overall: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  keywordCoverage: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
}
