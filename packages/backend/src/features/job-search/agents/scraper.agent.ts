/**
 * Scraper Agent
 *
 * Responsible for collecting job postings from multiple platforms
 * with rate limiting, proxy rotation, and compliance handling
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  RawJob,
  SearchCriteria,
  ScraperConfig,
  ScraperResult,
  ScraperError,
  ScraperMetrics,
  ProxyConfig,
} from '../interfaces/job-search.interface';

@Injectable()
export class ScraperAgent {
  private readonly logger = new Logger(ScraperAgent.name);
  private configs: Map<string, ScraperConfig> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private proxyPool: ProxyPool;
  private metrics: ScraperMetrics = {
    jobsCollected: 0,
    successRate: 0,
    avgResponseTime: 0,
    blocksEncountered: 0,
    proxyRotations: 0,
    captchaSolved: 0,
  };

  constructor() {
    this.proxyPool = new ProxyPool();
    this.initializeDefaultConfigs();
  }

  /**
   * Configure scraper for a specific platform
   */
  configure(platform: string, config: ScraperConfig): void {
    this.configs.set(platform, config);
    this.rateLimiters.set(platform, new RateLimiter(config.rateLimit));
    this.logger.log(`Configured scraper for platform: ${platform}`);
  }

  /**
   * Collect jobs from all enabled platforms
   */
  async collectJobs(criteria: SearchCriteria): Promise<ScraperResult> {
    const enabledPlatforms = this.getEnabledPlatforms();
    const allJobs: RawJob[] = [];
    const errors: ScraperError[] = [];

    this.logger.log(
      `Starting job collection from ${enabledPlatforms.length} platforms`
    );

    // Execute scraping in parallel for all platforms
    const scrapingPromises = enabledPlatforms.map(async (platform) => {
      try {
        const jobs = await this.scrapePlatform(platform, criteria);
        allJobs.push(...jobs);
      } catch (error) {
        this.logger.error(`Error scraping ${platform}:`, error);
        errors.push({
          type: 'unknown',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          recoverable: true,
        });
      }
    });

    await Promise.all(scrapingPromises);

    // Update metrics
    this.metrics.jobsCollected = allJobs.length;
    this.metrics.successRate = allJobs.length / (enabledPlatforms.length || 1);

    this.logger.log(
      `Job collection complete: ${allJobs.length} jobs collected`
    );

    return {
      success: allJobs.length > 0,
      jobs: allJobs,
      errors,
      metrics: this.metrics,
    };
  }

  /**
   * Scrape a specific platform
   */
  private async scrapePlatform(
    platform: string,
    criteria: SearchCriteria
  ): Promise<RawJob[]> {
    const config = this.configs.get(platform);
    if (!config?.enabled) {
      this.logger.warn(`Platform ${platform} is not enabled`);
      return [];
    }

    // Check rate limit
    const rateLimiter = this.rateLimiters.get(platform);
    if (rateLimiter && !rateLimiter.canProceed()) {
      const delay = rateLimiter.getDelay();
      this.logger.debug(
        `Rate limit reached for ${platform}, waiting ${delay}ms`
      );
      await this.delay(delay);
    }

    // Get proxy
    const proxy = await this.getProxy(config.proxyConfig);

    try {
      // Platform-specific scraping
      switch (platform) {
        case 'arbeitnow':
          return await this.scrapeArbeitnow(criteria);
        case 'linkedin':
          return await this.scrapeLinkedIn(criteria, proxy);
        case 'indeed':
          return await this.scrapeIndeed(criteria, proxy);
        case 'glassdoor':
          return await this.scrapeGlassdoor(criteria, proxy);
        default:
          this.logger.warn(`Unknown platform: ${platform}`);
          return [];
      }
    } catch (error) {
      // Handle anti-scraping measures
      if (this.isBlocked(error)) {
        this.metrics.blocksEncountered++;
        await this.handleBlocking(platform, error);
      }
      throw error;
    }
  }

  /**
   * Scrape Arbeitnow (Free API for MVP)
   */
  private async scrapeArbeitnow(criteria: SearchCriteria): Promise<RawJob[]> {
    this.logger.debug('Fetching jobs from Arbeitnow API...');

    const jobs: RawJob[] = [];

    try {
      // Use native fetch (Node 18+)
      const response = await fetch(
        'https://www.arbeitnow.com/api/job-board-api'
      );
      const data = await response.json();

      if (data && data.data) {
        data.data.forEach((job: any) => {
          // Filter by criteria if provided
          if (criteria.keywords && criteria.keywords.length > 0) {
            const hasKeyword = criteria.keywords.some(
              (kw) =>
                job.title?.toLowerCase().includes(kw.toLowerCase()) ||
                (job.tags &&
                  job.tags.some((t: string) =>
                    t.toLowerCase().includes(kw.toLowerCase())
                  ))
            );
            if (!hasKeyword) return;
          }

          jobs.push({
            id: `arbeitnow-${job.slug}`,
            platform: 'arbeitnow',
            externalId: job.slug,
            rawJson: job, // Store the raw JSON for the parser
            scrapedAt: new Date(),
            url: job.url,
          });
        });
      }

      this.logger.log(`Collected ${jobs.length} jobs from Arbeitnow`);
    } catch (error) {
      this.logger.error('Arbeitnow API fetch failed:', error);
      throw error;
    }

    return jobs;
  }

  /**
   * Scrape LinkedIn Jobs
   */
  private async scrapeLinkedIn(
    criteria: SearchCriteria,
    proxy: any
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping LinkedIn Jobs...');

    // Implementation would use Puppeteer/Playwright or LinkedIn API
    // This is a simplified example
    const jobs: RawJob[] = [];

    // Simulate job collection
    const searchUrl = this.buildLinkedInSearchUrl(criteria);

    try {
      // In production, this would:
      // 1. Navigate to search URL with proper headers
      // 2. Wait for results to load
      // 3. Parse job listings
      // 4. Extract job details

      jobs.push({
        id: `linkedin-${Date.now()}`,
        platform: 'linkedin',
        externalId: 'ext_123',
        scrapedAt: new Date(),
        url: searchUrl,
      });

      this.logger.log(`Collected ${jobs.length} jobs from LinkedIn`);
    } catch (error) {
      this.logger.error('LinkedIn scraping failed:', error);
      throw error;
    }

    return jobs;
  }

  /**
   * Scrape Indeed
   */
  private async scrapeIndeed(
    criteria: SearchCriteria,
    proxy: any
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping Indeed...');

    const jobs: RawJob[] = [];

    // Implementation similar to LinkedIn
    const searchUrl = this.buildIndeedSearchUrl(criteria);

    try {
      // Indeed scraping logic
      jobs.push({
        id: `indeed-${Date.now()}`,
        platform: 'indeed',
        externalId: 'ext_456',
        scrapedAt: new Date(),
        url: searchUrl,
      });

      this.logger.log(`Collected ${jobs.length} jobs from Indeed`);
    } catch (error) {
      this.logger.error('Indeed scraping failed:', error);
      throw error;
    }

    return jobs;
  }

  /**
   * Scrape Glassdoor
   */
  private async scrapeGlassdoor(
    criteria: SearchCriteria,
    proxy: any
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping Glassdoor...');

    const jobs: RawJob[] = [];

    const searchUrl = this.buildGlassdoorSearchUrl(criteria);

    try {
      // Glassdoor scraping logic
      jobs.push({
        id: `glassdoor-${Date.now()}`,
        platform: 'glassdoor',
        externalId: 'ext_789',
        scrapedAt: new Date(),
        url: searchUrl,
      });

      this.logger.log(`Collected ${jobs.length} jobs from Glassdoor`);
    } catch (error) {
      this.logger.error('Glassdoor scraping failed:', error);
      throw error;
    }

    return jobs;
  }

  /**
   * Check if request was blocked
   */
  private isBlocked(error: any): boolean {
    return (
      error.statusCode === 403 ||
      error.statusCode === 429 ||
      error.message?.includes('blocked') ||
      error.message?.includes('captcha')
    );
  }

  /**
   * Handle blocking by rotating proxy and implementing backoff
   */
  private async handleBlocking(platform: string, error: any): Promise<void> {
    this.logger.warn(`Blocked on ${platform}, rotating proxy and backing off`);

    // Rotate proxy
    await this.proxyPool.rotate();
    this.metrics.proxyRotations++;

    // Implement exponential backoff
    const backoffDelay = Math.min(
      30000,
      1000 * Math.pow(2, this.metrics.blocksEncountered)
    );
    await this.delay(backoffDelay);
  }

  /**
   * Get proxy from pool
   */
  private async getProxy(config: ProxyConfig): Promise<any> {
    if (!config.enabled) {
      return null;
    }

    const proxy = await this.proxyPool.getProxy(config.provider);
    return proxy;
  }

  /**
   * Get enabled platforms
   */
  private getEnabledPlatforms(): string[] {
    return Array.from(this.configs.entries())
      .filter(([_, config]) => config.enabled)
      .map(([platform, _]) => platform);
  }

  /**
   * Build search URL for LinkedIn
   */
  private buildLinkedInSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const params = new URLSearchParams();

    if (criteria.keywords) {
      params.append('keywords', criteria.keywords.join(' '));
    }
    if (criteria.location) {
      params.append('location', criteria.location as any);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Build search URL for Indeed
   */
  private buildIndeedSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.indeed.com/jobs';
    const params = new URLSearchParams();

    if (criteria.title) {
      params.append('q', criteria.title);
    }
    if (criteria.location) {
      params.append('l', criteria.location as any);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Build search URL for Glassdoor
   */
  private buildGlassdoorSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.glassdoor.com/Job/jobs';
    const params = new URLSearchParams();

    if (criteria.keywords) {
      params.append('sc.keyword', criteria.keywords.join(' '));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Initialize default configurations
   */
  private initializeDefaultConfigs(): void {
    // Arbeitnow config (Free API)
    this.configs.set('arbeitnow', {
      platform: 'arbeitnow',
      enabled: true, // Enable by default for MVP
      rateLimit: {
        requestsPerSecond: 1,
        requestsPerMinute: 60,
        requestsPerHour: 600,
      },
      proxyConfig: {
        enabled: false, // No proxy needed for free API
        provider: 'custom',
        rotationStrategy: 'per_request',
        fallbackChain: [],
      },
      retryConfig: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000,
      },
      parsingConfig: {
        extractSalary: true,
        extractBenefits: true,
        extractCompanyInfo: true,
        extractSkills: true,
        normalizeLocation: true,
      },
    });

    // LinkedIn config
    this.configs.set('linkedin', {
      platform: 'linkedin',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 0.33, // 1 request per 3 seconds
        requestsPerMinute: 10,
        requestsPerHour: 100,
      },
      proxyConfig: {
        enabled: true,
        provider: 'brightdata',
        rotationStrategy: 'per_request',
        fallbackChain: ['oxylabs', 'smartproxy'],
      },
      retryConfig: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
      },
      parsingConfig: {
        extractSalary: true,
        extractBenefits: true,
        extractCompanyInfo: true,
        extractSkills: true,
        normalizeLocation: true,
      },
    });

    // Indeed config
    this.configs.set('indeed', {
      platform: 'indeed',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 0.5, // 1 request per 2 seconds
        requestsPerMinute: 20,
        requestsPerHour: 200,
      },
      proxyConfig: {
        enabled: true,
        provider: 'brightdata',
        rotationStrategy: 'per_session',
        fallbackChain: ['oxylabs'],
      },
      retryConfig: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
      },
      parsingConfig: {
        extractSalary: true,
        extractBenefits: false,
        extractCompanyInfo: true,
        extractSkills: true,
        normalizeLocation: true,
      },
    });

    // Glassdoor config
    this.configs.set('glassdoor', {
      platform: 'glassdoor',
      enabled: true,
      rateLimit: {
        requestsPerSecond: 0.25, // 1 request per 4 seconds
        requestsPerMinute: 8,
        requestsPerHour: 80,
      },
      proxyConfig: {
        enabled: true,
        provider: 'oxylabs',
        rotationStrategy: 'per_request',
        fallbackChain: ['brightdata'],
      },
      retryConfig: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        initialDelay: 2000,
        maxDelay: 60000,
      },
      parsingConfig: {
        extractSalary: true,
        extractBenefits: true,
        extractCompanyInfo: true,
        extractSkills: true,
        normalizeLocation: true,
      },
    });

    // Initialize rate limiters
    this.configs.forEach((config, platform) => {
      this.rateLimiters.set(platform, new RateLimiter(config.rateLimit));
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): ScraperMetrics {
    return { ...this.metrics };
  }
}

