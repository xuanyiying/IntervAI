import { createLogger, Logger } from '@/helpers/logger.helper';
import { BaseVerifier, ModuleReport } from '@/modules/base.verifier';
import { testConfig } from '@/config/test.config';

export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
}

export interface TestConfig {
  environment: 'test' | 'staging' | 'production';
  modules: string[];
  testTypes: TestType[];
  parallel: boolean;
  timeout: number;
  retries: number;
}

export interface TestCaseResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: Error;
  logs: string[];
  attempts?: number;
}

export interface ModuleTestResult {
  moduleName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  report: ModuleReport;
  testCases: TestCaseResult[];
  duration: number;
}

export interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  moduleResults: Map<string, ModuleTestResult>;
  startTime: Date;
  endTime?: Date;
}

export class TestOrchestrator {
  private logger: Logger;
  private config: TestConfig;
  private verifiers: Map<string, BaseVerifier>;
  private initialized: boolean;

  constructor(config?: Partial<TestConfig>) {
    this.logger = createLogger('TestOrchestrator');
    this.verifiers = new Map();
    this.initialized = false;

    // Merge provided config with defaults from testConfig
    this.config = {
      environment: config?.environment || testConfig.environment,
      modules: config?.modules || [],
      testTypes: config?.testTypes || [TestType.UNIT, TestType.INTEGRATION],
      parallel: config?.parallel !== undefined ? config.parallel : testConfig.parallel,
      timeout: config?.timeout || testConfig.timeout.default,
      retries: config?.retries || testConfig.retry.maxAttempts,
    };
  }

