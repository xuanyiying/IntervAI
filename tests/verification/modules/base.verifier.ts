import { createLogger, Logger } from '@/helpers/logger.helper';

export interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
  details?: any;
}

export interface CompletenessResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: CheckResult[];
  warnings: string[];
}

export interface AvailabilityResult {
  available: boolean;
  responseTime: number;
  errors: Error[];
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface PerformanceResult {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  errorRate: number;
}

export interface ModuleReport {
  moduleName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  completeness: CompletenessResult;
  availability: AvailabilityResult;
  performance?: PerformanceResult;
  timestamp: Date;
}

export abstract class BaseVerifier {
  protected logger: Logger;
  abstract readonly moduleName: string;

  constructor() {
    this.logger = createLogger(this.constructor.name);
  }

  abstract verifyCompleteness(): Promise<CompletenessResult>;
  abstract verifyAvailability(): Promise<AvailabilityResult>;

  async performanceTest(): Promise<PerformanceResult> {
    // Default implementation - can be overridden
    return {
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      errorRate: 0,
    };
  }

  async generateReport(): Promise<ModuleReport> {
    this.logger.info(`Generating report for ${this.moduleName}`);

    const completeness = await this.verifyCompleteness();
    const availability = await this.verifyAvailability();

    const status = this.determineStatus(completeness, availability);

    return {
      moduleName: this.moduleName,
      status,
      completeness,
      availability,
      timestamp: new Date(),
    };
  }

  protected async executeCheck(
    name: string,
    checkFn: () => Promise<void>
  ): Promise<CheckResult> {
    const startTime = Date.now();
    try {
      await checkFn();
      const duration = Date.now() - startTime;
      this.logger.debug(`Check passed: ${name}`, { duration });
      return {
        name,
        passed: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Check failed: ${name}`, error);
      return {
        name,
        passed: false,
        duration,
        error: error as Error,
      };
    }
  }

  protected aggregateResults(checks: Promise<CheckResult>[]): Promise<CompletenessResult> {
    return Promise.all(checks).then((results) => {
      const passedChecks = results.filter((r) => r.passed).length;
      const failedChecks = results.filter((r) => !r.passed);

      return {
        passed: failedChecks.length === 0,
        totalChecks: results.length,
        passedChecks,
        failedChecks,
        warnings: [],
      };
    });
  }

  private determineStatus(
    completeness: CompletenessResult,
    availability: AvailabilityResult
  ): 'PASS' | 'FAIL' | 'WARNING' {
    if (!availability.available) {
      return 'FAIL';
    }

    if (!completeness.passed) {
      return 'FAIL';
    }

    if (completeness.warnings.length > 0 || availability.healthStatus === 'degraded') {
      return 'WARNING';
    }

    return 'PASS';
  }
}
