import { TestOrchestrator, TestType, TestConfig } from '../core/test-orchestrator';
import { BaseVerifier, ModuleReport, CompletenessResult, AvailabilityResult } from '../modules/base.verifier';

// Mock verifier for testing
class MockVerifier extends BaseVerifier {
  readonly moduleName: string;
  private shouldFail: boolean;
  private delay: number;

  constructor(moduleName: string, shouldFail = false, delay = 0) {
    super();
    this.moduleName = moduleName;
    this.shouldFail = shouldFail;
    this.delay = delay;
  }

  async verifyCompleteness(): Promise<CompletenessResult> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      return {
        passed: false,
        totalChecks: 2,
        passedChecks: 1,
        failedChecks: [
          {
            name: 'Test check',
            passed: false,
            duration: 100,
            error: new Error('Mock failure'),
          },
        ],
        warnings: [],
      };
    }

    return {
      passed: true,
      totalChecks: 2,
      passedChecks: 2,
      failedChecks: [],
      warnings: [],
    };
  }

  async verifyAvailability(): Promise<AvailabilityResult> {
    if (this.shouldFail) {
      return {
        available: false,
        responseTime: 0,
        errors: [new Error('Service unavailable')],
        healthStatus: 'unhealthy',
      };
    }

    return {
      available: true,
      responseTime: 100,
      errors: [],
      healthStatus: 'healthy',
    };
  }
}

