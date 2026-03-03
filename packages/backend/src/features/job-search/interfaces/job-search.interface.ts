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

export interface ScraperConfig {
  platform: string;
  enabled: boolean;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  proxyConfig: ProxyConfig;
  retryConfig: RetryConfig;
  parsingConfig: ParsingConfig;
}

export interface ProxyConfig {
  enabled: boolean;
  provider: 'brightdata' | 'oxylabs' | 'smartproxy' | 'custom';
  rotationStrategy: 'per_request' | 'per_session' | 'timed';
  rotationInterval?: number;
  fallbackChain: string[];
}

export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface ParsingConfig {
  extractSalary: boolean;
  extractBenefits: boolean;
  extractCompanyInfo: boolean;
  extractSkills: boolean;
  normalizeLocation: boolean;
}

export interface ScraperResult {
  success: boolean;
  jobs: RawJob[];
  errors: ScraperError[];
  metrics: ScraperMetrics;
}

export interface ScraperError {
  type: 'network' | 'parsing' | 'blocked' | 'rate_limit' | 'unknown';
  message: string;
  url?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface ScraperMetrics {
  jobsCollected: number;
  successRate: number;
  avgResponseTime: number;
  blocksEncountered: number;
  proxyRotations: number;
  captchaSolved: number;
}

export interface ParserResult {
  success: boolean;
  job?: JobPosting;
  qualityScore: number;
  missingFields: string[];
  errors: ParserError[];
}

export interface ParserError {
  field: string;
  error: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface MatchResult {
  success: boolean;
  matches: JobMatch[];
  totalJobsProcessed: number;
  matchesFound: number;
  avgMatchScore: number;
}
