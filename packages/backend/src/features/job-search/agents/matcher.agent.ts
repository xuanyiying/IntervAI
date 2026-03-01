/**
 * Matcher Agent
 *
 * Responsible for matching jobs with user profiles using
 * semantic similarity, skill matching, and preference alignment
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  JobPosting,
  UserProfile,
  JobMatch,
  Skill,
  SkillGap,
  SkillLevel,
  SearchCriteria,
} from '../interfaces/job-search.interface';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatcherAgent {
  private readonly logger = new Logger(MatcherAgent.name);

  // Matching weights
  private readonly weights = {
    semantic: 0.4,
    skillMatch: 0.3,
    preference: 0.2,
    temporal: 0.1,
  };

  private embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: 'text-embedding-3-small',
    });
  }

  /**
   * Match jobs with a user profile
   */
  async matchJobs(
    jobs: JobPosting[],
    userId: string,
    userProfile: UserProfile
  ): Promise<JobMatch[]> {
    this.logger.log(`Matching ${jobs.length} jobs for user ${userId}`);

    const matches: JobMatch[] = [];

    for (const job of jobs) {
      try {
        const match = await this.calculateMatch(job, userProfile);

        // Only include matches above threshold
        if (match.matchScore >= 0.5) {
          matches.push(match);
        }
      } catch (error) {
        this.logger.error(`Error matching job ${job.id}:`, error);
        // Continue with next job
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    this.logger.log(`Found ${matches.length} matching jobs`);

    return matches;
  }

  /**
   * Calculate comprehensive match between job and user
   */
  async calculateMatch(job: JobPosting, user: UserProfile): Promise<JobMatch> {
    // Calculate individual scores
    const semanticScore = await this.calculateSemanticSimilarity(job, user);
    const skillMatchScore = this.calculateSkillMatch(job, user);
    const preferenceScore = this.calculatePreferenceAlignment(job, user);
    const temporalScore = this.calculateTemporalScore(job);

    // Calculate weighted overall score
    const matchScore =
      semanticScore * this.weights.semantic +
      skillMatchScore * this.weights.skillMatch +
      preferenceScore * this.weights.preference +
      temporalScore * this.weights.temporal;

    // Identify skill gaps
    const skillGaps = this.identifySkillGaps(job, user);

    // Generate match explanation
    const explanation = this.generateMatchExplanation(
      job,
      user,
      matchScore,
      skillGaps
    );

    // Identify strengths and concerns
    const strengths = this.identifyStrengths(job, user);
    const concerns = this.identifyConcerns(job, user, skillGaps);

    return {
      jobId: job.id,
      userId: user.userId,
      matchScore,
      semanticScore,
      skillMatchScore,
      preferenceScore,
      temporalScore,
      matchedSkills: this.getMatchedSkills(job, user),
      missingSkills: this.getMissingSkills(job, user),
      skillGaps,
      strengths,
      concerns,
      explanation,
      job,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate semantic similarity using vector embeddings
   */
  private async calculateSemanticSimilarity(
    job: JobPosting,
    user: UserProfile
  ): Promise<number> {
    // In production, would use actual vector embeddings and cosine similarity
    // This is a simplified implementation

    // Get or compute embeddings
    const jobVector =
      job.skillsVector || (await this.computeEmbedding(this.getJobText(job)));
    const userVector =
      user.skillsVector ||
      (await this.computeEmbedding(this.getUserText(user)));

    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(jobVector, userVector);

    // Normalize to 0-1 range
    return (similarity + 1) / 2;
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillMatch(job: JobPosting, user: UserProfile): number {
    const jobSkills = job.preferredSkills || [];
    const userSkills = user.skills.map((s) => s.name);

    if (jobSkills.length === 0) {
      return 0.5; // Neutral score if no skills specified
    }

    const matchedSkills = jobSkills.filter((skill) =>
      userSkills.some((userSkill) => this.skillsMatch(skill, userSkill))
    );

    const matchRatio = matchedSkills.length / jobSkills.length;

    // Bonus for having more skills than required
    const bonus = Math.min(0.2, (userSkills.length / jobSkills.length) * 0.1);

    return Math.min(1.0, matchRatio + bonus);
  }

  /**
   * Calculate preference alignment score
   */
  private calculatePreferenceAlignment(
    job: JobPosting,
    user: UserProfile
  ): number {
    const prefs = user.preferences;
    let score = 0;
    let factors = 0;

    // Remote policy match
    if (prefs.remotePreference) {
      const remoteMatch = job.remotePolicy === prefs.remotePreference ? 1 : 0;
      score += remoteMatch;
      factors++;
    }

    // Location match
    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      const locationMatch = prefs.preferredLocations.some(
        (loc) =>
          job.location.city.toLowerCase().includes(loc.toLowerCase()) ||
          job.location.state?.toLowerCase().includes(loc.toLowerCase())
      )
        ? 1
        : 0;
      score += locationMatch;
      factors++;
    }

    // Salary match
    if (prefs.minSalary && job.salary) {
      const salaryMatch = job.salary.min >= prefs.minSalary ? 1 : 0.5;
      score += salaryMatch;
      factors++;
    }

    // Employment type match
    if (prefs.preferredRoles && prefs.preferredRoles.length > 0) {
      const roleMatch = prefs.preferredRoles.some((role) =>
        job.title.toLowerCase().includes(role.toLowerCase())
      )
        ? 1
        : 0;
      score += roleMatch;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate temporal score (job freshness, application velocity)
   */
  private calculateTemporalScore(job: JobPosting): number {
    const now = new Date();
    const postedDate = new Date(job.postedDate);

    // Calculate age in hours
    const ageInHours =
      (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);

    // Newer jobs get higher scores
    let freshnessScore: number;
    if (ageInHours < 24) {
      freshnessScore = 1.0;
    } else if (ageInHours < 72) {
      freshnessScore = 0.8;
    } else if (ageInHours < 168) {
      // 1 week
      freshnessScore = 0.6;
    } else if (ageInHours < 720) {
      // 30 days
      freshnessScore = 0.4;
    } else {
      freshnessScore = 0.2;
    }

    return freshnessScore;
  }

  /**
   * Identify skill gaps between job requirements and user skills
   */
  private identifySkillGaps(job: JobPosting, user: UserProfile): SkillGap[] {
    const jobSkills = job.preferredSkills || [];
    const userSkills = user.skills;

    const gaps: SkillGap[] = [];

    for (const jobSkill of jobSkills) {
      const matchingUserSkill = userSkills.find((us) =>
        this.skillsMatch(jobSkill, us.name)
      );

      if (!matchingUserSkill) {
        // Skill is completely missing
        gaps.push({
          skill: jobSkill,
          requiredLevel: SkillLevel.INTERMEDIATE,
          userLevel: SkillLevel.BEGINNER,
          gap: 1.0,
          priority: 'high',
        });
      } else {
        // Check level gap
        const requiredLevel = this.extractSkillLevel(jobSkill, job.description);
        const userLevel = matchingUserSkill.level || SkillLevel.INTERMEDIATE;

        const levelDiff = this.getLevelDifference(requiredLevel, userLevel);

        if (levelDiff > 0) {
          gaps.push({
            skill: jobSkill,
            requiredLevel: requiredLevel,
            userLevel: userLevel,
            gap: levelDiff,
            priority: levelDiff > 1 ? 'high' : 'medium',
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Generate human-readable match explanation
   */
  private generateMatchExplanation(
    job: JobPosting,
    user: UserProfile,
    matchScore: number,
    skillGaps: SkillGap[]
  ): string {
    const highMatch = matchScore >= 0.8;
    const mediumMatch = matchScore >= 0.6;

    let explanation = '';

    if (highMatch) {
      explanation = `Excellent match! Your skills and experience align very well with this ${job.title} position at ${job.company}. `;
    } else if (mediumMatch) {
      explanation = `Good match! You have many of the required qualifications for this ${job.title} role. `;
    } else {
      explanation = `Moderate match. While you meet some requirements, there are notable gaps for this ${job.title} position. `;
    }

    // Add skill gap information
    if (skillGaps.length > 0) {
      const highPriorityGaps = skillGaps.filter((g) => g.priority === 'high');
      if (highPriorityGaps.length > 0) {
        explanation += `Key areas to highlight or develop: ${highPriorityGaps
          .slice(0, 3)
          .map((g) => g.skill)
          .join(', ')}. `;
      }
    }

    // Add positive aspects
    const matchedCount = this.getMatchedSkills(job, user).length;
    if (matchedCount > 5) {
      explanation += `You match ${matchedCount} of the required skills, which is strong. `;
    }

    return explanation.trim();
  }

  /**
   * Identify strengths in the match
   */
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

    if (job.remotePolicy === user.preferences.remotePreference) {
      strengths.push('Perfect remote work arrangement match');
    }

    if (
      job.salary &&
      user.preferences.minSalary &&
      job.salary.min >= user.preferences.minSalary
    ) {
      strengths.push('Salary meets expectations');
    }

    return strengths;
  }

  /**
   * Identify concerns in the match
   */
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

  // Helper methods

  private async computeEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim() === '') {
        const dimensions = 1536; // text-embedding-3-small uses 1536 by default
        return Array(dimensions).fill(0.1); // consistent dummy vector
      }
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      this.logger.error(
        'Failed to compute embedding, falling back to dummy vector:',
        error
      );
      const dimensions = 1536;
      return Array(dimensions).fill(0.1); // consistent dummy vector
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private getJobText(job: JobPosting): string {
    return `${job.title} ${job.company} ${job.description} ${job.preferredSkills.join(' ')}`;
  }

  private getUserText(user: UserProfile): string {
    return `${user.experienceSummary || ''} ${user.careerGoals || ''} ${user.skills.map((s) => s.name).join(' ')}`;
  }

  private skillsMatch(skill1: string, skill2: string): boolean {
    return skill1.toLowerCase() === skill2.toLowerCase();
  }

  private getMatchedSkills(job: JobPosting, user: UserProfile): string[] {
    const jobSkills = job.preferredSkills || [];
    const userSkills = user.skills.map((s) => s.name);

    return jobSkills.filter((skill) =>
      userSkills.some((userSkill) => this.skillsMatch(skill, userSkill))
    );
  }

  private getMissingSkills(job: JobPosting, user: UserProfile): string[] {
    const jobSkills = job.preferredSkills || [];
    const matchedSkills = this.getMatchedSkills(job, user);

    return jobSkills.filter((skill) => !matchedSkills.includes(skill));
  }

  private extractSkillLevel(
    skillName: string,
    description: string
  ): SkillLevel {
    const lowerDesc = description.toLowerCase();
    const skillLower = skillName.toLowerCase();

    if (
      lowerDesc.includes(`expert ${skillLower}`) ||
      lowerDesc.includes(`${skillLower} expert`)
    ) {
      return SkillLevel.EXPERT;
    }
    if (
      lowerDesc.includes(`advanced ${skillLower}`) ||
      lowerDesc.includes(`${skillLower} advanced`)
    ) {
      return SkillLevel.ADVANCED;
    }
    if (
      lowerDesc.includes(`intermediate ${skillLower}`) ||
      lowerDesc.includes(`${skillLower} intermediate`)
    ) {
      return SkillLevel.INTERMEDIATE;
    }

    return SkillLevel.INTERMEDIATE; // Default
  }

  private getLevelDifference(required: SkillLevel, actual: SkillLevel): number {
    const levelMap = {
      [SkillLevel.BEGINNER]: 0,
      [SkillLevel.INTERMEDIATE]: 1,
      [SkillLevel.ADVANCED]: 2,
      [SkillLevel.EXPERT]: 3,
    };

    return levelMap[required] - levelMap[actual];
  }

  private calculateYearsOfExperience(user: UserProfile): number {
    if (!user.experience || user.experience.length === 0) {
      return 0;
    }

    const now = new Date();
    let totalMonths = 0;

    for (const exp of user.experience) {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent ? now : new Date(exp.endDate!);
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }

    return Math.floor(totalMonths / 12);
  }

  private extractRequiredExperience(description: string): number {
    const patterns = [
      /(\d+)\+?\s*(?:years?|yrs?)/i,
      /minimum\s*(\d+)\s*years?/i,
      /at least\s*(\d+)\s*years?/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return 0; // Default
  }
}
