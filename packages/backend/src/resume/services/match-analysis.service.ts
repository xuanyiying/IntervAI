import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { EmbeddingService } from '@/agent/services/embedding.service';

export interface MatchAnalysisResult {
  overallScore: number;
  skillMatch: {
    matched: Array<{ skill: string; relevance: number }>;
    missing: Array<{ skill: string; importance: number }>;
    additional: Array<{ skill: string; value: number }>;
  };
  experienceMatch: {
    score: number;
    gaps: string[];
    highlights: string[];
  };
  educationMatch: {
    score: number;
    meets: boolean;
    notes: string;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
    impact: string;
  }>;
  learningPath?: Array<{
    skill: string;
    resources: string[];
    estimatedTime: string;
  }>;
}

@Injectable()
export class MatchAnalysisService {
  private readonly logger = new Logger(MatchAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiEngine: AIEngineService,
    private readonly embeddingService: EmbeddingService
  ) {}

  async analyzeMatch(
    resumeId: string,
    jobId: string
  ): Promise<MatchAnalysisResult> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: { optimizations: { where: { jobId }, take: 1 } },
    });

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!resume || !job) {
      throw new Error('Resume or Job not found');
    }

    const resumeText = resume.extractedText || '';
    const jobDescription = job.jobDescription || '';
    const requirements = job.requirements || '';

    const resumeEmbedding =
      await this.embeddingService.generateEmbedding(resumeText);
    const jobEmbedding = await this.embeddingService.generateEmbedding(
      `${jobDescription} ${requirements}`
    );

    const overallScore = this.cosineSimilarity(resumeEmbedding, jobEmbedding);

    const skillMatch = await this.analyzeSkillMatch(
      resume.parsedData as any,
      job.parsedRequirements as any
    );

    const experienceMatch = await this.analyzeExperienceMatch(
      resume.parsedData as any,
      job
    );

    const educationMatch = await this.analyzeEducationMatch(
      resume.parsedData as any,
      job
    );

    const recommendations = await this.generateRecommendations(
      skillMatch,
      experienceMatch,
      educationMatch,
      overallScore
    );

    const learningPath = await this.generateLearningPath(skillMatch.missing);

    return {
      overallScore: Math.round(overallScore * 100),
      skillMatch,
      experienceMatch,
      educationMatch,
      recommendations,
      learningPath,
    };
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async analyzeSkillMatch(
    resumeData: any,
    jobRequirements: any
  ): Promise<MatchAnalysisResult['skillMatch']> {
    const resumeSkills = this.extractSkills(resumeData);
    const jobSkills = this.extractSkills(jobRequirements);

    const matched: Array<{ skill: string; relevance: number }> = [];
    const missing: Array<{ skill: string; importance: number }> = [];
    const additional: Array<{ skill: string; value: number }> = [];

    for (const jobSkill of jobSkills) {
      const match = resumeSkills.find(
        (rs) =>
          rs.toLowerCase().includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(rs.toLowerCase())
      );

      if (match) {
        matched.push({ skill: jobSkill, relevance: 0.85 });
      } else {
        missing.push({ skill: jobSkill, importance: 0.7 });
      }
    }

    for (const resumeSkill of resumeSkills) {
      const isMatched = matched.some(
        (m) =>
          m.skill.toLowerCase() === resumeSkill.toLowerCase() ||
          m.skill.toLowerCase().includes(resumeSkill.toLowerCase())
      );

      if (!isMatched) {
        additional.push({ skill: resumeSkill, value: 0.5 });
      }
    }

    return { matched, missing, additional };
  }

  private extractSkills(data: any): string[] {
    if (!data) return [];

    const skills: string[] = [];

    if (data.skills) {
      if (Array.isArray(data.skills)) {
        skills.push(...data.skills);
      } else if (typeof data.skills === 'string') {
        skills.push(...data.skills.split(',').map((s: string) => s.trim()));
      }
    }

    if (data.technicalSkills) {
      skills.push(...data.technicalSkills);
    }

    if (data.requirements) {
      const reqText =
        typeof data.requirements === 'string'
          ? data.requirements
          : JSON.stringify(data.requirements);

      const techKeywords = [
        'JavaScript',
        'Python',
        'Java',
        'React',
        'Node.js',
        'TypeScript',
        'SQL',
        'AWS',
        'Docker',
        'Kubernetes',
        'Git',
        'Linux',
        'MongoDB',
        'PostgreSQL',
        'Redis',
        'GraphQL',
        'REST',
        'CI/CD',
        'Agile',
        'Scrum',
      ];

      techKeywords.forEach((keyword) => {
        if (reqText.toLowerCase().includes(keyword.toLowerCase())) {
          if (!skills.includes(keyword)) {
            skills.push(keyword);
          }
        }
      });
    }

    return [...new Set(skills)];
  }

  private async analyzeExperienceMatch(
    resumeData: any,
    job: any
  ): Promise<MatchAnalysisResult['experienceMatch']> {
    const gaps: string[] = [];
    const highlights: string[] = [];

    if (!resumeData || !resumeData.experience) {
      return {
        score: 0,
        gaps: ['No experience data available'],
        highlights: [],
      };
    }

    const experiences = Array.isArray(resumeData.experience)
      ? resumeData.experience
      : [];

    const totalYears = experiences.reduce((sum: number, exp: any) => {
      const duration = exp.duration || '';
      const years = this.parseYearsFromDuration(duration);
      return sum + years;
    }, 0);

    const requiredYears = this.extractRequiredYears(
      job.requirements || job.jobDescription
    );

    if (requiredYears > 0 && totalYears < requiredYears) {
      gaps.push(
        `Experience gap: ${requiredYears - totalYears} years short of required ${requiredYears} years`
      );
    } else {
      highlights.push(`Meets experience requirement: ${totalYears} years`);
    }

    if (experiences.length > 0) {
      highlights.push(`Diverse experience across ${experiences.length} roles`);
    }

    const score = Math.min(100, (totalYears / (requiredYears || 3)) * 100);

    return { score: Math.round(score), gaps, highlights };
  }

  private parseYearsFromDuration(duration: string): number {
    const yearMatch = duration.match(/(\d+)\s*(?:years?|y)/i);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    return 0;
  }

  private extractRequiredYears(text: string): number {
    const yearMatch = text.match(/(\d+)\+?\s*years?\s*(?:of\s+)?experience/i);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    return 0;
  }

  private async analyzeEducationMatch(
    resumeData: any,
    job: any
  ): Promise<MatchAnalysisResult['educationMatch']> {
    if (!resumeData || !resumeData.education) {
      return {
        score: 0,
        meets: false,
        notes: 'No education data available',
      };
    }

    const education = Array.isArray(resumeData.education)
      ? resumeData.education
      : [resumeData.education];

    const jobRequirements = (
      job.requirements ||
      job.jobDescription ||
      ''
    ).toLowerCase();

    const hasBachelor = education.some(
      (edu: any) =>
        (edu.degree || '').toLowerCase().includes('bachelor') ||
        (edu.degree || '').toLowerCase().includes('bs') ||
        (edu.degree || '').toLowerCase().includes('ba')
    );

    const hasMaster = education.some(
      (edu: any) =>
        (edu.degree || '').toLowerCase().includes('master') ||
        (edu.degree || '').toLowerCase().includes('ms') ||
        (edu.degree || '').toLowerCase().includes('ma')
    );

    let meets = false;
    let notes = '';

    if (jobRequirements.includes('master') || jobRequirements.includes('ms')) {
      meets = hasMaster;
      notes = meets
        ? "Meets Master's degree requirement"
        : "Master's degree preferred but not required";
    } else if (
      jobRequirements.includes('bachelor') ||
      jobRequirements.includes('bs') ||
      jobRequirements.includes('ba')
    ) {
      meets = hasBachelor || hasMaster;
      notes = meets
        ? "Meets Bachelor's degree requirement"
        : "Bachelor's degree required";
    } else {
      meets = hasBachelor || hasMaster;
      notes = hasMaster
        ? 'Has advanced degree'
        : hasBachelor
          ? "Has Bachelor's degree"
          : 'No formal degree requirement specified';
    }

    const score = meets ? 100 : hasBachelor ? 70 : 40;

    return { score, meets, notes };
  }

  private async generateRecommendations(
    skillMatch: MatchAnalysisResult['skillMatch'],
    experienceMatch: MatchAnalysisResult['experienceMatch'],
    educationMatch: MatchAnalysisResult['educationMatch'],
    overallScore: number
  ): Promise<MatchAnalysisResult['recommendations']> {
    const recommendations: MatchAnalysisResult['recommendations'] = [];

    if (skillMatch.missing.length > 0) {
      const topMissing = skillMatch.missing
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);

      recommendations.push({
        priority: 'high',
        category: 'Technical Skills',
        suggestion: `Focus on acquiring: ${topMissing.map((s) => s.skill).join(', ')}`,
        impact: 'Critical for passing ATS screening and technical interviews',
      });
    }

    if (experienceMatch.gaps.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Experience',
        suggestion:
          'Highlight relevant projects or freelance work to bridge experience gap',
        impact:
          'Can compensate for years of experience with demonstrated skills',
      });
    }

    if (!educationMatch.meets) {
      recommendations.push({
        priority: 'low',
        category: 'Education',
        suggestion:
          'Consider online certifications or courses to strengthen profile',
        impact: 'May help with initial screening but less critical than skills',
      });
    }

    if (overallScore < 0.6) {
      recommendations.push({
        priority: 'high',
        category: 'Overall Fit',
        suggestion:
          'Consider tailoring resume more specifically to this job description',
        impact: 'Could significantly improve match score and interview chances',
      });
    }

    return recommendations;
  }

  private async generateLearningPath(
    missingSkills: Array<{ skill: string; importance: number }>
  ): Promise<
    Array<{ skill: string; resources: string[]; estimatedTime: string }>
  > {
    if (missingSkills.length === 0) {
      return [];
    }

    const topSkills = missingSkills
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);

    return topSkills.map((skill) => ({
      skill: skill.skill,
      resources: [
        `Official ${skill.skill} documentation`,
        `Online courses (Coursera, Udemy, etc.)`,
        `Practice projects on GitHub`,
      ],
      estimatedTime: '2-4 weeks',
    }));
  }
}