  /**
   * Initialize the test environment
   */
  async initialize(config?: TestConfig): Promise<void> {
    if (this.initialized) {
      this.logger.warn('TestOrchestrator already initialized');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.logger.info('Initializing TestOrchestrator', {
      environment: this.config.environment,
      modules: this.config.modules,
      parallel: this.config.parallel,
    });

    try {
      // Validate configuration
      this.validateConfig();

      // Initialize verifiers for specified modules
      await this.initializeVerifiers();

      this.initialized = true;
      this.logger.info('TestOrchestrator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TestOrchestrator', error);
      throw error;
    }
  }

  /**
   * Register a verifier for a module
   */
  registerVerifier(moduleName: string, verifier: BaseVerifier): void {
    this.logger.debug(`Registering verifier for module: ${moduleName}`);
    this.verifiers.set(moduleName, verifier);
  }

  /**
   * Execute all tests for all registered modules
   */
  async runAll(): Promise<TestResults> {
    this.ensureInitialized();

    this.logger.info('Starting test execution for all modules');
    const startTime = new Date();
    const moduleResults = new Map<string, ModuleTestResult>();

    try {
      const modules = Array.from(this.verifiers.keys());

      if (this.config.parallel) {
        this.logger.info('Running tests in parallel mode');
        const results = await this.runModulesParallel(modules);
        results.forEach((result, moduleName) => {
          moduleResults.set(moduleName, result);
        });
      } else {
        this.logger.info('Running tests in sequential mode');
        for (const moduleName of modules) {
          const result = await this.runModule(moduleName);
          moduleResults.set(moduleName, result);
        }
      }

      const endTime = new Date();
      const testResults = this.aggregateResults(moduleResults, startTime, endTime);

      this.logger.info('Test execution completed', {
        total: testResults.totalTests,
        passed: testResults.passedTests,
        failed: testResults.failedTests,
        duration: testResults.duration,
      });

      return testResults;
    } catch (error) {
      this.logger.error('Test execution failed', error);
      throw error;
    }
  }

  /**
   * Execute tests for a specific module
   */
  async runModule(moduleName: string): Promise<ModuleTestResult> {
    this.ensureInitialized();

    const verifier = this.verifiers.get(moduleName);
    if (!verifier) {
      throw new Error(`No verifier registered for module: ${moduleName}`);
    }

    this.logger.info(`Running tests for module: ${moduleName}`);
    const startTime = Date.now();

    try {
      const report = await this.executeWithRetry(
        () => this.executeWithTimeout(
          () => verifier.generateReport(),
          this.config.timeout
        ),
        this.config.retries
      );

      const duration = Date.now() - startTime;

      const result: ModuleTestResult = {
        moduleName,
        status: report.status,
        report,
        testCases: this.convertReportToTestCases(report),
        duration,
      };

      this.logger.info(`Module ${moduleName} tests completed`, {
        status: result.status,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Module ${moduleName} tests failed`, error);

      return {
        moduleName,
        status: 'FAIL',
        report: {
          moduleName,
          status: 'FAIL',
          completeness: {
            passed: false,
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: [],
            warnings: [],
          },
          availability: {
            available: false,
            responseTime: 0,
            errors: [error as Error],
            healthStatus: 'unhealthy',
          },
          timestamp: new Date(),
        },
        testCases: [],
        duration,
      };
    }
  }

  /**
   * Clean up test environment and resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up TestOrchestrator');

    try {
      // Clear verifiers
      this.verifiers.clear();

      this.initialized = false;
      this.logger.info('TestOrchestrator cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup TestOrchestrator', error);
      throw error;
    }
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Execute a function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt}/${maxAttempts}`);
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed`, { error: lastError.message });

        if (attempt < maxAttempts) {
          const delay = testConfig.retry.delay * Math.pow(testConfig.retry.backoff, attempt - 1);
          this.logger.debug(`Retrying after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Run multiple modules in parallel
   */
  private async runModulesParallel(
    modules: string[]
  ): Promise<Map<string, ModuleTestResult>> {
    const results = new Map<string, ModuleTestResult>();

    const promises = modules.map(async (moduleName) => {
      const result = await this.runModule(moduleName);
      return { moduleName, result };
    });

    const settled = await Promise.allSettled(promises);

    settled.forEach((outcome, index) => {
      const moduleName = modules[index];
      if (outcome.status === 'fulfilled') {
        results.set(moduleName, outcome.value.result);
      } else {
        this.logger.error(`Module ${moduleName} execution failed`, outcome.reason);
        results.set(moduleName, {
          moduleName,
          status: 'FAIL',
          report: {
            moduleName,
            status: 'FAIL',
            completeness: {
              passed: false,
              totalChecks: 0,
              passedChecks: 0,
              failedChecks: [],
              warnings: [],
            },
            availability: {
              available: false,
              responseTime: 0,
              errors: [outcome.reason],
              healthStatus: 'unhealthy',
            },
            timestamp: new Date(),
          },
          testCases: [],
          duration: 0,
        });
      }
    });

    return results;
  }

  /**
   * Aggregate results from all modules
   */
  private aggregateResults(
    moduleResults: Map<string, ModuleTestResult>,
    startTime: Date,
    endTime: Date
  ): TestResults {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    moduleResults.forEach((result) => {
      result.testCases.forEach((testCase) => {
        totalTests++;
        if (testCase.status === 'PASS') passedTests++;
        else if (testCase.status === 'FAIL') failedTests++;
        else if (testCase.status === 'SKIP') skippedTests++;
      });
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration: endTime.getTime() - startTime.getTime(),
      moduleResults,
      startTime,
      endTime,
    };
  }

  /**
   * Convert module report to test cases
   */
  private convertReportToTestCases(report: ModuleReport): TestCaseResult[] {
    const testCases: TestCaseResult[] = [];

    // Add completeness checks as test cases
    report.completeness.failedChecks.forEach((check) => {
      testCases.push({
        name: check.name,
        status: 'FAIL',
        duration: check.duration,
        error: check.error,
        logs: [],
      });
    });

    // Add passed checks
    const passedCount = report.completeness.passedChecks;
    for (let i = 0; i < passedCount; i++) {
      testCases.push({
        name: `${report.moduleName} check ${i + 1}`,
        status: 'PASS',
        duration: 0,
        logs: [],
      });
    }

    return testCases;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.environment) {
      throw new Error('Environment must be specified');
    }

    if (this.config.timeout <= 0) {
      throw new Error('Timeout must be greater than 0');
    }

    if (this.config.retries < 0) {
      throw new Error('Retries must be non-negative');
    }
  }

  /**
   * Initialize verifiers for configured modules
   */
  private async initializeVerifiers(): Promise<void> {
    // This method can be extended to dynamically load verifiers
    // For now, verifiers should be registered manually using registerVerifier()
    this.logger.debug('Verifiers initialization completed');
  }

  /**
   * Ensure orchestrator is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('TestOrchestrator not initialized. Call initialize() first.');
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): TestConfig {
    return { ...this.config };
  }

  /**
   * Get registered verifiers
   */
  getVerifiers(): string[] {
    return Array.from(this.verifiers.keys());
  }
}
