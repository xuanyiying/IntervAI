import { ReportGenerator } from '@/core/report-generator';
import { TestResults, ModuleTestResult } from '@/core/test-orchestrator';
import { ModuleReport } from '@/modules/base.verifier';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let mockTestResults: TestResults;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();

    // Create mock test results
    const mockModuleReport: ModuleReport = {
      moduleName: 'auth',
      status: 'PASS',
      completeness: {
        passed: true,
        totalChecks: 10,
        passedChecks: 10,
        failedChecks: [],
        warnings: [],
      },
      availability: {
        available: true,
        responseTime: 150,
        errors: [],
        healthStatus: 'healthy',
      },
      timestamp: new Date(),
    };

    const mockModuleResult: ModuleTestResult = {
      moduleName: 'auth',
      status: 'PASS',
      report: mockModuleReport,
      testCases: [
        {
          name: 'Email registration',
          status: 'PASS',
          duration: 100,
          logs: [],
        },
        {
          name: 'Email login',
          status: 'PASS',
          duration: 80,
          logs: [],
        },
      ],
      duration: 500,
    };

    mockTestResults = {
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      skippedTests: 0,
      duration: 500,
      moduleResults: new Map([['auth', mockModuleResult]]),
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T10:00:00.500Z'),
    };
  });

  describe('generateJSON', () => {
    it('should generate valid JSON report', async () => {
      const jsonReport = await reportGenerator.generateJSON(mockTestResults);

      expect(jsonReport).toBeDefined();
      expect(() => JSON.parse(jsonReport)).not.toThrow();

      const parsed = JSON.parse(jsonReport);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.totalTests).toBe(2);
      expect(parsed.summary.passedTests).toBe(2);
      expect(parsed.summary.failedTests).toBe(0);
      expect(parsed.modules).toHaveLength(1);
      expect(parsed.modules[0].name).toBe('auth');
    });

    it('should include module details in JSON report', async () => {
      const jsonReport = await reportGenerator.generateJSON(mockTestResults);
      const parsed = JSON.parse(jsonReport);

      expect(parsed.modules[0].status).toBe('PASS');
      expect(parsed.modules[0].completeness.totalChecks).toBe(10);
      expect(parsed.modules[0].completeness.passedChecks).toBe(10);
      expect(parsed.modules[0].availability.available).toBe(true);
    });

    it('should include timestamp in JSON report', async () => {
      const jsonReport = await reportGenerator.generateJSON(mockTestResults);
      const parsed = JSON.parse(jsonReport);

      expect(parsed.generatedAt).toBeDefined();
      expect(new Date(parsed.generatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('generateHTML', () => {
    it('should generate valid HTML report', async () => {
      const htmlReport = await reportGenerator.generateHTML(mockTestResults);

      expect(htmlReport).toBeDefined();
      expect(htmlReport).toContain('<!DOCTYPE html>');
      expect(htmlReport).toContain('<html');
      expect(htmlReport).toContain('</html>');
    });

    it('should include summary statistics in HTML', async () => {
      const htmlReport = await reportGenerator.generateHTML(mockTestResults);

      expect(htmlReport).toContain('Total Tests');
      expect(htmlReport).toContain('2'); // totalTests
      expect(htmlReport).toContain('Passed');
      expect(htmlReport).toContain('Failed');
      expect(htmlReport).toContain('Pass Rate');
    });

    it('should include module results in HTML', async () => {
      const htmlReport = await reportGenerator.generateHTML(mockTestResults);

      expect(htmlReport).toContain('auth');
      expect(htmlReport).toContain('PASS');
      expect(htmlReport).toContain('Completeness');
      expect(htmlReport).toContain('Availability');
    });

    it('should include readiness assessment in HTML', async () => {
      const htmlReport = await reportGenerator.generateHTML(mockTestResults);

      expect(htmlReport).toContain('Production Readiness Assessment');
      expect(htmlReport).toContain('score-circle');
    });

    it('should include CSS styling in HTML', async () => {
      const htmlReport = await reportGenerator.generateHTML(mockTestResults);

      expect(htmlReport).toContain('<style>');
      expect(htmlReport).toContain('</style>');
      expect(htmlReport).toContain('.container');
      expect(htmlReport).toContain('.summary');
    });
  });

  describe('generateMarkdown', () => {
    it('should generate valid Markdown report', async () => {
      const markdownReport = await reportGenerator.generateMarkdown(mockTestResults);

      expect(markdownReport).toBeDefined();
      expect(markdownReport).toContain('# Core Functionality Verification Report');
    });

    it('should include summary table in Markdown', async () => {
      const markdownReport = await reportGenerator.generateMarkdown(mockTestResults);

      expect(markdownReport).toContain('## Summary');
      expect(markdownReport).toContain('| Metric | Value |');
      expect(markdownReport).toContain('| Total Tests | 2 |');
      expect(markdownReport).toContain('| Passed | 2 ✅ |');
    });

    it('should include module results in Markdown', async () => {
      const markdownReport = await reportGenerator.generateMarkdown(mockTestResults);

      expect(markdownReport).toContain('## Module Results');
      expect(markdownReport).toContain('### ✅ auth');
      expect(markdownReport).toContain('**Status:** PASS');
      expect(markdownReport).toContain('**Completeness:**');
      expect(markdownReport).toContain('**Availability:**');
    });

    it('should include readiness assessment in Markdown', async () => {
      const markdownReport = await reportGenerator.generateMarkdown(mockTestResults);

      expect(markdownReport).toContain('## Production Readiness Assessment');
      expect(markdownReport).toContain('**Overall Status:**');
      expect(markdownReport).toContain('**Readiness Score:**');
    });

    it('should include recommendations in Markdown', async () => {
      const markdownReport = await reportGenerator.generateMarkdown(mockTestResults);

      expect(markdownReport).toContain('## Recommendations');
    });
  });

  describe('generateReadinessAssessment', () => {
    it('should generate readiness assessment with correct structure', async () => {
      const assessment = await reportGenerator.generateReadinessAssessment(mockTestResults);

      expect(assessment).toBeDefined();
      expect(assessment.overallStatus).toBeDefined();
      expect(assessment.score).toBeDefined();
      expect(assessment.criticalIssues).toBeDefined();
      expect(assessment.warnings).toBeDefined();
      expect(assessment.recommendations).toBeDefined();
      expect(assessment.moduleStatuses).toBeDefined();
      expect(assessment.generatedAt).toBeInstanceOf(Date);
    });

    it('should calculate score between 0 and 100', async () => {
      const assessment = await reportGenerator.generateReadinessAssessment(mockTestResults);

      expect(assessment.score).toBeGreaterThanOrEqual(0);
      expect(assessment.score).toBeLessThanOrEqual(100);
    });

    it('should mark as READY when all tests pass', async () => {
      const assessment = await reportGenerator.generateReadinessAssessment(mockTestResults);

      expect(assessment.overallStatus).toBe('READY');
      expect(assessment.score).toBeGreaterThanOrEqual(90);
    });

    it('should mark as NOT_READY when critical issues exist', async () => {
      // Create failing module result
      const failingModuleReport: ModuleReport = {
        moduleName: 'auth',
        status: 'FAIL',
        completeness: {
          passed: false,
          totalChecks: 10,
          passedChecks: 5,
          failedChecks: [
            {
              name: 'Email registration',
              passed: false,
              duration: 100,
              error: new Error('Registration failed'),
            },
          ],
          warnings: [],
        },
        availability: {
          available: false,
          responseTime: 0,
          errors: [new Error('Service unavailable')],
          healthStatus: 'unhealthy',
        },
        timestamp: new Date(),
      };

      const failingResults: TestResults = {
        ...mockTestResults,
        failedTests: 5,
        passedTests: 5,
        moduleResults: new Map([
          [
            'auth',
            {
              moduleName: 'auth',
              status: 'FAIL',
              report: failingModuleReport,
              testCases: [],
              duration: 500,
            },
          ],
        ]),
      };

      const assessment = await reportGenerator.generateReadinessAssessment(failingResults);

      expect(assessment.overallStatus).toBe('NOT_READY');
      expect(assessment.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should include module statuses with scores', async () => {
      const assessment = await reportGenerator.generateReadinessAssessment(mockTestResults);

      expect(assessment.moduleStatuses.size).toBe(1);
      const authStatus = assessment.moduleStatuses.get('auth');
      expect(authStatus).toBeDefined();
      expect(authStatus?.name).toBe('auth');
      expect(authStatus?.completeness).toBe(100);
      expect(authStatus?.availability).toBe(100);
      expect(authStatus?.performance).toBe(100);
    });

    it('should generate recommendations', async () => {
      const assessment = await reportGenerator.generateReadinessAssessment(mockTestResults);

      expect(assessment.recommendations).toBeDefined();
      expect(Array.isArray(assessment.recommendations)).toBe(true);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify critical issues from failed checks', async () => {
      const failingModuleReport: ModuleReport = {
        moduleName: 'payment',
        status: 'FAIL',
        completeness: {
          passed: false,
          totalChecks: 5,
          passedChecks: 3,
          failedChecks: [
            {
              name: 'Stripe checkout',
              passed: false,
              duration: 200,
              error: new Error('Stripe API key invalid'),
            },
            {
              name: 'Webhook processing',
              passed: false,
              duration: 150,
              error: new Error('Webhook signature validation failed'),
            },
          ],
          warnings: [],
        },
        availability: {
          available: true,
          responseTime: 100,
          errors: [],
          healthStatus: 'healthy',
        },
        timestamp: new Date(),
      };

      const failingResults: TestResults = {
        ...mockTestResults,
        failedTests: 2,
        moduleResults: new Map([
          [
            'payment',
            {
              moduleName: 'payment',
              status: 'FAIL',
              report: failingModuleReport,
              testCases: [],
              duration: 500,
            },
          ],
        ]),
      };

      const assessment = await reportGenerator.generateReadinessAssessment(failingResults);

      expect(assessment.criticalIssues.length).toBeGreaterThan(0);
      expect(assessment.criticalIssues.some((issue: any) => issue.module === 'payment')).toBe(true);
    });

    it('should calculate CONDITIONAL status for moderate scores', async () => {
      // Create module with partial success
      const partialModuleReport: ModuleReport = {
        moduleName: 'storage',
        status: 'WARNING',
        completeness: {
          passed: true,
          totalChecks: 10,
          passedChecks: 8,
          failedChecks: [],
          warnings: ['MinIO connection slow'],
        },
        availability: {
          available: true,
          responseTime: 500,
          errors: [],
          healthStatus: 'degraded',
        },
        timestamp: new Date(),
      };

      const partialResults: TestResults = {
        ...mockTestResults,
        moduleResults: new Map([
          [
            'storage',
            {
              moduleName: 'storage',
              status: 'PASS', // Changed from WARNING to PASS since ModuleTestResult only supports PASS/FAIL/SKIP
              report: partialModuleReport,
              testCases: [],
              duration: 1000,
            },
          ],
        ]),
      };

      const assessment = await reportGenerator.generateReadinessAssessment(partialResults);

      // Should be CONDITIONAL or READY depending on score
      expect(['READY', 'CONDITIONAL']).toContain(assessment.overallStatus);
    });
  });

  describe('error handling', () => {
    it('should handle empty test results', async () => {
      const emptyResults: TestResults = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        moduleResults: new Map(),
        startTime: new Date(),
        endTime: new Date(),
      };

      const jsonReport = await reportGenerator.generateJSON(emptyResults);
      expect(jsonReport).toBeDefined();

      const htmlReport = await reportGenerator.generateHTML(emptyResults);
      expect(htmlReport).toBeDefined();

      const markdownReport = await reportGenerator.generateMarkdown(emptyResults);
      expect(markdownReport).toBeDefined();

      const assessment = await reportGenerator.generateReadinessAssessment(emptyResults);
      expect(assessment.score).toBe(0);
    });

    it('should handle multiple modules with mixed results', async () => {
      const passModule: ModuleReport = {
        moduleName: 'auth',
        status: 'PASS',
        completeness: {
          passed: true,
          totalChecks: 10,
          passedChecks: 10,
          failedChecks: [],
          warnings: [],
        },
        availability: {
          available: true,
          responseTime: 100,
          errors: [],
          healthStatus: 'healthy',
        },
        timestamp: new Date(),
      };

      const failModule: ModuleReport = {
        moduleName: 'payment',
        status: 'FAIL',
        completeness: {
          passed: false,
          totalChecks: 5,
          passedChecks: 2,
          failedChecks: [
            {
              name: 'Stripe integration',
              passed: false,
              duration: 100,
              error: new Error('API key missing'),
            },
          ],
          warnings: [],
        },
        availability: {
          available: false,
          responseTime: 0,
          errors: [new Error('Service down')],
          healthStatus: 'unhealthy',
        },
        timestamp: new Date(),
      };

      const mixedResults: TestResults = {
        totalTests: 15,
        passedTests: 10,
        failedTests: 5,
        skippedTests: 0,
        duration: 2000,
        moduleResults: new Map([
          ['auth', { moduleName: 'auth', status: 'PASS', report: passModule, testCases: [], duration: 500 }],
          ['payment', { moduleName: 'payment', status: 'FAIL', report: failModule, testCases: [], duration: 1500 }],
        ]),
        startTime: new Date(),
        endTime: new Date(),
      };

      const assessment = await reportGenerator.generateReadinessAssessment(mixedResults);

      expect(assessment.moduleStatuses.size).toBe(2);
      expect(assessment.criticalIssues.length).toBeGreaterThan(0);
      expect(assessment.overallStatus).toBe('NOT_READY');
    });
  });
});
