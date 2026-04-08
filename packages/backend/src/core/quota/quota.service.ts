import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';

export interface QuotaInfo {
  tier: SubscriptionTier;
  optimizationsUsed: number;
  optimizationsLimit: number;
  optimizationsResetAt: Date;
  pdfGenerationsUsed: number;
  pdfGenerationsLimit: number;
  pdfGenerationsResetAt: Date;
  canOptimize: boolean;
  canGeneratePdf: boolean;
}

/**
 * OSS Community Edition: NoopQuotaService
 *
 * This is a fully-permissive stub that powers the open-source build.
 * All quota checks pass immediately — self-hosted users own their own
 * API keys and bear their own costs.
 *
 * In EE (commercial SaaS) mode, the EeModule registers its own
 * real QuotaService over this one via NestJS DI override.
 */
@Injectable()
export class QuotaService {
  async canStartInterview(_userId: string): Promise<boolean> {
    return true;
  }

  async incrementInterviewCount(_userId: string): Promise<void> {}

  async canOptimize(_userId: string): Promise<boolean> {
    return true;
  }

  async incrementOptimizationCount(_userId: string): Promise<void> {}

  async canGeneratePdf(_userId: string): Promise<boolean> {
    return true;
  }

  async incrementPdfCount(_userId: string): Promise<void> {}

  async getQuotaInfo(_userId: string): Promise<QuotaInfo> {
    return {
      tier: SubscriptionTier.PRO,
      optimizationsUsed: 0,
      optimizationsLimit: -1,
      optimizationsResetAt: new Date(0),
      pdfGenerationsUsed: 0,
      pdfGenerationsLimit: -1,
      pdfGenerationsResetAt: new Date(0),
      canOptimize: true,
      canGeneratePdf: true,
    };
  }

  async enforceOptimizationQuota(_userId: string): Promise<void> {}

  async enforcePdfQuota(_userId: string): Promise<void> {}

  async enforceInterviewQuota(_userId: string): Promise<void> {}
}
