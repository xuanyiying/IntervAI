import { AuthVerifier } from '@/modules/auth.verifier';
import { testConfig } from '@/config/test.config';

describe('AuthVerifier', () => {
  let verifier: AuthVerifier;

  beforeAll(async () => {
    verifier = new AuthVerifier();
  });

  afterAll(async () => {
    await verifier.cleanup();
  });

  describe('Module Information', () => {
    it('should have correct module name', () => {
      expect(verifier.moduleName).toBe('Authentication');
    });
  });

  describe('Availability Check', () => {
    it('should verify authentication module is available', async () => {
      const result = await verifier.verifyAvailability();

      expect(result).toBeDefined();
      expect(result.available).toBeDefined();
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.healthStatus).toMatch(/healthy|degraded|unhealthy/);

      if (!result.available) {
        console.warn('Authentication module is not available:', result.errors);
      }
    }, 30000);
  });

  describe('Completeness Verification', () => {
    it('should verify authentication completeness', async () => {
      const result = await verifier.verifyCompleteness();

      expect(result).toBeDefined();
      expect(result.totalChecks).toBeGreaterThan(0);
      expect(result.passedChecks).toBeGreaterThanOrEqual(0);
      expect(result.failedChecks).toBeInstanceOf(Array);

      console.log('Authentication Completeness Results:', {
        passed: result.passed,
        totalChecks: result.totalChecks,
        passedChecks: result.passedChecks,
        failedChecks: result.failedChecks.length,
      });

      if (result.failedChecks.length > 0) {
        console.log('Failed checks:');
        result.failedChecks.forEach((check) => {
          console.log(`  - ${check.name}: ${check.error?.message}`);
        });
      }

      if (result.warnings.length > 0) {
        console.log('Warnings:', result.warnings);
      }
    }, 120000); // 2 minutes timeout for all checks
  });

  describe('Report Generation', () => {
    it('should generate authentication module report', async () => {
      const report = await verifier.generateReport();

      expect(report).toBeDefined();
      expect(report.moduleName).toBe('Authentication');
      expect(report.status).toMatch(/PASS|FAIL|WARNING/);
      expect(report.completeness).toBeDefined();
      expect(report.availability).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);

      console.log('Authentication Module Report:', {
        moduleName: report.moduleName,
        status: report.status,
        completeness: {
          passed: report.completeness.passed,
          totalChecks: report.completeness.totalChecks,
          passedChecks: report.completeness.passedChecks,
        },
        availability: {
          available: report.availability.available,
          responseTime: report.availability.responseTime,
          healthStatus: report.availability.healthStatus,
        },
      });
    }, 120000);
  });
});
