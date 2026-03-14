/**
 * Job Search Interfaces
 *
 * Type definitions for the automated job search system
 */

export enum RemotePolicy {
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
  REMOTE = 'remote',
  FLEXIBLE = 'flexible',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

export enum ApplicationMethod {
  DIRECT = 'direct',
  EASY_APPLY = 'easy_apply',
  EMAIL = 'email',
  EXTERNAL = 'external',
}

export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  VIEWED = 'viewed',
  UNDER_REVIEW = 'under_review',
  INTERVIEW_REQUESTED = 'interview_requested',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER = 'offer',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface RawJob {
  id: string;
  platform: string;
  externalId: string;
  rawHtml?: string;
  rawJson?: any;
  scrapedAt: Date;
  url: string;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  period?: 'hourly' | 'daily' | 'monthly' | 'yearly';
  currency?: string;
  isEstimated?: boolean;
}

export interface JobPosting {
  id: string;
  externalId?: string;
  platform: string;
  title: string;
  company: string;
  location?: string;
  remotePolicy?: string;
  salary?: SalaryRange;
  jobType?: string;
  description?: string;
  requirements: string[];
  skills: string[];
  benefits: string[];
  applicationUrl?: string;
  applicationMethod?: string;
  postedAt?: Date;
  expiresAt?: Date;
  scrapedAt: Date;
  lastUpdated?: Date;
  isActive: boolean;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface Skill {
  name: string;
  category: string;
  level?: string;
  yearsOfExperience?: number;
  isRequired: boolean;
}

export interface UserProfile {
  id?: string;
  userId: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  preferences?: JobPreferences;
  targetRoles?: string[];
  targetLocations?: string[];
  salaryExpectation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  availability?: string;
}

export interface JobPreferences {
  preferredRoles: string[];
  preferredIndustries: string[];
  minSalary?: number;
  maxSalary?: number;
  preferredLocations: string[];
  remotePreference?: RemotePolicy;
  excludedCompanies: string[];
}

export interface WorkExperience {
  title: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  skillsUsed: string[];
  achievements?: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationDate?: Date;
  gpa?: number;
}

export interface JobMatch {
  id?: string;
  jobId: string;
  userId: string;
  matchScore: number;
  semanticScore: number;
  skillMatchScore: number;
  preferenceScore: number;
  temporalScore: number;

  matchedSkills: string[];
  missingSkills: string[];
  skillGaps?: SkillGap[];

  strengths: string[];
  concerns: string[];
  recommendations: string[];
  matchReasons: string[];

  job?: JobPosting;
  createdAt?: Date;
}

export interface SkillGap {
  skill: string;
  requiredLevel: string;
  userLevel: string;
  gap: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SearchCriteria {
  keywords?: string[];
  title?: string;
  company?: string;
  location?: string;
  remotePolicy?: RemotePolicy;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel[];
  employmentType?: EmploymentType[];
  skills?: string[];
  industries?: string[];
  postedWithin?: number;
  platforms?: string[];
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  submittedAt: Date;
  platform?: string;
  applicationUrl?: string;
  resumeVersion?: string;
  coverLetter?: string;
  lastStatusCheck: Date;
  viewCount: number;
  responseTime?: number;
  notes?: string;
  job?: JobPosting;
}

export interface MatchResult {
  success: boolean;
  matches: JobMatch[];
  totalJobsProcessed: number;
  matchesFound: number;
  avgMatchScore: number;
}
