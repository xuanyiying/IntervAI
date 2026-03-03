import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JobPosting,
  UserProfile,
  JobMatch,
  SkillGap,
  SearchCriteria,
} from '../interfaces/job-search.interface';
import { OpenAIEmbeddings } from '@langchain/openai';
import { JobSearchConfig } from '../config';

interface EmbeddingCache {
  text: string;
  vector: number[];
  timestamp: number;
}

interface MatchingError {
  jobId: string;
  error: string;
  timestamp: Date;
}

@Injectable()
export class MatcherAgent {
  private readonly logger = new Logger(MatcherAgent.name);
  private readonly config: JobSearchConfig['matching'];
  private embeddings: OpenAIEmbeddings;
  private embeddingCache: Map<string, EmbeddingCache> = new Map();
  private readonly cacheTTL = 3600000;
  private readonly maxCacheSize = 1000;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<JobSearchConfig['matching']>('jobSearch.matching')!;

    const openAIApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAIApiKey) {
      this.logger.warn('OPENAI_API_KEY not configured, embedding features will be limited');
    }

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey || 'dummy-key',
      modelName: this.config.embeddingModel,
    });
  }

  async matchJobs(
    jobs: JobPosting[],
    userId: string,
    userProfile: UserProfile
  ): Promise<JobMatch[]> {
    this.logger.log(`Matching ${jobs.length} jobs for user ${userId}`);

    if (!jobs || jobs.length === 0) {
      this.logger.warn('No jobs provided for matching');
      return [];
    }

    if (!userProfile || !userProfile.userId) {
      this.logger.error('Invalid user profile provided');
      throw new Error('Invalid user profile: missing userId');
    }

    const matches: JobMatch[] = [];
    const errors: MatchingError[] = [];

    const userEmbedding = await this.getOrCreateUserEmbedding(userProfile);

    for (const job of jobs) {
      try {
        const match = await this.calculateMatch(job, userProfile, userEmbedding);

        if (match.matchScore >= this.config.minMatchScore) {
          matches.push(match);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error matching job ${job.id}: ${errorMessage}`);
        errors.push({
          jobId: job.id,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    if (errors.length > 0) {
      this.logger.warn(
        `Matching completed with ${errors.length} errors out of ${jobs.length} jobs`
      );
    }

    this.logger.log(
      `Found ${matches.length} matching jobs (threshold: ${this.config.minMatchScore})`
    );

    return matches;
  }

  private async calculateMatch(
    job: JobPosting,
    user: UserProfile,
    userEmbedding: number[]
  ): Promise<JobMatch> {
    const semanticScore = await this.calculateSemanticSimilarity(job, userEmbedding);
    const skillMatchScore = this.calculateSkillMatch(job, user);
    const preferenceScore = this.calculatePreferenceAlignment(job, user);
    const temporalScore = this.calculateTemporalScore(job);

    const matchScore =
      semanticScore * this.config.weights.semantic +
      skillMatchScore * this.config.weights.skillMatch +
      preferenceScore * this.config.weights.preference +
      temporalScore * this.config.weights.temporal;

    const skillGaps = this.identifySkillGaps(job, user);
    const strengths = this.identifyStrengths(job, user);
    const concerns = this.identifyConcerns(job, user, skillGaps);
    const matchReasons = this.generateMatchReasons(job, user, matchScore, skillGaps);

    return {
      jobId: job.id,
      userId: user.userId,
      matchScore: Math.round(matchScore * 1000) / 1000,
      semanticScore: Math.round(semanticScore * 1000) / 1000,
      skillMatchScore: Math.round(skillMatchScore * 1000) / 1000,
      preferenceScore: Math.round(preferenceScore * 1000) / 1000,
      temporalScore: Math.round(temporalScore * 1000) / 1000,
      matchedSkills: this.getMatchedSkills(job, user),
      missingSkills: this.getMissingSkills(job, user),
      skillGaps,
      strengths,
      concerns,
      recommendations: this.generateRecommendations(skillGaps),
      matchReasons,
      job,
    };
  }

  private async getOrCreateUserEmbedding(user: UserProfile): Promise<number[]> {
    const userText = this.getUserText(user);
    const cacheKey = `user-${user.userId}`;

    const cached = this.embeddingCache.get(cacheKey);
    if (cached && cached.text === userText && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.vector;
    }

    const vector = await this.computeEmbedding(userText, cacheKey);
    return vector;
  }

  private async calculateSemanticSimilarity(
    job: JobPosting,
    userEmbedding: number[]
  ): Promise<number> {
    const jobText = this.getJobText(job);
    const jobVector = await this.computeEmbedding(jobText, `job-${job.id}`);

    const similarity = this.cosineSimilarity(jobVector, userEmbedding);
    return (similarity + 1) / 2;
  }

  private calculateSkillMatch(job: JobPosting, user: UserProfile): number {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    if (jobSkills.length === 0) {
      return 0.5;
    }

    const matchedSkills = jobSkills.filter((skill) =>
      userSkills.some((userSkill) =>
        this.skillsMatch(skill, userSkill)
      )
    );

    const matchRatio = matchedSkills.length / jobSkills.length;

    const bonus = Math.min(0.2, (userSkills.length / jobSkills.length) * 0.1);

    return Math.min(1.0, matchRatio + bonus);
  }

  private calculatePreferenceAlignment(job: JobPosting, user: UserProfile): number {
    const prefs = user.preferences;
    if (!prefs) return 0.5;

    let score = 0;
    let factors = 0;

    if (prefs.remotePreference && job.remotePolicy) {
      const remoteMatch = job.remotePolicy === prefs.remotePreference ? 1 : 0.5;
      score += remoteMatch;
      factors++;
    }

    if (prefs.preferredLocations && prefs.preferredLocations.length > 0 && job.location) {
      const jobLocation = job.location.toLowerCase();
      const locationMatch = prefs.preferredLocations.some(
        (loc) => jobLocation.includes(loc.toLowerCase())
      )
        ? 1
        : 0;
      score += locationMatch;
      factors++;
    }

    if (prefs.minSalary && job.salary?.min) {
      const salaryMatch = job.salary.min >= prefs.minSalary ? 1 : 0.5;
      score += salaryMatch;
      factors++;
    }

    if (prefs.preferredRoles && prefs.preferredRoles.length > 0) {
      const roleMatch = prefs.preferredRoles.some((role) =>
        job.title.toLowerCase().includes(role.toLowerCase())
      )
        ? 1
        : 0;
      score += roleMatch;
      factors++;
    }

    if (prefs.excludedCompanies && prefs.excludedCompanies.length > 0) {
      const isExcluded = prefs.excludedCompanies.some(
        (company) => job.company.toLowerCase().includes(company.toLowerCase())
      );
      if (isExcluded) {
        return 0;
      }
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateTemporalScore(job: JobPosting): number {
    if (!job.postedAt) {
      return 0.5;
    }

    const now = new Date();
    const postedDate = new Date(job.postedAt);

    if (isNaN(postedDate.getTime())) {
      return 0.5;
    }

    const ageInHours = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);

    if (ageInHours < 0) {
      return 1.0;
    }

    if (ageInHours < 24) {
      return 1.0;
    } else if (ageInHours < 72) {
      return 0.8;
    } else if (ageInHours < 168) {
      return 0.6;
    } else if (ageInHours < 720) {
      return 0.4;
    } else {
      return 0.2;
    }
  }

  private identifySkillGaps(job: JobPosting, user: UserProfile): SkillGap[] {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    const gaps: SkillGap[] = [];

    for (const jobSkill of jobSkills) {
      const matchingUserSkill = userSkills.find((us) =>
        this.skillsMatch(jobSkill, us)
      );

      if (!matchingUserSkill) {
        gaps.push({
          skill: jobSkill,
          requiredLevel: 'intermediate',
          userLevel: 'beginner',
          gap: 1.0,
          priority: 'high',
        });
      }
    }

    return gaps;
  }

  private generateMatchReasons(
    job: JobPosting,
    user: UserProfile,
    matchScore: number,
    skillGaps: SkillGap[]
  ): string[] {
    const reasons: string[] = [];

    const highMatch = matchScore >= 0.8;
    const mediumMatch = matchScore >= 0.6;

    if (highMatch) {
      reasons.push(`Excellent match for ${job.title} position at ${job.company}`);
    } else if (mediumMatch) {
      reasons.push(`Good match for ${job.title} role`);
    } else {
      reasons.push(`Moderate match with some skill gaps`);
    }

    const highPriorityGaps = skillGaps.filter((g) => g.priority === 'high');
    if (highPriorityGaps.length > 0) {
      reasons.push(`Key areas to develop: ${highPriorityGaps.slice(0, 3).map((g) => g.skill).join(', ')}`);
    }

    const matchedCount = this.getMatchedSkills(job, user).length;
    if (matchedCount > 5) {
      reasons.push(`Matches ${matchedCount} required skills`);
    }

    return reasons;
  }

  private generateRecommendations(skillGaps: SkillGap[]): string[] {
    return skillGaps.slice(0, 5).map((gap) =>
      `Consider developing skills in ${gap.skill}`
    );
  }

  private identifyStrengths(job: JobPosting, user: UserProfile): string[] {
    const strengths: string[] = [];

    const matchedSkills = this.getMatchedSkills(job, user);
    if (matchedSkills.length >= 5) {
      strengths.push(`Strong skill match (${matchedSkills.length} skills)`);
    }

    if (user.experience && user.experience.length > 0) {
      const yearsOfExperience = this.calculateYearsOfExperience(user);
      if (yearsOfExperience >= 5) {
        strengths.push(`${yearsOfExperience}+ years of experience`);
      }
    }

    if (job.remotePolicy && user.preferences?.remotePreference &&
      job.remotePolicy === user.preferences.remotePreference) {
      strengths.push('Perfect remote work arrangement match');
    }

    if (
      job.salary?.min &&
      user.preferences?.minSalary &&
      job.salary.min >= user.preferences.minSalary
    ) {
      strengths.push('Salary meets expectations');
    }

    return strengths;
  }

  private identifyConcerns(
    job: JobPosting,
    user: UserProfile,
    skillGaps: SkillGap[]
  ): string[] {
    const concerns: string[] = [];

    const highPriorityGaps = skillGaps.filter((g) => g.priority === 'high');
    if (highPriorityGaps.length >= 3) {
      concerns.push(
        `Multiple critical skill gaps (${highPriorityGaps.length} skills)`
      );
    }

    const missingSkills = this.getMissingSkills(job, user);
    if (missingSkills.length > 0) {
      concerns.push(
        `Missing key skills: ${missingSkills.slice(0, 3).join(', ')}`
      );
    }

    if (user.experience && user.experience.length > 0) {
      const yearsOfExperience = this.calculateYearsOfExperience(user);
      const requiredLevel = this.extractRequiredExperience(job.description);
      if (yearsOfExperience < requiredLevel) {
        concerns.push(
          `Less experience than required (${yearsOfExperience} vs ${requiredLevel}+ years)`
        );
      }
    }

    return concerns;
  }

  private async computeEmbedding(text: string, cacheKey: string): Promise<number[]> {
    if (!text || text.trim() === '') {
      return this.getDefaultVector();
    }

    try {
      const vector = await this.embeddings.embedQuery(text);

      if (this.embeddingCache.size >= this.maxCacheSize) {
        const oldestKey = this.embeddingCache.keys().next().value;
        if (oldestKey) {
          this.embeddingCache.delete(oldestKey);
        }
      }

      this.embeddingCache.set(cacheKey, {
        text,
        vector,
        timestamp: Date.now(),
      });

      return vector;
    } catch (error) {
      this.logger.error(
        `Failed to compute embedding for ${cacheKey}: ${error instanceof Error ? error.message : String(error)}`
      );
      return this.getDefaultVector();
    }
  }

  private getDefaultVector(): number[] {
    const dimensions = 1536;
    return Array(dimensions).fill(0.1);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      this.logger.warn(`Vector length mismatch: ${a.length} vs ${b.length}`);
      return 0;
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private getJobText(job: JobPosting): string {
    const parts = [
      job.title,
      job.company,
      job.description?.substring(0, 2000) || '',
      (job.skills || []).join(' '),
    ];
    return parts.filter(Boolean).join(' ');
  }

  private getUserText(user: UserProfile): string {
    const parts: string[] = [
      (user.skills || []).join(' '),
      (user.experience || []).map((e) => `${e.title} ${e.company} ${e.description || ''}`).join(' '),
      (user.targetRoles || []).join(' '),
    ];
    return parts.filter(Boolean).join(' ');
  }

  private skillsMatch(skill1: string, skill2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[\-.]/g, '');
    return normalize(skill1) === normalize(skill2);
  }

  private getMatchedSkills(job: JobPosting, user: UserProfile): string[] {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    return jobSkills.filter((skill) =>
      userSkills.some((userSkill) => this.skillsMatch(skill, userSkill))
    );
  }

  private getMissingSkills(job: JobPosting, user: UserProfile): string[] {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    return jobSkills.filter((skill) =>
      !userSkills.some((userSkill) => this.skillsMatch(skill, userSkill))
    );
  }

  private calculateYearsOfExperience(user: UserProfile): number {
    if (!user.experience || user.experience.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    for (const exp of user.experience) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }

    return Math.round(totalMonths / 12);
  }

  private extractRequiredExperience(description?: string): number {
    if (!description) return 0;

    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
      /(\d+)\+?\s*years?\s*(?:in|working\s*with)/i,
      /minimum\s*(?:of\s*)?(\d+)\s*years?/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return 0;
  }
}
