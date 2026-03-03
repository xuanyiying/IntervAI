import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RawJob,
  SearchCriteria,
  ScraperConfig,
  ScraperResult,
  ScraperError,
  ScraperMetrics,
  ProxyConfig,
} from '../interfaces/job-search.interface';
import { JobSearchConfig, JOB_SEARCH_CONFIG } from '../config';

interface RateLimiterState {
  tokens: number;
  lastRefill: number;
}

interface ProxyInfo {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

interface HttpRequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

interface ScraperErrorDetail {
  platform: string;
  url?: string;
  statusCode?: number;
  message: string;
  retryable: boolean;
}

@Injectable()
export class ScraperAgent implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScraperAgent.name);
  private configs: Map<string, ScraperConfig> = new Map();
  private rateLimiters: Map<string, RateLimiterState> = new Map();
  private proxyPool: ProxyPoolManager;
  private metrics: ScraperMetrics;
  private config: JobSearchConfig['scraper'];
  private abortController: AbortController;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<JobSearchConfig['scraper']>('jobSearch.scraper')!;
    this.proxyPool = new ProxyPoolManager(this.logger);
    this.abortController = new AbortController();
    this.metrics = this.initializeMetrics();
  }

  onModuleInit(): void {
    this.initializeConfigs();
    this.logger.log('ScraperAgent initialized with platform configurations');
  }

  onModuleDestroy(): void {
    this.abortController.abort();
    this.logger.log('ScraperAgent destroyed, all pending requests cancelled');
  }

  configure(platform: string, config: ScraperConfig): void {
    this.configs.set(platform, config);
    this.rateLimiters.set(platform, {
      tokens: config.rateLimit.requestsPerSecond,
      lastRefill: Date.now(),
    });
    this.logger.log(`Configured scraper for platform: ${platform}`);
  }

  async collectJobs(criteria: SearchCriteria): Promise<ScraperResult> {
    const enabledPlatforms = this.getEnabledPlatforms();
    const allJobs: RawJob[] = [];
    const errors: ScraperError[] = [];
    const startTime = Date.now();

    this.logger.log(`Starting job collection from ${enabledPlatforms.length} platforms`);

    if (enabledPlatforms.length === 0) {
      this.logger.warn('No platforms enabled for scraping');
      return {
        success: false,
        jobs: [],
        errors: [{ type: 'unknown', message: 'No platforms enabled', timestamp: new Date(), recoverable: false }],
        metrics: this.metrics,
      };
    }

    const results = await Promise.allSettled(
      enabledPlatforms.map((platform) => this.scrapePlatformWithRetry(platform, criteria))
    );

    results.forEach((result, index) => {
      const platform = enabledPlatforms[index];
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value.jobs);
        if (result.value.errors.length > 0) {
          errors.push(...result.value.errors);
        }
      } else {
        this.logger.error(`Platform ${platform} failed: ${result.reason}`);
        errors.push({
          type: 'unknown',
          message: result.reason instanceof Error ? result.reason.message : String(result.reason),
          timestamp: new Date(),
          recoverable: true,
        });
      }
    });

    const totalTime = Date.now() - startTime;
    this.updateMetrics(allJobs.length, enabledPlatforms.length, totalTime);

    this.logger.log(
      `Job collection complete: ${allJobs.length} jobs collected in ${totalTime}ms`
    );

    return {
      success: allJobs.length > 0,
      jobs: allJobs,
      errors,
      metrics: this.metrics,
    };
  }

  private async scrapePlatformWithRetry(
    platform: string,
    criteria: SearchCriteria
  ): Promise<{ jobs: RawJob[]; errors: ScraperError[] }> {
    const config = this.configs.get(platform);
    if (!config) {
      throw new Error(`No configuration found for platform: ${platform}`);
    }

    const maxRetries = config.retryConfig.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForRateLimit(platform, config);
        const jobs = await this.scrapePlatform(platform, criteria, config);
        return { jobs, errors: [] };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorDetail = this.categorizeError(error, platform);

        if (!errorDetail.retryable || attempt === maxRetries) {
          this.logger.error(
            `Scraping ${platform} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${errorDetail.message}`
          );
          break;
        }

        const delay = this.calculateBackoffDelay(config.retryConfig, attempt);
        this.logger.warn(
          `Retrying ${platform} in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`
        );
        await this.delay(delay);

        if (errorDetail.statusCode === 403 || errorDetail.statusCode === 429) {
          this.metrics.blocksEncountered++;
          await this.handleBlocking(platform);
        }
      }
    }

    return {
      jobs: [],
      errors: [
        {
          type: 'unknown',
          message: lastError?.message || 'Unknown error',
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }

  private async scrapePlatform(
    platform: string,
    criteria: SearchCriteria,
    config: ScraperConfig
  ): Promise<RawJob[]> {
    const proxy = config.proxyConfig.enabled
      ? await this.proxyPool.getProxy(config.proxyConfig.provider)
      : null;

    switch (platform) {
      case 'arbeitnow':
        return this.scrapeArbeitnow(criteria);
      case 'linkedin':
        return this.scrapeLinkedIn(criteria, proxy);
      case 'indeed':
        return this.scrapeIndeed(criteria, proxy);
      case 'glassdoor':
        return this.scrapeGlassdoor(criteria, proxy);
      default:
        this.logger.warn(`Unknown platform: ${platform}`);
        return [];
    }
  }

  private async scrapeArbeitnow(criteria: SearchCriteria): Promise<RawJob[]> {
    this.logger.debug('Fetching jobs from Arbeitnow API...');

    const apiUrl = 'https://www.arbeitnow.com/api/job-board-api';
    const response = await this.httpRequest<{ data: ArbeitnowJob[] }>(apiUrl, {
      method: 'GET',
      timeout: this.config.defaultTimeout,
    });

    if (!response || !response.data) {
      this.logger.warn('Arbeitnow API returned empty response');
      return [];
    }

    const jobs: RawJob[] = [];
    const keywords = criteria.keywords?.map((k) => k.toLowerCase()) || [];

    for (const job of response.data) {
      if (keywords.length > 0) {
        const titleMatch = job.title?.toLowerCase();
        const tagsMatch = job.tags?.map((t) => t.toLowerCase()) || [];
        const hasKeyword = keywords.some(
          (kw) => titleMatch?.includes(kw) || tagsMatch.some((t) => t.includes(kw))
        );
        if (!hasKeyword) continue;
      }

      if (criteria.location) {
        const locationMatch = job.location?.toLowerCase().includes(criteria.location.toLowerCase());
        if (!locationMatch) continue;
      }

      jobs.push({
        id: `arbeitnow-${job.slug || job.id || Date.now()}`,
        platform: 'arbeitnow',
        externalId: job.slug || String(job.id),
        rawJson: job,
        scrapedAt: new Date(),
        url: job.url || `https://www.arbeitnow.com/job/${job.slug}`,
      });
    }

    this.logger.log(`Collected ${jobs.length} jobs from Arbeitnow`);
    return jobs;
  }

  private async scrapeLinkedIn(
    criteria: SearchCriteria,
    proxy: ProxyInfo | null
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping LinkedIn Jobs...');

    const searchUrl = this.buildLinkedInSearchUrl(criteria);
    const html = await this.httpRequest<string>(searchUrl, {
      method: 'GET',
      timeout: this.config.defaultTimeout,
    }, proxy);

    if (!html) {
      this.logger.warn('LinkedIn returned empty response');
      return [];
    }

    const jobs = this.parseLinkedInHtml(html, searchUrl);
    this.logger.log(`Collected ${jobs.length} jobs from LinkedIn`);
    return jobs;
  }

  private async scrapeIndeed(
    criteria: SearchCriteria,
    proxy: ProxyInfo | null
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping Indeed...');

    const searchUrl = this.buildIndeedSearchUrl(criteria);
    const html = await this.httpRequest<string>(searchUrl, {
      method: 'GET',
      timeout: this.config.defaultTimeout,
    }, proxy);

    if (!html) {
      this.logger.warn('Indeed returned empty response');
      return [];
    }

    const jobs = this.parseIndeedHtml(html, searchUrl);
    this.logger.log(`Collected ${jobs.length} jobs from Indeed`);
    return jobs;
  }

  private async scrapeGlassdoor(
    criteria: SearchCriteria,
    proxy: ProxyInfo | null
  ): Promise<RawJob[]> {
    this.logger.debug('Scraping Glassdoor...');

    const searchUrl = this.buildGlassdoorSearchUrl(criteria);
    const html = await this.httpRequest<string>(searchUrl, {
      method: 'GET',
      timeout: this.config.defaultTimeout,
    }, proxy);

    if (!html) {
      this.logger.warn('Glassdoor returned empty response');
      return [];
    }

    const jobs = this.parseGlassdoorHtml(html, searchUrl);
    this.logger.log(`Collected ${jobs.length} jobs from Glassdoor`);
    return jobs;
  }

  private async httpRequest<T>(
    url: string,
    options: HttpRequestOptions = {},
    proxy?: ProxyInfo | null
  ): Promise<T> {
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(options.timeout || this.config.defaultTimeout),
    };

    if (proxy) {
      this.logger.debug(`Using proxy: ${proxy.host}:${proxy.port}`);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, url);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return response.json() as Promise<T>;
      }
      return response.text() as Promise<T>;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new HttpError(408, 'Request timeout', url);
        }
      }
      throw error;
    }
  }

  private parseLinkedInHtml(html: string, baseUrl: string): RawJob[] {
    const jobs: RawJob[] = [];
    const jobPattern = /data-job-id="([^"]+)"/g;
    const titlePattern = /data-job-title="([^"]+)"/g;
    const companyPattern = /data-company-name="([^"]+)"/g;

    let match;
    const jobIds: string[] = [];
    while ((match = jobPattern.exec(html)) !== null) {
      jobIds.push(match[1]);
    }

    const titles: string[] = [];
    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(this.decodeHtmlEntities(match[1]));
    }

    const companies: string[] = [];
    while ((match = companyPattern.exec(html)) !== null) {
      companies.push(this.decodeHtmlEntities(match[1]));
    }

    const count = Math.min(jobIds.length, titles.length, companies.length);
    for (let i = 0; i < count; i++) {
      jobs.push({
        id: `linkedin-${jobIds[i]}`,
        platform: 'linkedin',
        externalId: jobIds[i],
        rawHtml: html,
        scrapedAt: new Date(),
        url: `https://www.linkedin.com/jobs/view/${jobIds[i]}`,
      });
    }

    return jobs;
  }

  private parseIndeedHtml(html: string, baseUrl: string): RawJob[] {
    const jobs: RawJob[] = [];
    const jobPattern = /data-jk="([^"]+)"/g;
    const titlePattern = /jobTitle[^>]*>([^<]+)</g;

    let match;
    const jobIds: string[] = [];
    while ((match = jobPattern.exec(html)) !== null) {
      jobIds.push(match[1]);
    }

    const titles: string[] = [];
    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(this.decodeHtmlEntities(match[1].trim()));
    }

    for (let i = 0; i < jobIds.length; i++) {
      jobs.push({
        id: `indeed-${jobIds[i]}`,
        platform: 'indeed',
        externalId: jobIds[i],
        rawHtml: html,
        scrapedAt: new Date(),
        url: `https://www.indeed.com/viewjob?jk=${jobIds[i]}`,
      });
    }

    return jobs;
  }

  private parseGlassdoorHtml(html: string, baseUrl: string): RawJob[] {
    const jobs: RawJob[] = [];
    const jobPattern = /data-id="(\d+)"/g;
    const listingPattern = /"jobListingId":"(\d+)"/g;

    let match;
    const jobIds: Set<string> = new Set();

    while ((match = jobPattern.exec(html)) !== null) {
      jobIds.add(match[1]);
    }

    while ((match = listingPattern.exec(html)) !== null) {
      jobIds.add(match[1]);
    }

    for (const jobId of jobIds) {
      jobs.push({
        id: `glassdoor-${jobId}`,
        platform: 'glassdoor',
        externalId: jobId,
        rawHtml: html,
        scrapedAt: new Date(),
        url: `https://www.glassdoor.com/job-listing/job?jl=${jobId}`,
      });
    }

    return jobs;
  }

  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&nbsp;': ' ',
    };
    return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
  }

  private async waitForRateLimit(platform: string, config: ScraperConfig): Promise<void> {
    const limiter = this.rateLimiters.get(platform);
    if (!limiter) return;

    const now = Date.now();
    const timePassed = (now - limiter.lastRefill) / 1000;
    const maxTokens = config.rateLimit.requestsPerSecond;
    const refillAmount = timePassed * config.rateLimit.requestsPerSecond;

    limiter.tokens = Math.min(maxTokens, limiter.tokens + refillAmount);
    limiter.lastRefill = now;

    if (limiter.tokens < 1) {
      const tokensNeeded = 1 - limiter.tokens;
      const delayMs = (tokensNeeded / config.rateLimit.requestsPerSecond) * 1000;
      this.logger.debug(`Rate limit reached for ${platform}, waiting ${delayMs}ms`);
      await this.delay(delayMs);
    }

    limiter.tokens--;
  }

  private categorizeError(error: unknown, platform: string): ScraperErrorDetail {
    if (error instanceof HttpError) {
      const retryable = error.statusCode >= 500 || error.statusCode === 429;
      return {
        platform,
        url: error.url,
        statusCode: error.statusCode,
        message: `HTTP ${error.statusCode}: ${error.message}`,
        retryable,
      };
    }

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return { platform, message: 'Network error', retryable: true };
      }
      if (error.message.includes('timeout')) {
        return { platform, message: 'Request timeout', retryable: true };
      }
    }

    return {
      platform,
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    };
  }

  private calculateBackoffDelay(
    retryConfig: ScraperConfig['retryConfig'],
    attempt: number
  ): number {
    const { backoffStrategy, initialDelay, maxDelay } = retryConfig;

    switch (backoffStrategy) {
      case 'exponential':
        return Math.min(maxDelay, initialDelay * Math.pow(2, attempt));
      case 'linear':
        return Math.min(maxDelay, initialDelay * (attempt + 1));
      case 'fixed':
      default:
        return initialDelay;
    }
  }

  private async handleBlocking(platform: string): Promise<void> {
    this.logger.warn(`Blocked on ${platform}, rotating proxy and backing off`);
    await this.proxyPool.rotate();
    this.metrics.proxyRotations++;
  }

  private getEnabledPlatforms(): string[] {
    return Array.from(this.configs.entries())
      .filter(([_, config]) => config.enabled)
      .map(([platform]) => platform);
  }

  private buildLinkedInSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const params = new URLSearchParams();

    if (criteria.keywords?.length) {
      params.append('keywords', criteria.keywords.join(' '));
    }
    if (criteria.title) {
      params.append('title', criteria.title);
    }
    if (criteria.location) {
      params.append('location', criteria.location);
    }
    if (criteria.remotePolicy) {
      const remoteMap: Record<string, string> = {
        remote: '2',
        hybrid: '1',
        onsite: '0',
      };
      params.append('f_WT', remoteMap[criteria.remotePolicy] || '');
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildIndeedSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.indeed.com/jobs';
    const params = new URLSearchParams();

    const query = criteria.keywords?.join(' ') || criteria.title || '';
    params.append('q', query);

    if (criteria.location) {
      params.append('l', criteria.location);
    }
    if (criteria.salaryMin) {
      params.append('salary', String(criteria.salaryMin));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private buildGlassdoorSearchUrl(criteria: SearchCriteria): string {
    const baseUrl = 'https://www.glassdoor.com/Job/jobs';
    const params = new URLSearchParams();

    const query = criteria.keywords?.join(' ') || criteria.title || '';
    params.append('sc.keyword', query);

    if (criteria.location) {
      params.append('locT', 'C');
      params.append('locId', criteria.location);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private initializeMetrics(): ScraperMetrics {
    return {
      jobsCollected: 0,
      successRate: 0,
      avgResponseTime: 0,
      blocksEncountered: 0,
      proxyRotations: 0,
      captchaSolved: 0,
    };
  }

  private updateMetrics(jobsCount: number, platformsCount: number, totalTime: number): void {
    this.metrics.jobsCollected = jobsCount;
    this.metrics.successRate = platformsCount > 0 ? jobsCount / platformsCount : 0;
    this.metrics.avgResponseTime = platformsCount > 0 ? totalTime / platformsCount : 0;
  }

  private initializeConfigs(): void {
    Object.entries(this.config.platforms).forEach(([platform, config]) => {
      this.configs.set(platform, config);
      this.rateLimiters.set(platform, {
        tokens: config.rateLimit.requestsPerSecond,
        lastRefill: Date.now(),
      });
    });
  }

  getMetrics(): ScraperMetrics {
    return { ...this.metrics };
  }
}

class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly url: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface ArbeitnowJob {
  id?: number;
  slug?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  url?: string;
  remote?: boolean;
  tags?: string[];
}

class ProxyPoolManager {
  private proxies: Map<string, ProxyInfo[]> = new Map();
  private currentIndex: Map<string, number> = new Map();

  constructor(private readonly logger: Logger) { }

  async getProxy(provider: string): Promise<ProxyInfo | null> {
    let providerProxies = this.proxies.get(provider);

    if (!providerProxies || providerProxies.length === 0) {
      providerProxies = await this.fetchProxies(provider);
      this.proxies.set(provider, providerProxies);
    }

    if (providerProxies.length === 0) {
      this.logger.warn(`No proxies available for provider: ${provider}`);
      return null;
    }

    const index = this.currentIndex.get(provider) || 0;
    const proxy = providerProxies[index % providerProxies.length];
    this.currentIndex.set(provider, (index + 1) % providerProxies.length);

    return proxy;
  }

  async rotate(): Promise<void> {
    const providers = Array.from(this.proxies.keys());
    for (const provider of providers) {
      await this.fetchProxies(provider);
      this.currentIndex.set(provider, 0);
    }
  }

  private async fetchProxies(provider: string): Promise<ProxyInfo[]> {
    const proxyUrl = process.env[`PROXY_URL_${provider.toUpperCase()}`];
    const proxyCredentials = process.env[`PROXY_CREDENTIALS_${provider.toUpperCase()}`];

    if (proxyUrl) {
      const [host, port] = proxyUrl.split(':');
      const [username, password] = proxyCredentials?.split(':') || [];

      return [{
        host,
        port: parseInt(port, 10),
        username,
        password,
      }];
    }

    this.logger.debug(`No proxy configured for provider: ${provider}`);
    return [];
  }
}
