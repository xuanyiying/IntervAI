import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RawJob,
  JobPosting,
  ParserResult,
  ParserError,
  SalaryRange,
  RemotePolicy,
  ApplicationMethod,
} from '../interfaces/job-search.interface';
import { JobSearchConfig } from '../config';

interface ParsedHtmlData {
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  salary: string | null;
  requirements: string[];
}

interface SkillPattern {
  name: string;
  pattern: RegExp;
  aliases: string[];
}

@Injectable()
export class ParserAgent {
  private readonly logger = new Logger(ParserAgent.name);
  private readonly skillPatterns: SkillPattern[];
  private readonly config: JobSearchConfig['scraper'];

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<JobSearchConfig['scraper']>('jobSearch.scraper')!;
    this.skillPatterns = this.initializeSkillPatterns();
  }

  async parseJob(rawJob: RawJob): Promise<ParserResult> {
    this.logger.debug(`Parsing job: ${rawJob.id} from platform: ${rawJob.platform}`);

    try {
      const errors: ParserError[] = [];
      const jobPosting: Partial<JobPosting> = {
        id: rawJob.id,
        externalId: rawJob.externalId,
        platform: rawJob.platform,
        scrapedAt: rawJob.scrapedAt,
        lastUpdated: new Date(),
        isActive: true,
        tags: [],
        requirements: [],
        skills: [],
        benefits: [],
      };

      let parsedData: ParsedHtmlData;

      if (rawJob.rawJson) {
        parsedData = this.parseJsonData(rawJob.rawJson, rawJob.platform);
      } else if (rawJob.rawHtml) {
        parsedData = this.parseHtmlData(rawJob.rawHtml, rawJob.platform);
      } else {
        parsedData = this.getEmptyParsedData();
      }

      jobPosting.title = this.validateAndSetTitle(parsedData.title, errors);
      jobPosting.company = this.validateAndSetCompany(parsedData.company, errors);
      jobPosting.location = parsedData.location || undefined;
      jobPosting.remotePolicy = this.extractRemotePolicy(parsedData.description || '', rawJob);
      jobPosting.salary = this.parseSalary(parsedData.salary || parsedData.description || '');
      jobPosting.description = parsedData.description || '';
      jobPosting.requirements = parsedData.requirements.length > 0
        ? parsedData.requirements
        : this.extractRequirements(parsedData.description || '');

      const skills = this.identifySkills(jobPosting.description || '');
      jobPosting.skills = skills;

      jobPosting.applicationUrl = rawJob.url;
      jobPosting.applicationMethod = this.determineApplicationMethod(rawJob, parsedData.description || '');
      jobPosting.postedAt = this.extractPostedDate(rawJob);

      const qualityScore = this.calculateQualityScore(jobPosting, errors);

      const hasCriticalErrors = errors.filter((e) => e.severity === 'critical').length > 0;

      this.logger.debug(
        `Parsing complete for job ${rawJob.id}, quality score: ${qualityScore}, errors: ${errors.length}`
      );

      return {
        success: !hasCriticalErrors,
        job: jobPosting as JobPosting,
        qualityScore,
        missingFields: errors.map((e) => e.field),
        errors,
      };
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

  private parseJsonData(json: Record<string, any>, platform: string): ParsedHtmlData {
    switch (platform) {
      case 'arbeitnow':
        return this.parseArbeitnowJson(json);
      case 'linkedin':
        return this.parseLinkedInJson(json);
      case 'indeed':
        return this.parseIndeedJson(json);
      case 'glassdoor':
        return this.parseGlassdoorJson(json);
      default:
        return this.parseGenericJson(json);
    }
  }

  private parseArbeitnowJson(json: Record<string, any>): ParsedHtmlData {
    return {
      title: json.title || null,
      company: json.company_name || null,
      location: json.location || null,
      description: json.description || null,
      salary: null,
      requirements: [],
    };
  }

  private parseLinkedInJson(json: Record<string, any>): ParsedHtmlData {
    return {
      title: json.title || null,
      company: json.companyName || json.company || null,
      location: json.location || json.formattedLocation || null,
      description: json.description || json.jobDescription || null,
      salary: json.salary || json.compensation || null,
      requirements: json.requirements || [],
    };
  }

  private parseIndeedJson(json: Record<string, any>): ParsedHtmlData {
    return {
      title: json.title || null,
      company: json.company || json.companyName || null,
      location: json.location || json.formattedLocation || null,
      description: json.description || json.jobDescription || null,
      salary: json.salary || json.compensation || null,
      requirements: json.requirements || [],
    };
  }

  private parseGlassdoorJson(json: Record<string, any>): ParsedHtmlData {
    return {
      title: json.jobTitle || json.title || null,
      company: json.employer || json.company || null,
      location: json.location || null,
      description: json.description || json.jobDescription || null,
      salary: json.salary || null,
      requirements: [],
    };
  }

  private parseGenericJson(json: Record<string, any>): ParsedHtmlData {
    return {
      title: this.findFirstValue(json, ['title', 'jobTitle', 'position']),
      company: this.findFirstValue(json, ['company', 'companyName', 'employer', 'organization']),
      location: this.findFirstValue(json, ['location', 'city', 'address', 'place']),
      description: this.findFirstValue(json, ['description', 'jobDescription', 'summary', 'content']),
      salary: this.findFirstValue(json, ['salary', 'compensation', 'pay', 'wage']),
      requirements: json.requirements || json.qualifications || [],
    };
  }

  private parseHtmlData(html: string, platform: string): ParsedHtmlData {
    const sanitized = this.sanitizeHtml(html);

    switch (platform) {
      case 'linkedin':
        return this.parseLinkedInHtml(sanitized);
      case 'indeed':
        return this.parseIndeedHtml(sanitized);
      case 'glassdoor':
        return this.parseGlassdoorHtml(sanitized);
      default:
        return this.parseGenericHtml(sanitized);
    }
  }

  private parseLinkedInHtml(html: string): ParsedHtmlData {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>(.*?)<\/h1>/i);
    const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>(.*?)<\/a>/i);
    const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>(.*?)<\/span>/i);
    const descMatch = html.match(/<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    return {
      title: titleMatch ? this.cleanText(titleMatch[1]) : null,
      company: companyMatch ? this.cleanText(companyMatch[1]) : null,
      location: locationMatch ? this.cleanText(locationMatch[1]) : null,
      description: descMatch ? this.cleanText(descMatch[1]) : null,
      salary: null,
      requirements: [],
    };
  }

  private parseIndeedHtml(html: string): ParsedHtmlData {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>(.*?)<\/h1>/i);
    const companyMatch = html.match(/<div[^>]*class="[^"]*jobsearch-InlineCompanyRating[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const locationMatch = html.match(/<div[^>]*class="[^"]*jobsearch-JobInfoHeader-subtitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i);

    return {
      title: titleMatch ? this.cleanText(titleMatch[1]) : null,
      company: companyMatch ? this.cleanText(companyMatch[1]) : null,
      location: locationMatch ? this.cleanText(locationMatch[1]) : null,
      description: descMatch ? this.cleanText(descMatch[1]) : null,
      salary: null,
      requirements: [],
    };
  }

  private parseGlassdoorHtml(html: string): ParsedHtmlData {
    const titleMatch = html.match(/<h2[^>]*class="[^"]*job-title[^"]*"[^>]*>(.*?)<\/h2>/i);
    const companyMatch = html.match(/<span[^>]*class="[^"]*employer-name[^"]*"[^>]*>(.*?)<\/span>/i);
    const locationMatch = html.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/i);
    const descMatch = html.match(/<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    return {
      title: titleMatch ? this.cleanText(titleMatch[1]) : null,
      company: companyMatch ? this.cleanText(companyMatch[1]) : null,
      location: locationMatch ? this.cleanText(locationMatch[1]) : null,
      description: descMatch ? this.cleanText(descMatch[1]) : null,
      salary: null,
      requirements: [],
    };
  }

  private parseGenericHtml(html: string): ParsedHtmlData {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const companyMatch = html.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>(.*?)<\/span>/i);
    const locationMatch = html.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)<\/span>/i);
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    return {
      title: titleMatch ? this.cleanText(titleMatch[1]) : null,
      company: companyMatch ? this.cleanText(companyMatch[1]) : null,
      location: locationMatch ? this.cleanText(locationMatch[1]) : null,
      description: descMatch ? this.cleanText(descMatch[1]) : null,
      salary: null,
      requirements: [],
    };
  }

  private validateAndSetTitle(title: string | null, errors: ParserError[]): string {
    if (!title || title.trim().length === 0) {
      errors.push({
        field: 'title',
        error: 'Job title is missing',
        severity: 'critical',
      });
      return 'Unknown Title';
    }
    return title.trim();
  }

  private validateAndSetCompany(company: string | null, errors: ParserError[]): string {
    if (!company || company.trim().length === 0) {
      errors.push({
        field: 'company',
        error: 'Company name is missing',
        severity: 'critical',
      });
      return 'Unknown Company';
    }
    return company.trim();
  }

  private parseLocation(location: string | null): string | undefined {
    if (!location) return undefined;
    return location.trim();
  }

  private extractRemotePolicy(description: string, rawJob: RawJob): string | undefined {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('fully remote') || lowerDesc.includes('100% remote') || lowerDesc.includes('work from anywhere')) {
      return 'remote';
    }
    if (lowerDesc.includes('hybrid') || lowerDesc.includes('partially remote')) {
      return 'hybrid';
    }
    if (lowerDesc.includes('on-site') || lowerDesc.includes('onsite') || lowerDesc.includes('in office')) {
      return 'onsite';
    }
    if (lowerDesc.includes('remote') || lowerDesc.includes('work from home') || lowerDesc.includes('wfh')) {
      return 'remote';
    }

    return undefined;
  }

  private parseSalary(salaryText: string): SalaryRange | undefined {
    if (!salaryText) return undefined;

    const patterns = [
      /\$(\d+(?:,\d+)*)\s*[-–to]+\s*\$(\d+(?:,\d+)*)\s*(?:per\s*)?(year|yr|hour|hr|month|mo|annum)/i,
      /\$(\d+(?:,\d+)*)k?\s*[-–to]+\s*\$(\d+(?:,\d+)*)k?\s*(?:per\s*)?(year|yr|hour|hr|month|mo|annum)?/i,
      /(\d+(?:,\d+)*)\s*[-–to]+\s*(\d+(?:,\d+)*)\s*(?:per\s*)?(year|yr|hour|hr|month|mo|annum)/i,
    ];

    for (const pattern of patterns) {
      const match = salaryText.match(pattern);
      if (match) {
        const min = parseInt(match[1].replace(/,/g, ''), 10);
        const max = parseInt(match[2].replace(/,/g, ''), 10);
        const periodText = (match[3] || 'year').toLowerCase();

        let period: 'hourly' | 'daily' | 'monthly' | 'yearly' = 'yearly';
        if (periodText.includes('hour') || periodText.includes('hr')) {
          period = 'hourly';
        } else if (periodText.includes('month') || periodText.includes('mo')) {
          period = 'monthly';
        }

        return {
          min,
          max,
          period,
          currency: 'USD',
          isEstimated: true,
        };
      }
    }

    return undefined;
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const sections = description.split(/\n\n+/);

    for (const section of sections) {
      const lowerSection = section.toLowerCase();
      if (
        lowerSection.includes('requirement') ||
        lowerSection.includes('qualification') ||
        lowerSection.includes('what you') ||
        lowerSection.includes('what we') ||
        lowerSection.includes('you have') ||
        lowerSection.includes('you should')
      ) {
        const lines = section.split('\n');
        for (const line of lines) {
          const cleaned = line.replace(/^[\s\-\•\*\d\.]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 500) {
            requirements.push(cleaned);
          }
        }
      }
    }

    return requirements.slice(0, 20);
  }

  private identifySkills(description: string): string[] {
    const foundSkills: Set<string> = new Set();

    for (const skillPattern of this.skillPatterns) {
      if (skillPattern.pattern.test(description)) {
        foundSkills.add(skillPattern.name);
      }
    }

    return Array.from(foundSkills);
  }

  private determineApplicationMethod(rawJob: RawJob, description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('easy apply') || lowerDesc.includes('quick apply')) {
      return 'easy_apply';
    }
    if (lowerDesc.includes('apply now') && !lowerDesc.includes('external')) {
      return 'direct';
    }
    if (lowerDesc.includes('external') || lowerDesc.includes('company website')) {
      return 'external';
    }
    if (lowerDesc.includes('@') && lowerDesc.includes('send') && lowerDesc.includes('resume')) {
      return 'email';
    }

    return 'direct';
  }

  private extractPostedDate(rawJob: RawJob): Date | undefined {
    if (rawJob.rawJson?.posted_date || rawJob.rawJson?.postedDate || rawJob.rawJson?.date) {
      const dateStr = rawJob.rawJson.posted_date || rawJob.rawJson.postedDate || rawJob.rawJson.date;
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return rawJob.scrapedAt;
  }

  private calculateQualityScore(job: Partial<JobPosting>, errors: ParserError[]): number {
    let score = 100;

    const criticalErrors = errors.filter((e) => e.severity === 'critical');
    score -= criticalErrors.length * 25;

    const warnings = errors.filter((e) => e.severity === 'warning');
    score -= warnings.length * 10;

    const importantFields: (keyof JobPosting)[] = [
      'title',
      'company',
      'location',
      'description',
      'salary',
      'skills',
    ];

    const presentFields = importantFields.filter(
      (f) => job[f] !== undefined && job[f] !== null && String(job[f]).length > 0
    );
    score += (presentFields.length / importantFields.length) * 20;

    if (job.skills && job.skills.length > 0) {
      score += Math.min(10, job.skills.length);
    }

    if (job.salary) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ');
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findFirstValue(obj: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim().length > 0) {
        return String(obj[key]).trim();
      }
    }
    return null;
  }

  private getEmptyParsedData(): ParsedHtmlData {
    return {
      title: null,
      company: null,
      location: null,
      description: null,
      salary: null,
      requirements: [],
    };
  }

  private initializeSkillPatterns(): SkillPattern[] {
    return [
      { name: 'JavaScript', pattern: /\bjavascript\b|\bjs\b|\bnode\.?js\b|\bes6\b|\bes2015\b/i, aliases: ['JS', 'Node.js', 'ES6'] },
      { name: 'TypeScript', pattern: /\btypescript\b|\bts\b/i, aliases: ['TS'] },
      { name: 'React', pattern: /\breact\b|\breact\.?js\b|\breactjs\b/i, aliases: ['ReactJS'] },
      { name: 'Angular', pattern: /\bangular\b|\bangularjs\b|\bangular\s*2\b/i, aliases: ['AngularJS'] },
      { name: 'Vue.js', pattern: /\bvue\b|\bvue\.?js\b|\bvuejs\b/i, aliases: ['Vue', 'VueJS'] },
      { name: 'Python', pattern: /\bpython\b|\bpy\b/i, aliases: ['py'] },
      { name: 'Java', pattern: /\bjava\b(?!script)|\bjdk\b|\bjvm\b/i, aliases: ['JDK', 'JVM'] },
      { name: 'Go', pattern: /\bgolang\b|\bgo\b(?!ogle)/i, aliases: ['Golang'] },
      { name: 'Rust', pattern: /\brust\b/i, aliases: [] },
      { name: 'C++', pattern: /\bc\+\+\b|\bcpp\b/i, aliases: ['CPP'] },
      { name: 'C#', pattern: /\bc[#]\b|\bcsharp\b/i, aliases: ['CSharp'] },
      { name: 'Ruby', pattern: /\bruby\b|\brails\b/i, aliases: ['Rails'] },
      { name: 'PHP', pattern: /\bphp\b/i, aliases: [] },
      { name: 'Swift', pattern: /\bswift\b/i, aliases: [] },
      { name: 'Kotlin', pattern: /\bkotlin\b/i, aliases: [] },
      { name: 'Scala', pattern: /\bscala\b/i, aliases: [] },
      { name: 'AWS', pattern: /\baws\b|\bamazon web services\b|\bec2\b|\bs3\b|\blambda\b/i, aliases: ['Amazon Web Services', 'EC2', 'S3'] },
      { name: 'Azure', pattern: /\bazure\b|\bmicrosoft azure\b/i, aliases: ['Microsoft Azure'] },
      { name: 'GCP', pattern: /\bgcp\b|\bgoogle cloud\b|\bgoogle cloud platform\b/i, aliases: ['Google Cloud'] },
      { name: 'Docker', pattern: /\bdocker\b|\bcontainerization\b/i, aliases: [] },
      { name: 'Kubernetes', pattern: /\bkubernetes\b|\bk8s\b/i, aliases: ['K8s'] },
      { name: 'PostgreSQL', pattern: /\bpostgresql\b|\bpostgres\b|\bpsql\b/i, aliases: ['Postgres'] },
      { name: 'MySQL', pattern: /\bmysql\b/i, aliases: [] },
      { name: 'MongoDB', pattern: /\bmongodb\b|\bmongo\b/i, aliases: ['Mongo'] },
      { name: 'Redis', pattern: /\bredis\b/i, aliases: [] },
      { name: 'GraphQL', pattern: /\bgraphql\b/i, aliases: [] },
      { name: 'REST API', pattern: /\brest\b|\brestful\b|\bapi\b/i, aliases: ['RESTful'] },
      { name: 'Git', pattern: /\bgit\b|\bgithub\b|\bgitlab\b/i, aliases: ['GitHub', 'GitLab'] },
      { name: 'CI/CD', pattern: /\bci\/cd\b|\bcontinuous integration\b|\bcontinuous deployment\b|\bjenkins\b|\bgithub actions\b/i, aliases: ['Jenkins', 'GitHub Actions'] },
      { name: 'Agile', pattern: /\bagile\b|\bscrum\b|\bkanban\b/i, aliases: ['Scrum', 'Kanban'] },
      { name: 'Machine Learning', pattern: /\bmachine learning\b|\bml\b/i, aliases: ['ML'] },
      { name: 'Deep Learning', pattern: /\bdeep learning\b|\bneural network\b/i, aliases: ['Neural Networks'] },
      { name: 'TensorFlow', pattern: /\btensorflow\b/i, aliases: [] },
      { name: 'PyTorch', pattern: /\bpytorch\b/i, aliases: [] },
      { name: 'Data Science', pattern: /\bdata science\b|\bdata scientist\b/i, aliases: [] },
      { name: 'SQL', pattern: /\bsql\b/i, aliases: [] },
      { name: 'Linux', pattern: /\blinux\b|\bubuntu\b|\bcentos\b|\bdebian\b/i, aliases: ['Ubuntu', 'CentOS'] },
      { name: 'Node.js', pattern: /\bnode\.?js\b|\bnode\b/i, aliases: ['Node'] },
      { name: 'Next.js', pattern: /\bnext\.?js\b|\bnextjs\b/i, aliases: ['NextJS'] },
      { name: 'Express.js', pattern: /\bexpress\b|\bexpress\.?js\b/i, aliases: ['Express'] },
      { name: 'HTML/CSS', pattern: /\bhtml\b|\bcss\b|\bhtml5\b|\bcss3\b/i, aliases: ['HTML5', 'CSS3'] },
      { name: 'Sass', pattern: /\bsass\b|\bscss\b/i, aliases: ['SCSS'] },
      { name: 'Tailwind CSS', pattern: /\btailwind\b/i, aliases: [] },
      { name: 'Figma', pattern: /\bfigma\b/i, aliases: [] },
      { name: 'Jira', pattern: /\bjira\b/i, aliases: [] },
      { name: 'Communication', pattern: /\bcommunication\b/i, aliases: [] },
      { name: 'Leadership', pattern: /\bleadership\b|\blead\b/i, aliases: [] },
      { name: 'Problem Solving', pattern: /\bproblem solving\b|\bproblem-solving\b/i, aliases: [] },
    ];
  }
}
