/**
 * Resume Optimizer Service
 * Handles resume optimization using AI skills (resume-writer)
 * Supports Git-like diff workflow: trigger → review suggestions → accept/reject → apply
 *
 * Note: Match score calculation is delegated to MatchAnalysisService (uses jd-matcher skill).
 * Rule-based suggestion generation has been removed in favor of AI-powered resume-writer skill.
 */

import { AIService } from '@/modules/ai';
import { AIQueueService } from '@/modules/ai/queue/ai-queue.service';
import { QuotaService } from '@/modules/quota/services/quota.service';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { ResumeVersionService } from './resume-version.service';
import {
  ParsedJobData,
  ParsedResumeData,
  Suggestion,
  SuggestionStatus,
  SuggestionType,
} from '@/types';
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Optimization,
  OptimizationStatus,
  ParseStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ResumeOptimizerService {
  private readonly logger = new Logger(ResumeOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly quotaService: QuotaService,
    private readonly resumeVersionService: ResumeVersionService,
    @Inject(forwardRef(() => AIQueueService))
    private readonly aiQueueService: AIQueueService
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

    await this.aiQueueService.addResumeOptimizationJob(optimization.id, userId);

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
        resume: {
          select: {
            id: true,
            title: true,
            originalFilename: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateSuggestions(
    resumeData: ParsedResumeData,
    jobData: ParsedJobData | null,
    userId: string,
    diagnosisContext?: string
  ): Promise<Suggestion[]> {
    try {
      const aiResult = await this.aiService.executeSkill(
        'resume-writer',
        {
          resumeData: JSON.stringify(resumeData),
          ...(jobData ? { targetJob: JSON.stringify(jobData) } : {}),
          ...(diagnosisContext ? { diagnosisContext } : {}),
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

  /**
   * Queue worker entry point: generate suggestions for a pending optimization
   * and persist the outcome. Idempotent — already finished optimizations are
   * left untouched.
   */
  async processOptimization(optimizationId: string): Promise<void> {
    const optimization = await this.prisma.optimization.findUnique({
      where: { id: optimizationId },
    });

    if (!optimization) {
      this.logger.warn(`Optimization ${optimizationId} not found, skipping`);
      return;
    }

    if (
      optimization.status !== OptimizationStatus.PENDING &&
      optimization.status !== OptimizationStatus.PROCESSING
    ) {
      return;
    }

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { status: OptimizationStatus.PROCESSING, errorMessage: null },
    });

    try {
      const resume = await this.prisma.resume.findUnique({
        where: { id: optimization.resumeId },
      });

      if (!resume?.parsedData) {
        throw new Error('Resume has not been parsed yet');
      }

      const job = optimization.jobId
        ? await this.prisma.job.findUnique({
            where: { id: optimization.jobId },
          })
        : null;

      const diagnosisContext = this.buildDiagnosisContext(
        resume.analysisResult
      );

      const suggestions = await this.generateSuggestions(
        resume.parsedData as unknown as ParsedResumeData,
        job ? (job as unknown as ParsedJobData) : null,
        optimization.userId,
        diagnosisContext
      );

      if (!suggestions.length) {
        throw new Error('AI did not produce any usable suggestions');
      }

      await this.prisma.optimization.update({
        where: { id: optimizationId },
        data: {
          suggestions: suggestions as any,
          status: OptimizationStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `Optimization ${optimizationId} completed with ${suggestions.length} suggestions`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Optimization failed';
      this.logger.error(
        `Optimization ${optimizationId} failed: ${message}`,
        error
      );
      await this.prisma.optimization.update({
        where: { id: optimizationId },
        data: {
          status: OptimizationStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Turn a persisted diagnosis into prompt context so the writer targets the
   * exact issues the diagnosis found instead of generic rewrites.
   */
  private buildDiagnosisContext(analysisResult: unknown): string | undefined {
    if (!analysisResult || typeof analysisResult !== 'object') return undefined;
    const result = analysisResult as Record<string, any>;
    const parts: string[] = [];

    if (Array.isArray(result.weaknesses) && result.weaknesses.length) {
      parts.push(`Weaknesses:\n${result.weaknesses.join('\n')}`);
    }
    if (Array.isArray(result.suggestions) && result.suggestions.length) {
      const lines = result.suggestions
        .filter((s: any) => s && (s.issue || s.recommendation))
        .map(
          (s: any) =>
            `- [${s.priority || 'Medium'}] ${s.category || ''}: ${s.issue || ''} → ${s.recommendation || ''}`
        );
      if (lines.length) parts.push(`Diagnosis suggestions:\n${lines.join('\n')}`);
    }

    return parts.length ? parts.join('\n\n') : undefined;
  }

  private parseAISuggestions(data: any): Suggestion[] {
    const suggestions: Suggestion[] = [];

    try {
      let parsedData = data;

      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch {
          this.logger.warn(
            `parseAISuggestions: string data is not JSON (${data.slice(0, 300)})`
          );
          return suggestions;
        }
      }

      if (
        parsedData &&
        typeof parsedData === 'object' &&
        typeof parsedData.raw === 'string'
      ) {
        try {
          parsedData = JSON.parse(parsedData.raw);
        } catch {
          this.logger.warn(
            `parseAISuggestions: raw wrapper is not JSON (${parsedData.raw.slice(0, 300)})`
          );
          return suggestions;
        }
      }

      const optimizations =
        parsedData?.optimizations || parsedData?.suggestions || [];

      if (!Array.isArray(optimizations)) {
        this.logger.warn(
          `parseAISuggestions: no optimizations array in result — top-level keys: ${
            parsedData && typeof parsedData === 'object'
              ? Object.keys(parsedData).join(',')
              : typeof parsedData
          }`
        );
      }

      if (Array.isArray(optimizations)) {
        for (let i = 0; i < optimizations.length; i++) {
          const opt = optimizations[i];
          if (!opt || typeof opt !== 'object') continue;

          const original = String(opt.before ?? opt.original ?? '').trim();
          const optimized = String(opt.after ?? opt.optimized ?? '').trim();

          // A rewrite without an "after" is not actionable — drop it.
          if (!optimized) continue;

          suggestions.push({
            id: `ai-${Date.now()}-${i}`,
            type: this.mapSuggestionType(opt.type),
            section: String(opt.section || opt.category || 'general').trim(),
            itemIndex:
              typeof opt.itemIndex === 'number'
                ? opt.itemIndex
                : typeof opt.sectionIndex === 'number'
                  ? opt.sectionIndex
                  : undefined,
            original,
            optimized,
            reason: String(
              opt.reason || opt.explanation || 'AI-generated optimization suggestion'
            ),
            status: SuggestionStatus.PENDING,
          });
        }
      }

      if (!suggestions.length && Array.isArray(optimizations) && optimizations.length) {
        this.logger.warn(
          `parseAISuggestions: ${optimizations.length} entries but none actionable — sample keys: ${Object.keys(
            optimizations[0] || {}
          ).join(',')}`
        );
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

  /**
   * Apply one accepted suggestion to the resume data in place.
   * Returns true when the suggestion actually landed, false when the
   * original content could not be located (reported to the caller).
   */
  private applySuggestionToResumeData(
    resumeData: ParsedResumeData,
    suggestion: any
  ): boolean {
    const { section, itemIndex, original, optimized, type } = suggestion;
    const originalText = typeof original === 'string' ? original.trim() : '';

    switch (section) {
      case 'summary': {
        // Empty original = replace the whole summary
        if (!originalText || this.matchesOriginal(resumeData.summary, originalText)) {
          resumeData.summary = optimized;
          return true;
        }
        return false;
      }

      case 'skills': {
        const skills = resumeData.skills;
        if (!Array.isArray(skills)) return false;
        // Keyword additions (or suggestions without an original) append a skill
        if (type === 'keyword' || !originalText) {
          const exists = skills.some(
            (s) =>
              this.normalizeForMatch(String(s)) ===
              this.normalizeForMatch(optimized)
          );
          if (!exists) skills.push(optimized);
          return true;
        }
        const idx = skills.findIndex(
          (s) =>
            typeof s === 'string' && this.matchesOriginal(s, originalText)
        );
        if (idx !== -1) {
          skills[idx] = optimized;
          return true;
        }
        return false;
      }

      case 'experience':
      case 'projects': {
        const items =
          section === 'experience'
            ? resumeData.experience
            : resumeData.projects;
        if (!Array.isArray(items)) return false;

        const candidates =
          typeof itemIndex === 'number' && items[itemIndex]
            ? [items[itemIndex]]
            : items;

        // Adding a brand-new bullet to a targeted experience entry
        if (!originalText) {
          for (const item of candidates) {
            if (Array.isArray(item?.description)) {
              item.description.push(optimized);
              return true;
            }
          }
          return false;
        }

        for (const item of candidates) {
          if (item && typeof item === 'object' && this.replaceInItem(item, originalText, optimized)) {
            return true;
          }
        }
        // itemIndex may be stale — retry across all items
        if (candidates.length === 1) {
          for (const item of items) {
            if (item && typeof item === 'object' && this.replaceInItem(item, originalText, optimized)) {
              return true;
            }
          }
        }
        return false;
      }

      default:
        return this.replaceTextDeep(resumeData, originalText, optimized);
    }
  }

  /**
   * Matching key: whitespace is insignificant for content matching —
   * LLM rewrites of CJK bullets often insert spaces that the original lacks.
   */
  private normalizeForMatch(text: string): string {
    return text.replace(/\s+/g, '').toLowerCase();
  }

  private matchesOriginal(candidate: unknown, original: string): boolean {
    if (typeof candidate !== 'string' || !original) return false;
    if (candidate === original) return true;
    return this.normalizeForMatch(candidate) === this.normalizeForMatch(original);
  }

  /**
   * Replace a matched string inside one experience/project entry, checking
   * bullet arrays first, then plain string fields (project.description etc.)
   */
  private replaceInItem(item: any, original: string, optimized: string): boolean {
    for (const field of ['description', 'achievements', 'highlights']) {
      const arr = item[field];
      if (Array.isArray(arr)) {
        const idx = arr.findIndex(
          (v: any) => typeof v === 'string' && this.matchesOriginal(v, original)
        );
        if (idx !== -1) {
          arr[idx] = optimized;
          return true;
        }
      }
    }
    for (const field of ['description', 'name', 'position']) {
      const val = item[field];
      if (typeof val === 'string' && this.matchesOriginal(val, original)) {
        item[field] = optimized;
        return true;
      }
    }
    return false;
  }

  /**
   * Deep exact/normalized match replace across the whole resume structure.
   * Used for sections without a dedicated handler (education, contact, ...).
   */
  private replaceTextDeep(
    data: any,
    original: string,
    optimized: string
  ): boolean {
    if (!original) return false;

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        if (
          typeof data[i] === 'string' &&
          this.matchesOriginal(data[i], original)
        ) {
          data[i] = optimized;
          return true;
        }
        if (data[i] && typeof data[i] === 'object' && this.replaceTextDeep(data[i], original, optimized)) {
          return true;
        }
      }
      return false;
    }

    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (
          typeof data[key] === 'string' &&
          this.matchesOriginal(data[key], original)
        ) {
          data[key] = optimized;
          return true;
        }
        if (data[key] && typeof data[key] === 'object' && this.replaceTextDeep(data[key], original, optimized)) {
          return true;
        }
      }
    }
    return false;
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

    await this.aiQueueService.addResumeOptimizationJob(optimization.id, userId);

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

    if (!resume?.parsedData) {
      throw new NotFoundException('Resume not found or not parsed yet');
    }

    const beforeData = JSON.parse(JSON.stringify(resume.parsedData));

    // Snapshot the pre-apply state so the merge is fully reversible
    try {
      await this.resumeVersionService.createVersion(
        optimization.resumeId,
        beforeData,
        'Before optimization'
      );
    } catch (error) {
      this.logger.warn(
        `Failed to snapshot pre-apply version for resume ${optimization.resumeId}:`,
        error
      );
    }

    const parsedData: ParsedResumeData = JSON.parse(JSON.stringify(resume.parsedData));
    let appliedCount = 0;
    let failedCount = 0;

    for (const sug of accepted) {
      if (this.applySuggestionToResumeData(parsedData, sug)) {
        appliedCount++;
      } else {
        failedCount++;
      }
    }

    if (appliedCount === 0) {
      throw new ForbiddenException(
        'No suggestions could be applied — the resume content did not match. Re-run the optimization against the current resume.'
      );
    }

    const newVersion = resume.version + 1;

    // Content changed — the persisted diagnosis is stale
    await this.prisma.resume.update({
      where: { id: optimization.resumeId },
      data: {
        parsedData: parsedData as any,
        version: newVersion,
        parseStatus: ParseStatus.COMPLETED,
        analysisResult: Prisma.DbNull,
        analyzedAt: null,
      },
    });

    try {
      await this.resumeVersionService.createVersion(
        optimization.resumeId,
        parsedData as any,
        'AI optimization'
      );
    } catch (error) {
      this.logger.warn(
        `Failed to snapshot applied version for resume ${optimization.resumeId}:`,
        error
      );
    }

    await this.prisma.optimization.update({
      where: { id: optimizationId },
      data: { status: OptimizationStatus.COMPLETED, completedAt: new Date() },
    });

    this.logger.log(
      `Applied ${appliedCount}/${accepted.length} suggestions to resume ${optimization.resumeId}, version ${newVersion} (${failedCount} skipped)`
    );

    return {
      version: newVersion,
      appliedCount,
      failedCount,
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

    return this.resumeVersionService.getVersions(resumeId);
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

    const version = await this.resumeVersionService.restoreVersion(
      resumeId,
      versionId
    );

    // Restored content differs — invalidate the stale diagnosis
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        analysisResult: Prisma.DbNull,
        analyzedAt: null,
      },
    });

    return {
      restoredTo: version.version,
      label: version.label,
    };
  }
}
