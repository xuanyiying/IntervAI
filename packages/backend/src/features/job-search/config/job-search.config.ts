import { registerAs } from '@nestjs/config';
import {
    ScraperConfig,
    ProxyConfig,
    RetryConfig,
    ParsingConfig,
} from '../interfaces/job-search.interface';

export interface JobSearchConfig {
    scraper: {
        platforms: Record<string, ScraperConfig>;
        defaultTimeout: number;
        maxRetries: number;
        userAgent: string;
    };
    matching: {
        weights: {
            semantic: number;
            skillMatch: number;
            preference: number;
            temporal: number;
        };
        minMatchScore: number;
        embeddingModel: string;
    };
    application: {
        headless: boolean;
        slowMo: number;
        timeout: number;
        screenshotOnError: boolean;
        screenshotPath: string;
    };
    tracking: {
        emailPollingInterval: number;
        apiCheckInterval: number;
        maxRetries: number;
    };
    coach: {
        maxStudyDays: number;
        minStudyDays: number;
        defaultStudyDays: number;
        hoursPerDay: number;
    };
}

export const JOB_SEARCH_CONFIG = registerAs(
    'jobSearch',
    (): JobSearchConfig => ({
        scraper: {
            platforms: {
                arbeitnow: createArbeitnowConfig(),
                linkedin: createLinkedInConfig(),
                indeed: createIndeedConfig(),
                glassdoor: createGlassdoorConfig(),
            },
            defaultTimeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000', 10),
            maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3', 10),
            userAgent: process.env.SCRAPER_USER_AGENT ||
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        matching: {
            weights: {
                semantic: parseFloat(process.env.MATCH_WEIGHT_SEMANTIC || '0.4'),
                skillMatch: parseFloat(process.env.MATCH_WEIGHT_SKILL || '0.3'),
                preference: parseFloat(process.env.MATCH_WEIGHT_PREFERENCE || '0.2'),
                temporal: parseFloat(process.env.MATCH_WEIGHT_TEMPORAL || '0.1'),
            },
            minMatchScore: parseFloat(process.env.MIN_MATCH_SCORE || '0.5'),
            embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        },
        application: {
            headless: process.env.HEADLESS_BROWSER !== 'false',
            slowMo: parseInt(process.env.BROWSER_SLOW_MO || '100', 10),
            timeout: parseInt(process.env.APPLICATION_TIMEOUT || '60000', 10),
            screenshotOnError: process.env.SCREENSHOT_ON_ERROR === 'true',
            screenshotPath: process.env.SCREENSHOT_PATH || './screenshots',
        },
        tracking: {
            emailPollingInterval: parseInt(process.env.EMAIL_POLLING_INTERVAL || '300000', 10),
            apiCheckInterval: parseInt(process.env.API_CHECK_INTERVAL || '60000', 10),
            maxRetries: parseInt(process.env.TRACKING_MAX_RETRIES || '3', 10),
        },
        coach: {
            maxStudyDays: parseInt(process.env.MAX_STUDY_DAYS || '14', 10),
            minStudyDays: parseInt(process.env.MIN_STUDY_DAYS || '1', 10),
            defaultStudyDays: parseInt(process.env.DEFAULT_STUDY_DAYS || '7', 10),
            hoursPerDay: parseFloat(process.env.HOURS_PER_DAY || '3.0'),
        },
    })
);

function createDefaultProxyConfig(): ProxyConfig {
    return {
        enabled: process.env.PROXY_ENABLED === 'true',
        provider: (process.env.PROXY_PROVIDER as ProxyConfig['provider']) || 'custom',
        rotationStrategy: (process.env.PROXY_ROTATION_STRATEGY as ProxyConfig['rotationStrategy']) || 'per_request',
        rotationInterval: parseInt(process.env.PROXY_ROTATION_INTERVAL || '60000', 10),
        fallbackChain: process.env.PROXY_FALLBACK_CHAIN?.split(',') || [],
    };
}

function createDefaultRetryConfig(): RetryConfig {
    return {
        maxRetries: parseInt(process.env.RETRY_MAX_RETRIES || '3', 10),
        backoffStrategy: (process.env.RETRY_BACKOFF_STRATEGY as RetryConfig['backoffStrategy']) || 'exponential',
        initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000', 10),
        maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '30000', 10),
    };
}

function createDefaultParsingConfig(): ParsingConfig {
    return {
        extractSalary: process.env.PARSE_EXTRACT_SALARY !== 'false',
        extractBenefits: process.env.PARSE_EXTRACT_BENEFITS === 'true',
        extractCompanyInfo: process.env.PARSE_EXTRACT_COMPANY_INFO !== 'false',
        extractSkills: process.env.PARSE_EXTRACT_SKILLS !== 'false',
        normalizeLocation: process.env.PARSE_NORMALIZE_LOCATION !== 'false',
    };
}

function createArbeitnowConfig(): ScraperConfig {
    return {
        platform: 'arbeitnow',
        enabled: process.env.ARBEITNOW_ENABLED !== 'false',
        rateLimit: {
            requestsPerSecond: parseFloat(process.env.ARBEITNOW_RPS || '1'),
            requestsPerMinute: parseInt(process.env.ARBEITNOW_RPM || '60', 10),
            requestsPerHour: parseInt(process.env.ARBEITNOW_RPH || '600', 10),
        },
        proxyConfig: { ...createDefaultProxyConfig(), enabled: false },
        retryConfig: createDefaultRetryConfig(),
        parsingConfig: createDefaultParsingConfig(),
    };
}

function createLinkedInConfig(): ScraperConfig {
    return {
        platform: 'linkedin',
        enabled: process.env.LINKEDIN_ENABLED === 'true',
        rateLimit: {
            requestsPerSecond: parseFloat(process.env.LINKEDIN_RPS || '0.33'),
            requestsPerMinute: parseInt(process.env.LINKEDIN_RPM || '10', 10),
            requestsPerHour: parseInt(process.env.LINKEDIN_RPH || '100', 10),
        },
        proxyConfig: createDefaultProxyConfig(),
        retryConfig: createDefaultRetryConfig(),
        parsingConfig: createDefaultParsingConfig(),
    };
}

function createIndeedConfig(): ScraperConfig {
    return {
        platform: 'indeed',
        enabled: process.env.INDEED_ENABLED === 'true',
        rateLimit: {
            requestsPerSecond: parseFloat(process.env.INDEED_RPS || '0.5'),
            requestsPerMinute: parseInt(process.env.INDEED_RPM || '20', 10),
            requestsPerHour: parseInt(process.env.INDEED_RPH || '200', 10),
        },
        proxyConfig: createDefaultProxyConfig(),
        retryConfig: createDefaultRetryConfig(),
        parsingConfig: createDefaultParsingConfig(),
    };
}

function createGlassdoorConfig(): ScraperConfig {
    return {
        platform: 'glassdoor',
        enabled: process.env.GLASSDOOR_ENABLED === 'true',
        rateLimit: {
            requestsPerSecond: parseFloat(process.env.GLASSDOOR_RPS || '0.25'),
            requestsPerMinute: parseInt(process.env.GLASSDOOR_RPM || '8', 10),
            requestsPerHour: parseInt(process.env.GLASSDOOR_RPH || '80', 10),
        },
        proxyConfig: createDefaultProxyConfig(),
        retryConfig: createDefaultRetryConfig(),
        parsingConfig: createDefaultParsingConfig(),
    };
}