describe('TestOrchestrator', () => {
  let orchestrator: TestOrchestrator;

  beforeEach(() => {
    orchestrator = new TestOrchestrator({
      environment: 'test',
      modules: [],
      testTypes: [TestType.UNIT],
      parallel: false,
      timeout: 5000,
      retries: 2,
    });
  });

  afterEach(async () => {
    await orchestrator.cleanup();
  });

  describe('initialize', () => {
    it('should initialize successfully with default config', async () => {
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });

    it('should initialize with custom config', async () => {
      const customConfig: TestConfig = {
        environment: 'staging',
        modules: ['auth', 'resume'],
        testTypes: [TestType.INTEGRATION],
        parallel: true,
        timeout: 10000,
        retries: 3,
      };

      await orchestrator.initialize(customConfig);
      const config = orchestrator.getConfig();

      expect(config.environment).toBe('staging');
      expect(config.parallel).toBe(true);
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(3);
    });

    it('should not reinitialize if already initialized', async () => {
      await orchestrator.initialize();
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });

    it('should throw error for invalid timeout', async () => {
      const invalidConfig: TestConfig = {
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: false,
        timeout: -1,
        retries: 2,
      };

      await expect(orchestrator.initialize(invalidConfig)).rejects.toThrow(
        'Timeout must be greater than 0'
      );
    });

    it('should throw error for invalid retries', async () => {
      const invalidConfig: TestConfig = {
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: false,
        timeout: 5000,
        retries: -1,
      };

      await expect(orchestrator.initialize(invalidConfig)).rejects.toThrow(
        'Retries must be non-negative'
      );
    });
  });

  describe('registerVerifier', () => {
    it('should register a verifier successfully', async () => {
      await orchestrator.initialize();
      const verifier = new MockVerifier('test-module');

      orchestrator.registerVerifier('test-module', verifier);
      const verifiers = orchestrator.getVerifiers();

      expect(verifiers).toContain('test-module');
    });

    it('should register multiple verifiers', async () => {
      await orchestrator.initialize();
      const verifier1 = new MockVerifier('module1');
      const verifier2 = new MockVerifier('module2');

      orchestrator.registerVerifier('module1', verifier1);
      orchestrator.registerVerifier('module2', verifier2);

      const verifiers = orchestrator.getVerifiers();
      expect(verifiers).toHaveLength(2);
      expect(verifiers).toContain('module1');
      expect(verifiers).toContain('module2');
    });
  });

  describe('runModule', () => {
    it('should run a single module successfully', async () => {
      await orchestrator.initialize();
      const verifier = new MockVerifier('test-module');
      orchestrator.registerVerifier('test-module', verifier);

      const result = await orchestrator.runModule('test-module');

      expect(result.moduleName).toBe('test-module');
      expect(result.status).toBe('PASS');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle module failure', async () => {
      await orchestrator.initialize();
      const verifier = new MockVerifier('failing-module', true);
      orchestrator.registerVerifier('failing-module', verifier);

      const result = await orchestrator.runModule('failing-module');

      expect(result.moduleName).toBe('failing-module');
      expect(result.status).toBe('FAIL');
    });

    it('should throw error for unregistered module', async () => {
      await orchestrator.initialize();

      await expect(orchestrator.runModule('nonexistent')).rejects.toThrow(
        'No verifier registered for module: nonexistent'
      );
    });

    it('should throw error if not initialized', async () => {
      await expect(orchestrator.runModule('test-module')).rejects.toThrow(
        'TestOrchestrator not initialized'
      );
    });
  });

  describe('runAll', () => {
    it('should run all registered modules sequentially', async () => {
      await orchestrator.initialize();
      const verifier1 = new MockVerifier('module1');
      const verifier2 = new MockVerifier('module2');

      orchestrator.registerVerifier('module1', verifier1);
      orchestrator.registerVerifier('module2', verifier2);

      const results = await orchestrator.runAll();

      expect(results.moduleResults.size).toBe(2);
      expect(results.moduleResults.has('module1')).toBe(true);
      expect(results.moduleResults.has('module2')).toBe(true);
      expect(results.totalTests).toBeGreaterThan(0);
      expect(results.passedTests).toBeGreaterThan(0);
    });

    it('should run all registered modules in parallel', async () => {
      orchestrator = new TestOrchestrator({
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: true,
        timeout: 5000,
        retries: 1,
      });

      await orchestrator.initialize();
      const verifier1 = new MockVerifier('module1', false, 100);
      const verifier2 = new MockVerifier('module2', false, 100);

      orchestrator.registerVerifier('module1', verifier1);
      orchestrator.registerVerifier('module2', verifier2);

      const startTime = Date.now();
      const results = await orchestrator.runAll();
      const duration = Date.now() - startTime;

      expect(results.moduleResults.size).toBe(2);
      // Parallel execution should be faster than sequential (200ms)
      expect(duration).toBeLessThan(200);
    });

    it('should aggregate results correctly', async () => {
      await orchestrator.initialize();
      const verifier1 = new MockVerifier('passing-module');
      const verifier2 = new MockVerifier('failing-module', true);

      orchestrator.registerVerifier('passing-module', verifier1);
      orchestrator.registerVerifier('failing-module', verifier2);

      const results = await orchestrator.runAll();

      expect(results.totalTests).toBeGreaterThan(0);
      expect(results.passedTests).toBeGreaterThan(0);
      expect(results.failedTests).toBeGreaterThan(0);
      expect(results.duration).toBeGreaterThan(0);
      expect(results.startTime).toBeInstanceOf(Date);
      expect(results.endTime).toBeInstanceOf(Date);
    });

    it('should handle empty verifier list', async () => {
      await orchestrator.initialize();

      const results = await orchestrator.runAll();

      expect(results.moduleResults.size).toBe(0);
      expect(results.totalTests).toBe(0);
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running tests', async () => {
      orchestrator = new TestOrchestrator({
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: false,
        timeout: 100, // Very short timeout
        retries: 1,
      });

      await orchestrator.initialize();
      const slowVerifier = new MockVerifier('slow-module', false, 500);
      orchestrator.registerVerifier('slow-module', slowVerifier);

      const result = await orchestrator.runModule('slow-module');

      expect(result.status).toBe('FAIL');
      expect(result.report.availability.errors.length).toBeGreaterThan(0);
    });
  });

  describe('retry logic', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;

      class FlakeyVerifier extends MockVerifier {
        async verifyCompleteness(): Promise<CompletenessResult> {
          attemptCount++;
          if (attemptCount < 2) {
            throw new Error('Temporary failure');
          }
          return super.verifyCompleteness();
        }
      }

      orchestrator = new TestOrchestrator({
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: false,
        timeout: 5000,
        retries: 3,
      });

      await orchestrator.initialize();
      const verifier = new FlakeyVerifier('flakey-module');
      orchestrator.registerVerifier('flakey-module', verifier);

      const result = await orchestrator.runModule('flakey-module');

      expect(attemptCount).toBeGreaterThan(1);
      expect(result.status).toBe('PASS');
    });

    it('should fail after max retries', async () => {
      class AlwaysFailingVerifier extends MockVerifier {
        async verifyCompleteness(): Promise<CompletenessResult> {
          throw new Error('Permanent failure');
        }
      }

      orchestrator = new TestOrchestrator({
        environment: 'test',
        modules: [],
        testTypes: [TestType.UNIT],
        parallel: false,
        timeout: 5000,
        retries: 2,
      });

      await orchestrator.initialize();
      const verifier = new AlwaysFailingVerifier('always-failing');
      orchestrator.registerVerifier('always-failing', verifier);

      const result = await orchestrator.runModule('always-failing');

      expect(result.status).toBe('FAIL');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources successfully', async () => {
      await orchestrator.initialize();
      const verifier = new MockVerifier('test-module');
      orchestrator.registerVerifier('test-module', verifier);

      await orchestrator.cleanup();

      const verifiers = orchestrator.getVerifiers();
      expect(verifiers).toHaveLength(0);
    });

    it('should allow reinitialization after cleanup', async () => {
      await orchestrator.initialize();
      await orchestrator.cleanup();
      await expect(orchestrator.initialize()).resolves.not.toThrow();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', async () => {
      await orchestrator.initialize();
      const config = orchestrator.getConfig();

      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('modules');
      expect(config).toHaveProperty('testTypes');
      expect(config).toHaveProperty('parallel');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('retries');
    });
  });

  describe('getVerifiers', () => {
    it('should return list of registered verifiers', async () => {
      await orchestrator.initialize();
      const verifier1 = new MockVerifier('module1');
      const verifier2 = new MockVerifier('module2');

      orchestrator.registerVerifier('module1', verifier1);
      orchestrator.registerVerifier('module2', verifier2);

      const verifiers = orchestrator.getVerifiers();

      expect(verifiers).toEqual(expect.arrayContaining(['module1', 'module2']));
    });

    it('should return empty array when no verifiers registered', async () => {
      await orchestrator.initialize();
      const verifiers = orchestrator.getVerifiers();

      expect(verifiers).toEqual([]);
    });
  });
});
