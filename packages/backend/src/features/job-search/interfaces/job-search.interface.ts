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

export interface JobPosting {
  id: string;
  externalId: string;
  platform: string;
  title: string;
  company: string;
  location: Location;
  remotePolicy: RemotePolicy;
  salary?: SalaryRange;
  currency: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  postedDate: Date;
  applicationUrl: string;
  applicationMethod: ApplicationMethod;
  companyInfo?: CompanyInfo;

  // AI-enriched fields
  skillsVector?: number[];
  matchScore?: number;
  tags: string[];

  // Metadata
  scrapedAt: Date;
  lastUpdated: Date;
  isActive: boolean;
  qualityScore: number;
}

export interface Location {
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SalaryRange {
  min: number;
  max: number;
  period: 'hourly' | 'daily' | 'monthly' | 'yearly';
  currency: string;
  isEstimated: boolean;
}

export interface CompanyInfo {
  name: string;
  industry?: string;
  size?: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
}

export interface Skill {
  name: string;
  category: SkillCategory;
  level?: SkillLevel;
  yearsOfExperience?: number;
  isRequired: boolean;
}

export enum SkillCategory {
  TECHNICAL = 'technical',
  SOFT_SKILL = 'soft_skill',
  LANGUAGE = 'language',
  CERTIFICATION = 'certification',
  DOMAIN_KNOWLEDGE = 'domain_knowledge',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface UserProfile {
  id: string;
  userId: string;
  skills: Skill[];
  experience: WorkExperience[];
  education: Education[];
  preferences: JobPreferences;

  // AI-enriched
  skillsVector?: number[];
  experienceSummary?: string;
  careerGoals?: string;
}

export interface JobPreferences {
  preferredRoles: string[];
  preferredIndustries: string[];
  minSalary?: number;
  maxSalary?: number;
  preferredLocations: string[];
  remotePreference: RemotePolicy;
  companySizePrefs: CompanySize[];
  excludedCompanies: string[];
  workLifeBalancePriority?: number; // 1-10
}

export enum CompanySize {
  STARTUP = 'startup', // 1-50
  SMALL = 'small', // 51-200
  MEDIUM = 'medium', // 201-1000
  LARGE = 'large', // 1001-10000
  ENTERPRISE = 'enterprise', // 10001+
}

export interface WorkExperience {
  title: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
  achievements: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  graduationDate?: Date;
  gpa?: number;
}

export interface JobMatch {
  jobId: string;
  userId: string;
  matchScore: number;
  semanticScore: number;
  skillMatchScore: number;
  preferenceScore: number;
  temporalScore: number;

  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];

  strengths: string[];
  concerns: string[];
  explanation: string;

  job: JobPosting;
  createdAt: Date;
}

export interface SkillGap {
  skill: string;
  requiredLevel: SkillLevel;
  userLevel: SkillLevel;
  gap: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SearchCriteria {
  keywords?: string[];
  title?: string;
  company?: string;
  location?: Location;
  remotePolicy?: RemotePolicy;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel[];
  employmentType?: EmploymentType[];
  skills?: string[];
  industries?: string[];
  postedWithin?: number; // hours
  platforms?: string[];
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  submittedAt: Date;
  platform: string;
  applicationUrl?: string;
  resumeVersion: string;
  coverLetter?: string;
  followUpDate?: Date;
  lastStatusCheck: Date;

  // Tracking
  viewCount: number;
  responseTime?: number; // in hours
  notes?: string;
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
  rotationInterval?: number; // ms
  fallbackChain: string[];
}

export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelay: number; // ms
  maxDelay: number; // ms;
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
