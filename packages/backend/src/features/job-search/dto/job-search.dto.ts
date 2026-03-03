/**
 * Data Transfer Objects for Job Search
 */

import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RemotePolicy,
  EmploymentType,
  ExperienceLevel,
} from '../interfaces/job-search.interface';

export class SearchCriteriaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(RemotePolicy)
  remotePolicy?: RemotePolicy;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ExperienceLevel, { each: true })
  experienceLevel?: ExperienceLevel[];

  @IsOptional()
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  employmentType?: EmploymentType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsNumber()
  postedWithin?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];
}

export class JobPreferencesDto {
  @IsArray()
  @IsString({ each: true })
  preferredRoles: string[];

  @IsArray()
  @IsString({ each: true })
  preferredIndustries: string[];

  @IsOptional()
  @IsNumber()
  minSalary?: number;

  @IsOptional()
  @IsNumber()
  maxSalary?: number;

  @IsArray()
  @IsString({ each: true })
  preferredLocations: string[];

  @IsOptional()
  @IsEnum(RemotePolicy)
  remotePreference?: RemotePolicy;

  @IsArray()
  @IsString({ each: true })
  excludedCompanies: string[];
}

export class UpdatePreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => JobPreferencesDto)
  preferences?: Partial<JobPreferencesDto>;

  @IsOptional()
  @IsBoolean()
  enableAutoApply?: boolean;

  @IsOptional()
  @IsNumber()
  dailyApplicationLimit?: number;
}

export class JobMatchResponseDto {
  @IsString()
  jobId: string;

  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNumber()
  matchScore: number;

  @IsArray()
  @IsString({ each: true })
  matchedSkills: string[];

  @IsArray()
  @IsString({ each: true })
  missingSkills: string[];

  @IsArray()
  @IsString({ each: true })
  matchReasons: string[];

  @IsOptional()
  @IsString()
  applicationUrl?: string;
}

export class SearchResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobMatchResponseDto)
  jobs: JobMatchResponseDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  pageSize: number;

  @IsNumber()
  totalPages: number;

  @IsNumber()
  avgMatchScore: number;
}

export class ApplicationStatusDto {
  @IsString()
  applicationId: string;

  @IsString()
  jobId: string;

  @IsString()
  jobTitle: string;

  @IsString()
  company: string;

  @IsString()
  status: string;

  @IsString()
  submittedAt: string;

  @IsOptional()
  @IsString()
  lastUpdate?: string;

  @IsOptional()
  @IsNumber()
  viewCount?: number;
}

export class AnalyticsDto {
  @IsNumber()
  totalApplications: number;

  @IsNumber()
  totalViews: number;

  @IsNumber()
  totalInterviews: number;

  @IsNumber()
  totalOffers: number;

  @IsNumber()
  applicationToViewRate: number;

  @IsNumber()
  viewToInterviewRate: number;

  @IsNumber()
  interviewToOfferRate: number;

  @IsNumber()
  avgResponseTime: number;

  @IsNumber()
  successRate: number;

  @IsArray()
  applicationsByStatus: StatusCount[];
}

interface StatusCount {
  status: string;
  count: number;
}
