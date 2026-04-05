import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../packages/backend/.env') });

export type TestEnvironment = 'test' | 'staging' | 'production';

export interface TestConfig {
  environment: TestEnvironment;
  apiBaseUrl: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  timeout: TimeoutConfig;
  retry: RetryConfig;
  parallel: boolean;
}

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface TimeoutConfig {
  default: number;
  upload: number;
  ai: number;
  websocket: number;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

const getEnvironment = (): TestEnvironment => {
  const env = process.env.TEST_ENV || process.env.NODE_ENV || 'test';
  if (env === 'production' || env === 'staging') {
    return env as TestEnvironment;
  }
  return 'test';
};

const getApiBaseUrl = (environment: TestEnvironment): string => {
  switch (environment) {
    case 'production':
      return process.env.PRODUCTION_API_URL || 'https://api.interview-ai.com';
    case 'staging':
      return process.env.STAGING_API_URL || 'https://staging-api.interview-ai.com';
    case 'test':
    default:
      return process.env.API_BASE_URL || 'http://localhost:3000';
  }
};

const getDatabaseUrl = (environment: TestEnvironment): string => {
  switch (environment) {
    case 'production':
      return process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL || '';
    case 'staging':
      return process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || '';
    case 'test':
    default:
      return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
  }
};

export const testConfig: TestConfig = {
  environment: getEnvironment(),
  apiBaseUrl: getApiBaseUrl(getEnvironment()),
  database: {
    url: getDatabaseUrl(getEnvironment()),
    poolMin: 2,
    poolMax: 10,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  timeout: {
    default: 30000,
    upload: 60000,
    ai: 120000,
    websocket: 180000,
  },
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
  },
  parallel: process.env.TEST_PARALLEL === 'true',
};

export default testConfig;
