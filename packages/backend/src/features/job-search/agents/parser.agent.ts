/**
 * Parser Agent
 *
 * Responsible for extracting and structuring job data from raw HTML/content
 * using NLP and entity extraction techniques
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  RawJob,
  JobPosting,
  ParserResult,
  ParserError,
  Skill,
  SkillCategory,
  SkillLevel,
  Location,
  SalaryRange,
  EmploymentType,
  ExperienceLevel,
  RemotePolicy,
  ApplicationMethod,
} from '../interfaces/job-search.interface';

@Injectable()
export class ParserAgent {
  private readonly logger = new Logger(ParserAgent.name);

  // Common skill patterns
  private readonly skillPatterns: Map<string, RegExp> = new Map([
    ['JavaScript', /\bjavascript\b|\bjs\b|\bnode\.?js\b|\bes6\b/i],
    ['TypeScript', /\btypescript\b|\bts\b/i],
    ['React', /\breact\b|\breact\.?js\b/i],
    ['Angular', /\bangular\b|\bangularjs\b/i],
    ['Vue', /\bvue\b|\bvue\.?js\b/i],
    ['Python', /\bpython\b|\bpy\b/i],
    ['Java', /\bjava\b(?!script)/i],
    ['Go', /\bgolang\b|\bgo\b/i],
    ['Rust', /\brust\b/i],
    ['AWS', /\baws\b|\bamazon web services\b/i],
    ['Docker', /\bdocker\b/i],
    ['Kubernetes', /\bkubernetes\b|\bk8s\b/i],
    ['PostgreSQL', /\bpostgresql\b|\bpostgres\b/i],
    ['MongoDB', /\bmongodb\b|\bmongo\b/i],
    ['GraphQL', /\bgraphql\b/i],
    ['REST', /\brest\b|\brestful\b/i],
    ['Git', /\bgit\b/i],
    ['CI/CD', /\bci\/cd\b|\bcontinuous integration\b/i],
    ['Agile', /\bagile\b|\bscrum\b/i],
    ['Machine Learning', /\bmachine learning\b|\bml\b/i],
    ['Deep Learning', /\bdeep learning\b/i],
    ['TensorFlow', /\btensorflow\b/i],
    ['PyTorch', /\bpytorch\b/i],
  ]);

  /**
   * Parse a raw job into structured format
   */
  async parseJob(rawJob: RawJob): Promise<ParserResult> {
    this.logger.debug(`Parsing job: ${rawJob.id}`);

    try {
      const errors: ParserError[] = [];

      // Extract basic information
      const jobPosting: Partial<JobPosting> = {
        id: rawJob.id,
        externalId: rawJob.externalId,
        platform: rawJob.platform,
        scrapedAt: rawJob.scrapedAt,
        lastUpdated: new Date(),
        isActive: true,
      };

      // In production, this would fetch the actual job page and parse HTML
      // For now, we'll simulate with mock data
      const parsedData = await this.extractJobData(rawJob);

      // Extract title
      jobPosting.title =
        parsedData.title || this.extractTitle(rawJob) || undefined;
      if (!jobPosting.title) {
        errors.push({
          field: 'title',
          error: 'Title not found',
          severity: 'critical',
        });
      }

      // Extract company
      jobPosting.company =
        parsedData.company || this.extractCompany(rawJob) || undefined;
      if (!jobPosting.company) {
        errors.push({
          field: 'company',
          error: 'Company not found',
          severity: 'critical',
        });
      }

      // Extract location
      jobPosting.location =
        parsedData.location || this.extractLocation(rawJob) || undefined;

      // Extract remote policy
      jobPosting.remotePolicy =
        parsedData.remotePolicy || this.extractRemotePolicy(rawJob);

      // Extract salary
      jobPosting.salary =
        parsedData.salary || this.extractSalary(rawJob) || undefined;
      jobPosting.currency = parsedData.currency || 'USD';

      // Extract description
      jobPosting.description = parsedData.description || '';
      if (!jobPosting.description) {
        errors.push({
          field: 'description',
          error: 'Description not found',
          severity: 'critical',
        });
      }

      // Extract and identify skills
      const skills = this.identifySkills(jobPosting.description);
      jobPosting.preferredSkills = skills.map((s) => s.name);

      // Extract requirements
      jobPosting.requirements = this.extractRequirements(rawJob);

      // Extract experience level
      jobPosting.experienceLevel = this.extractExperienceLevel(rawJob);

      // Extract employment type
      jobPosting.employmentType = this.extractEmploymentType(rawJob);

      // Extract application URL and method
      jobPosting.applicationUrl = rawJob.url;
      jobPosting.applicationMethod = this.determineApplicationMethod(rawJob);

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(jobPosting, errors);

      // Create final job posting
      const result: ParserResult = {
        success: errors.filter((e) => e.severity === 'critical').length === 0,
        job: jobPosting as JobPosting,
        qualityScore,
        missingFields: errors.map((e) => e.field),
        errors,
      };

      this.logger.debug(
        `Parsing complete for job ${rawJob.id}, quality score: ${qualityScore}`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to parse job ${rawJob.id}:`, error);

      return {
        success: false,
        qualityScore: 0,
        missingFields: ['all'],
        errors: [
          {
            field: 'parsing',
            error: error instanceof Error ? error.message : String(error),
            severity: 'critical',
          },
        ],
      };
    }
  }

  /**
   * Extract job data from raw job
   */
  private async extractJobData(rawJob: RawJob): Promise<Partial<JobPosting>> {
    // If it's from Arbeitnow or similar JSON API, use rawJson
    if (rawJob.rawJson) {
      const json = rawJob.rawJson;
      return {
        title: json.title,
        company: json.company_name,
        location: {
          city: json.location || 'Unknown',
          country: 'Unknown',
        },
        remotePolicy: json.remote ? RemotePolicy.REMOTE : RemotePolicy.ONSITE,
        description: json.description,
        // Optional fields could be extracted here if available
      };
    }

    // Fallback Mock implementation for HTML pages
    return {
      title: 'Unknown Title',
      company: 'Unknown Company',
      location: {
        city: 'Unknown',
        country: 'Unknown',
      },
      remotePolicy: RemotePolicy.FLEXIBLE,
      description: 'No description provided.',
    };
  }

  /**
   * Extract job title from raw job
   */
  private extractTitle(rawJob: RawJob): string | undefined {
    // Implementation would parse HTML to extract title
    return undefined;
  }

  /**
   * Extract company name from raw job
   */
  private extractCompany(rawJob: RawJob): string | undefined {
    // Implementation would parse HTML to extract company
    return undefined;
  }

  /**
   * Extract location from raw job
   */
  private extractLocation(rawJob: RawJob): Location | undefined {
    // Implementation would parse HTML to extract location
    return undefined;
  }

  /**
   * Extract remote policy from job description
   */
  private extractRemotePolicy(rawJob: RawJob): RemotePolicy {
    const text = JSON.stringify(rawJob).toLowerCase();

    if (text.includes('fully remote') || text.includes('100% remote')) {
      return RemotePolicy.REMOTE;
    }
    if (text.includes('hybrid') || text.includes('partially remote')) {
      return RemotePolicy.HYBRID;
    }
    if (text.includes('onsite') || text.includes('in-office')) {
      return RemotePolicy.ONSITE;
    }

    return RemotePolicy.FLEXIBLE;
  }

  /**
   * Extract salary information from job description
   */
  private extractSalary(rawJob: RawJob): SalaryRange | undefined {
    const text = JSON.stringify(rawJob);

    // Regex to match salary ranges
    const salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*)\s*[-–to]+\s*\$(\d{1,3}(?:,\d{3})*)/i,
      /\$(\d{1,3}(?:,\d{3})*)\s*(?:k|K)/i,
      /(\d{1,3}(?:,\d{3})*)\s*[-–to]+\s*(\d{1,3}(?:,\d{3})*)\s*(?:k|K)/i,
    ];

    for (const pattern of salaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        const min = parseInt(match[1].replace(/,/g, ''));
        const max = match[2] ? parseInt(match[2].replace(/,/g, '')) : min;

        // Adjust if in thousands
        const multiplier = text.includes('k') || text.includes('K') ? 1000 : 1;

        return {
          min: min * multiplier,
          max: max * multiplier,
          period: 'yearly',
          currency: 'USD',
          isEstimated: false,
        };
      }
    }

    return undefined;
  }

  /**
   * Identify skills in job description using pattern matching
   */
  private identifySkills(description: string): Skill[] {
    const skills: Skill[] = [];
    const lowerDescription = description.toLowerCase();

    this.skillPatterns.forEach((pattern, skillName) => {
      if (pattern.test(lowerDescription)) {
        skills.push({
          name: skillName,
          category: this.categorizeSkill(skillName),
          isRequired: this.isSkillRequired(description, skillName),
        });
      }
    });

    return skills;
  }

  /**
   * Categorize a skill
   */
  private categorizeSkill(skillName: string): SkillCategory {
    const technicalSkills = [
      'JavaScript',
      'TypeScript',
      'React',
      'Angular',
      'Vue',
      'Python',
      'Java',
      'Go',
      'Rust',
      'AWS',
      'Docker',
      'Kubernetes',
      'PostgreSQL',
      'MongoDB',
      'GraphQL',
      'REST',
      'Git',
      'CI/CD',
      'Machine Learning',
      'Deep Learning',
      'TensorFlow',
      'PyTorch',
    ];

    if (technicalSkills.includes(skillName)) {
      return SkillCategory.TECHNICAL;
    }

    return SkillCategory.TECHNICAL; // Default
  }

  /**
   * Determine if a skill is required or preferred
   */
  private isSkillRequired(description: string, skillName: string): boolean {
    const lowerDesc = description.toLowerCase();
    const skillLower = skillName.toLowerCase();

    // Check for strong requirement indicators
    const requiredPatterns = [
      new RegExp(`required.*${skillLower}`, 'i'),
      new RegExp(`must have.*${skillLower}`, 'i'),
      new RegExp(`essential.*${skillLower}`, 'i'),
      new RegExp(`needs.*${skillLower}`, 'i'),
    ];

    const preferredPatterns = [
      new RegExp(`preferred.*${skillLower}`, 'i'),
      new RegExp(`nice to have.*${skillLower}`, 'i'),
      new RegExp(`bonus.*${skillLower}`, 'i'),
      new RegExp(`familiarity with.*${skillLower}`, 'i'),
    ];

    for (const pattern of requiredPatterns) {
      if (pattern.test(lowerDesc)) {
        return true;
      }
    }

    for (const pattern of preferredPatterns) {
      if (pattern.test(lowerDesc)) {
        return false;
      }
    }

    // Default to required if mentioned in requirements section
    return (
      lowerDesc.includes('requirements') &&
      lowerDesc.indexOf('requirements') < lowerDesc.indexOf(skillLower)
    );
  }

  /**
   * Extract requirements from job description
   */
  private extractRequirements(rawJob: RawJob): string[] {
    // In production, would parse HTML structure
    // For now, return empty array
    return [];
  }

  /**
   * Extract experience level from job description
   */
  private extractExperienceLevel(rawJob: RawJob): ExperienceLevel {
    const text = JSON.stringify(rawJob).toLowerCase();

    if (
      text.includes('executive') ||
      text.includes('vp') ||
      text.includes('chief')
    ) {
      return ExperienceLevel.EXECUTIVE;
    }
    if (text.includes('director')) {
      return ExperienceLevel.DIRECTOR;
    }
    if (text.includes('manager') || text.includes('lead')) {
      return ExperienceLevel.MANAGER;
    }
    if (text.includes('senior')) {
      return ExperienceLevel.SENIOR;
    }
    if (text.includes('mid') || text.includes('middle')) {
      return ExperienceLevel.MID;
    }
    if (text.includes('entry') || text.includes('junior')) {
      return ExperienceLevel.ENTRY;
    }

    return ExperienceLevel.MID; // Default
  }

  /**
   * Extract employment type from job description
   */
  private extractEmploymentType(rawJob: RawJob): EmploymentType {
    const text = JSON.stringify(rawJob).toLowerCase();

    if (text.includes('intern') || text.includes('internship')) {
      return EmploymentType.INTERNSHIP;
    }
    if (text.includes('contract') || text.includes('contractor')) {
      return EmploymentType.CONTRACT;
    }
    if (text.includes('part-time') || text.includes('part time')) {
      return EmploymentType.PART_TIME;
    }
    if (text.includes('temporary') || text.includes('temp')) {
      return EmploymentType.TEMPORARY;
    }

    return EmploymentType.FULL_TIME; // Default
  }

  /**
   * Determine application method
   */
  private determineApplicationMethod(rawJob: RawJob): ApplicationMethod {
    const text = JSON.stringify(rawJob).toLowerCase();

    if (text.includes('easy apply') || text.includes('quick apply')) {
      return ApplicationMethod.EASY_APPLY;
    }
    if (text.includes('email')) {
      return ApplicationMethod.EMAIL;
    }
    if (text.includes('external')) {
      return ApplicationMethod.EXTERNAL;
    }

    return ApplicationMethod.DIRECT;
  }

  /**
   * Calculate quality score for parsed job
   */
  private calculateQualityScore(
    job: Partial<JobPosting>,
    errors: ParserError[]
  ): number {
    let score = 100;

    // Deduct for critical errors
    const criticalErrors = errors.filter((e) => e.severity === 'critical');
    score -= criticalErrors.length * 20;

    // Deduct for warnings
    const warnings = errors.filter((e) => e.severity === 'warning');
    score -= warnings.length * 10;

    // Bonus for complete information
    const fields: (keyof JobPosting)[] = [
      'title',
      'company',
      'location',
      'description',
      'salary',
      'preferredSkills',
    ];
    const presentFields = fields.filter(
      (f) => job[f] !== undefined && job[f] !== null
    );
    score += (presentFields.length / fields.length) * 20;

    // Bonus for skills identified
    if (job.preferredSkills && job.preferredSkills.length > 0) {
      score += Math.min(10, job.preferredSkills.length);
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
}
