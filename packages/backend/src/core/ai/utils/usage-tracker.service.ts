/**
 * Usage Tracker Service
 * Tracks AI usage for cost monitoring and analytics
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { RedisService } from '@/shared/cache/redis.service';

export interface UsageRecordInput {
    userId: string;
    model: string;
    provider: string;
    scenario?: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latency: number;
    success: boolean;
    errorMessage?: string;
}

export interface UsageStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    averageLatency: number;
}

export interface DailyUsage {
    date: string;
    calls: number;
    tokens: number;
    cost: number;
}

@Injectable()
export class UsageTrackerService {
    private readonly logger = new Logger(UsageTrackerService.name);
    private readonly CACHE_TTL = 3600;

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService
    ) { }

    async trackUsage(record: UsageRecordInput): Promise<void> {
        try {
            await this.prisma.usageRecord.create({
                data: {
                    userId: record.userId,
                    model: record.model,
                    provider: record.provider,
                    scenario: record.scenario,
                    inputTokens: record.inputTokens,
                    outputTokens: record.outputTokens,
                    cost: record.cost,
                    latency: record.latency,
                    success: record.success,
                    errorCode: record.errorMessage,
                },
            });

            await this.invalidateUserCache(record.userId);

            this.logger.debug(
                `Tracked usage: user=${record.userId}, model=${record.model}, tokens=${record.inputTokens + record.outputTokens}, cost=${record.cost.toFixed(6)}`
            );
        } catch (error) {
            this.logger.error(
                `Failed to track usage: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async getUsageStats(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UsageStats> {
        const cacheKey = `usage:stats:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`;

        const cached = await this.redis.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached) as UsageStats;
            } catch {
                // Ignore parse errors
            }
        }

        const logs = await this.prisma.usageRecord.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const stats: UsageStats = {
            totalCalls: logs.length,
            successfulCalls: logs.filter((l) => l.success).length,
            failedCalls: logs.filter((l) => !l.success).length,
            totalCost: logs.reduce((sum, l) => sum + Number(l.cost), 0),
            totalInputTokens: logs.reduce((sum, l) => sum + l.inputTokens, 0),
            totalOutputTokens: logs.reduce((sum, l) => sum + l.outputTokens, 0),
            averageLatency:
                logs.length > 0
                    ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length
                    : 0,
        };

        await this.redis.set(cacheKey, JSON.stringify(stats), this.CACHE_TTL);

        return stats;
    }

    async getDailyUsage(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<DailyUsage[]> {
        const logs = await this.prisma.usageRecord.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                timestamp: true,
                inputTokens: true,
                outputTokens: true,
                cost: true,
            },
        });

        const dailyMap = new Map<string, DailyUsage>();

        for (const log of logs) {
            const date = log.timestamp.toISOString().split('T')[0];
            const existing = dailyMap.get(date) || {
                date,
                calls: 0,
                tokens: 0,
                cost: 0,
            };

            existing.calls++;
            existing.tokens += log.inputTokens + log.outputTokens;
            existing.cost += Number(log.cost);

            dailyMap.set(date, existing);
        }

        return Array.from(dailyMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    }

    async getModelUsage(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, { calls: number; tokens: number; cost: number }>> {
        const logs = await this.prisma.usageRecord.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                model: true,
                inputTokens: true,
                outputTokens: true,
                cost: true,
            },
        });

        const modelUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};

        for (const log of logs) {
            if (!modelUsage[log.model]) {
                modelUsage[log.model] = { calls: 0, tokens: 0, cost: 0 };
            }

            modelUsage[log.model].calls++;
            modelUsage[log.model].tokens += log.inputTokens + log.outputTokens;
            modelUsage[log.model].cost += Number(log.cost);
        }

        return modelUsage;
    }

    async getProviderUsage(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, { calls: number; tokens: number; cost: number }>> {
        const logs = await this.prisma.usageRecord.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                provider: true,
                inputTokens: true,
                outputTokens: true,
                cost: true,
            },
        });

        const providerUsage: Record<string, { calls: number; tokens: number; cost: number }> = {};

        for (const log of logs) {
            if (!providerUsage[log.provider]) {
                providerUsage[log.provider] = { calls: 0, tokens: 0, cost: 0 };
            }

            providerUsage[log.provider].calls++;
            providerUsage[log.provider].tokens += log.inputTokens + log.outputTokens;
            providerUsage[log.provider].cost += Number(log.cost);
        }

        return providerUsage;
    }

    async getMonthlyCost(userId: string, year: number, month: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const result = await this.prisma.usageRecord.aggregate({
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                cost: true,
            },
        });

        return Number(result._sum.cost) || 0;
    }

    private async invalidateUserCache(userId: string): Promise<void> {
        const pattern = `usage:stats:${userId}:*`;
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.redis.del(key);
                }
            }
        } catch (error) {
            this.logger.warn(
                `Failed to invalidate cache for user ${userId}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
