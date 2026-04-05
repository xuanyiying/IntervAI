import { testConfig, TestEnvironment } from '@/config/test.config';
import { db } from '@/helpers/database.helper';
import { api } from '@/helpers/api.helper';
import { createLogger } from '@/helpers/logger.helper';

const logger = createLogger('TestEnvironment');

export class TestEnvironmentManager {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.info(`Initializing test environment: ${testConfig.environment}`);

    try {
      // Verify database connection
      const dbHealthy = await db.healthCheck();
      if (!dbHealthy) {
        throw new Error('Database is not accessible');
      }
      logger.info('Database connection verified');

      // Verify API service
      const apiHealthy = await api.waitForService(5, 2000);
      if (!apiHealthy) {
        logger.warn('API service is not accessible - some tests may fail');
      } else {
        logger.info('API service verified');
      }

      // Prepare test database
      if (testConfig.environment === 'test') {
        await this.prepareTestDatabase();
      }

      this.initialized = true;
      logger.info('Test environment initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize test environment', error);
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    logger.info('Cleaning up test environment');

    try {
      if (testConfig.environment === 'test') {
        await db.clearTestData();
      }
      await db.cleanup();
      logger.info('Test environment cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup test environment', error);
      throw error;
    }
  }

  private static async prepareTestDatabase(): Promise<void> {
    logger.info('Preparing test database');

    try {
      // Clear existing test data
      await db.clearTestData();
      logger.info('Test database prepared');
    } catch (error) {
      logger.error('Failed to prepare test database', error);
      throw error;
    }
  }

  static getEnvironment(): TestEnvironment {
    return testConfig.environment;
  }

  static isTestEnvironment(): boolean {
    return testConfig.environment === 'test';
  }

  static isStagingEnvironment(): boolean {
    return testConfig.environment === 'staging';
  }

  static isProductionEnvironment(): boolean {
    return testConfig.environment === 'production';
  }
}

export const testEnv = TestEnvironmentManager;