/**
 * Rate Limiter implementation
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };

  constructor(config: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  }) {
    this.config = config;
    this.tokens = config.requestsPerSecond;
    this.lastRefill = Date.now();
  }

  canProceed(): boolean {
    this.refill();
    return this.tokens >= 1;
  }

  consume(): void {
    if (this.canProceed()) {
      this.tokens--;
    }
  }

  getDelay(): number {
    if (this.canProceed()) {
      return 0;
    }

    const refillRate = this.config.requestsPerSecond;
    const timeSinceLastRefill = Date.now() - this.lastRefill;
    const tokensNeeded = 1 - this.tokens;
    const timeNeeded = (tokensNeeded / refillRate) * 1000;

    return Math.max(0, timeNeeded - timeSinceLastRefill);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds

    const maxTokens = this.config.requestsPerSecond;
    const refillAmount = timePassed * this.config.requestsPerSecond;

    this.tokens = Math.min(maxTokens, this.tokens + refillAmount);
    this.lastRefill = now;
  }
}

/**
 * Proxy Pool manager
 */
class ProxyPool {
  private proxies: Map<string, ProxyInfo[]> = new Map();
  private currentIndex: Map<string, number> = new Map();

  async getProxy(provider: string): Promise<any> {
    const providerProxies = this.proxies.get(provider) || [];

    if (providerProxies.length === 0) {
      // In production, fetch from proxy service
      await this.fetchProxies(provider);
    }

    const index = this.currentIndex.get(provider) || 0;
    const proxy = providerProxies[index % providerProxies.length];

    this.currentIndex.set(provider, (index + 1) % providerProxies.length);

    return proxy;
  }

  async rotate(): Promise<void> {
    // Rotate all proxy pools
    const providers = Array.from(this.proxies.keys());
    for (const provider of providers) {
      await this.fetchProxies(provider);
      this.currentIndex.set(provider, 0);
    }
  }

  private async fetchProxies(provider: string): Promise<void> {
    // In production, call proxy provider API
    // This is a placeholder
    this.proxies.set(provider, [
      { host: 'proxy1.example.com', port: 8080 },
      { host: 'proxy2.example.com', port: 8080 },
    ]);
  }
}

interface ProxyInfo {
  host: string;
  port: number;
  username?: string;
  password?: string;
}
