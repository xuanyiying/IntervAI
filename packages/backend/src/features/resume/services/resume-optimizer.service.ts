/**
 * Resume Optimizer Service
 * Handles resume optimization using AI skills (resume-writer)
 * Supports Git-like diff workflow: trigger → review suggestions → accept/reject → apply
 *
 * Note: Match score calculation is delegated to MatchAnalysisService (uses jd-matcher skill).
 * Rule-based suggestion generation has been removed in favor of AI-powered resume-writer skill.
 */

import { AIService } from '@/core/ai';
import { QuotaService } from '@/core/quota/quota.service';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  ParsedJobData,
  ParsedResumeData,
  Suggestion,
  SuggestionStatus,
  SuggestionType,
} from '@/types';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Optimization, OptimizationStatus } from '@prisma/client';

@Injectable()
export class ResumeOptimizerService {
  private readonly logger = new Logger(ResumeOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly quotaService: QuotaService
  ) {}

  async createOptimization(
    userId: string,
    resumeId: string,
    jobId?: string
  ): Promise<Optimization> {
    await this.quotaService.enforceOptimizationQuota(userId);

    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resume'
      );
    }

    const job = jobId
      ? await this.prisma.job.findUnique({
          where: { id: jobId },
        })
      : null;

    if (jobId && (!job || job.userId !== userId)) {
      throw new ForbiddenException(
        'You do not have permission to access this job'
      );
    }

    const optimization = await this.prisma.optimization.create({
      data: {
        userId,
        resumeId,
        ...(jobId ? { jobId } : {}),
        status: OptimizationStatus.PENDING,
      } as any,
    });

    await this.quotaService.incrementOptimizationCount(userId);

    return optimization;
  }

  async getOptimization(
    optimizationId: string,
    userId: string
  ): Promise<Optimization> {
    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
    });

    if (!optimization) {
      throw new NotFoundException(
        `Optimization with ID ${optimizationId} not found`
      );
    }

    if (optimization.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this optimization'
      );
    }

    return optimization;
  }

  async listOptimizations(userId: string): Promise<Optimization[]> {
    return this.prisma.optimization.findMany({
      where: { userId },
      include: {
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateSuggestions(
    resumeData: ParsedResumeData,
    jobData: ParsedJobData,
    userId: string
  ): Promise<Suggestion[]> {
    try {
      const aiResult = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: JSON.stringify(resumeData),
          targetJob: JSON.stringify(jobData),
          optimizationFocus: 'all',
          style: 'professional',
        },
        userId
      );

      if (aiResult.success && aiResult.data) {
        const suggestions = this.parseAISuggestions(aiResult.data as any);
        this.logger.debug(
          `Generated ${suggestions.length} AI-powered suggestions`
        );
        return suggestions.map((s, index) => ({
          ...s,
          id: s.id || `suggestion-${index}`,
          status: s.status || SuggestionStatus.PENDING,
        }));
      }

      this.logger.warn(
        'AI skill returned no data, returning empty suggestions'
      );
      return [];
    } catch (error) {
      this.logger.error('Error generating suggestions:', error);
      return [];
    }
  }

  private parseAISuggestions(data: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    try {
      let parsedData = data;

      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch {
          return suggestions;
        }
      }

      const optimizations =
        parsedData?.optimizations || parsedData?.suggestions || [];

      if (Array.isArray(optimizations)) {
        for (let i = 0; i < optimizations.length; i++) {
          const opt = optimizations[i];
          if (opt && typeof opt === 'object') {
            suggestions.push({
              id: `ai-${Date.now()}-${i}`,
              type: this.mapSuggestionType(opt.type),
              section: opt.section || 'general',
              itemIndex: opt.itemIndex,
              original: opt.before || opt.original || '',
              optimized: opt.after || opt.optimized || '',
              reason: opt.reason || 'AI-generated optimization suggestion',
              status: SuggestionStatus.PENDING,
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      this.logger.error('Error parsing AI suggestions:', error);
      return suggestions;
    }
  }

  private mapSuggestionType(type: string | undefined): SuggestionType {
    if (!type) return SuggestionType.CONTENT;

    const typeMap: Record<string, SuggestionType> = {
      content: SuggestionType.CONTENT,
      keyword: SuggestionType.KEYWORD,
      structure: SuggestionType.STRUCTURE,
      quantification: SuggestionType.QUANTIFICATION,
    };

    return typeMap[type.toLowerCase()] || SuggestionType.CONTENT;
  }

  private applySuggestionToResumeData(
    resumeData: ParsedResumeData,
    suggestion: any
  ): ParsedResumeData {
    const updated = JSON.parse(JSON.stringify(resumeData));

    const { section, itemIndex, original, optimized } = suggestion;

    switch (section) {
      case 'experience':
        if (itemIndex !== undefined && updated.experience[itemIndex]) {
          const exp = updated.experience[itemIndex];
          const descIndex = exp.description.findIndex(
            (d: string) => d === original
          );
          if (descIndex !== -1) {
            exp.description[descIndex] = optimized;
          }
          if (exp.achievements) {
            const achIndex = exp.achievements.findIndex(
              (a: string) => a === original
            );
            if (achIndex !== -1) {
              exp.achievements[achIndex] = optimized;
            }
          }
        }
        break;

      case 'skills':
        if (
          suggestion.type === 'keyword' &&
          !updated.skills.includes(optimized)
        ) {
          updated.skills.push(optimized);
        }
        break;

      case 'summary':
        updated.summary = optimized;
        break;

      default:
        this.replaceTextInResume(updated, original, optimized);
    }

    return updated;
  }

  private replaceTextInResume(
    data: any,
    original: string,
    optimized: string
  ): void {
    if (typeof data === 'string') {
      return;
    }

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i] === 'string' && data[i] === original) {
          data[i] = optimized;
        } else if (typeof data[i] === 'object') {
          this.replaceTextInResume(data[i], original, optimized);
        }
      }
    } else if (typeof data === 'object') {
      for (const key in data) {
        if (typeof data[key] === 'string' && data[key] === original) {
          data[key] = optimized;
        } else if (typeof data[key] === 'object') {
          this.replaceTextInResume(data[key], original, optimized);
        }
      }
    }
  }

  // ==================== Git-like Diff Workflow Methods ====================

  async triggerOptimization(
    userId: string,
    resumeId: string,
    jobId?: string
  ): Promise<Optimization> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resume'
      );
    }

    if (!resume.parsedData) {
      throw new NotFoundException(
        'Resume has not been parsed yet. Please parse first.'
      );
    }

    const existingOptimization = await this.prisma.optimization.findFirst({
      where: {
        resumeId,
        userId,
        status: {
          in: [OptimizationStatus.PENDING, OptimizationStatus.PROCESSING],
        },
      },
    });

    if (existingOptimization) {
      this.logger.log(
        `Returning existing optimization ${existingOptimization.id}`
      );
      return existingOptimization;
    }

    const optimization = await this.prisma.optimization.create({
      data: {
        userId,
        resumeId,
        ...(jobId ? { jobId } : {}),
        status: OptimizationStatus.PENDING,
      } as any,
    });

    this.logger.log(
      `Triggered optimization ${optimization.id} for resume ${resumeId}`
    );

    return optimization;
  }

  async listResumeOptimizations(
    userId: string,
    resumeId: string
  ): Promise<Optimization[]> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resume'
      );
    }

    return this.prisma.optimization.findMany({
      where: { resumeId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptSuggestion(
    optimizationId: string,
    userId: string,
    suggestionId: string
  ): Promise<{ status: string; suggestion: any }> {
    const optimization = await this.getOptimization(optimizationId, userId);
    const suggestions = (optimization.suggestions || []) as any[];
    const idx = suggestions.findIndex((s: any) => s.id === suggestionId);

    if (idx === -1) {
      throw new NotFoundException(`Suggestion ${suggestionId} not found`);
    }

    suggestions[idx].status = SuggestionStatus.ACCEPTED;

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { suggestions: suggestions as any },
    });

    return { status: 'accepted', suggestion: suggestions[idx] };
  }

  async rejectSuggestion(
    optimizationId: string,
    userId: string,
    suggestionId: string
  ): Promise<{ status: string; suggestion: any }> {
    const optimization = await this.getOptimization(optimizationId, userId);
    const suggestions = (optimization.suggestions || []) as any[];
    const idx = suggestions.findIndex((s: any) => s.id === suggestionId);

    if (idx === -1) {
      throw new NotFoundException(`Suggestion ${suggestionId} not found`);
    }

    suggestions[idx].status = SuggestionStatus.REJECTED;

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { suggestions: suggestions as any },
    });

    return { status: 'rejected', suggestion: suggestions[idx] };
  }

  async acceptAllSuggestions(
    optimizationId: string,
    userId: string
  ): Promise<{ accepted: number; total: number }> {
    const optimization = await this.getOptimization(optimizationId, userId);
    const suggestions = (optimization.suggestions || []) as any[];

    let accepted = 0;
    for (const sug of suggestions) {
      if (sug.status === SuggestionStatus.PENDING) {
        sug.status = SuggestionStatus.ACCEPTED;
        accepted++;
      }
    }

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { suggestions: suggestions as any },
    });

    return { accepted, total: suggestions.length };
  }

  async rejectAllSuggestions(
    optimizationId: string,
    userId: string
  ): Promise<{ rejected: number; total: number }> {
    const optimization = await this.getOptimization(optimizationId, userId);
    const suggestions = (optimization.suggestions || []) as any[];

    let rejected = 0;
    for (const sug of suggestions) {
      if (sug.status === SuggestionStatus.PENDING) {
        sug.status = SuggestionStatus.REJECTED;
        rejected++;
      }
    }

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { suggestions: suggestions as any },
    });

    return { rejected, total: suggestions.length };
  }

  async applyChanges(optimizationId: string, userId: string): Promise<any> {
    const optimization = await this.getOptimization(optimizationId, userId);
    const suggestions = (optimization.suggestions || []) as any[];

    const accepted = suggestions.filter(
      (s: any) => s.status === SuggestionStatus.ACCEPTED
    );

    if (accepted.length === 0) {
      throw new ForbiddenException('No accepted suggestions to apply');
    }

    const resume = await this.prisma.resume.findUnique({
      where: { id: optimization.resumeId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    let parsedData = JSON.parse(JSON.stringify(resume.parsedData));

    for (const sug of accepted) {
      parsedData = this.applySuggestionToResumeData(parsedData, sug);
    }

    const newVersion = resume.version + 1;

    await this.prisma.resume.update({
      where: { id: optimization.resumeId },
      data: {
        parsedData: parsedData as any,
        version: newVersion,
      },
    });

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { status: OptimizationStatus.COMPLETED },
    });

    this.logger.log(
      `Applied ${accepted.length} suggestions, created version ${newVersion}`
    );

    return {
      version: newVersion,
      appliedCount: accepted.length,
      parsedData,
    };
  }

  async getVersions(userId: string, resumeId: string): Promise<any[]> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resume'
      );
    }

    try {
      return await (this.prisma as any).resumeVersion.findMany({
        where: { resumeId },
        orderBy: { version: 'desc' },
      });
    } catch {
      return [];
    }
  }

  async restoreVersion(
    userId: string,
    resumeId: string,
    versionId: string
  ): Promise<any> {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resume'
      );
    }

    try {
      const version = await (this.prisma as any).resumeVersion.findUnique({
        where: { id: versionId },
      });

      if (!version || version.resumeId !== resumeId) {
        throw new NotFoundException('Version not found');
      }

      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          currentVersionId: versionId,
          parsedData: {
            personalInfo: version.personalInfo,
            summary: version.summary,
            education: version.education,
            experience: version.experience,
            skills: version.skills,
            projects: version.projects,
            certifications: version.certifications,
            languages: version.languages,
          } as any,
        } as any,
      });

      this.logger.log(
        `Restored resume ${resumeId} to version ${version.version}`
      );

      return {
        restoredTo: version.version,
        label: version.label,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(
        'Version restore failed - run database migration first'
      );
    }
  }
}
