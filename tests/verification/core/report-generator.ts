import { createLogger, Logger } from '@/helpers/logger.helper';
import { TestResults, ModuleTestResult } from './test-orchestrator';
import { ModuleReport } from '@/modules/base.verifier';

export interface Issue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  module: string;
  message: string;
  details?: any;
}

export interface ModuleStatus {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
  completeness: number; // 0-100
  availability: number; // 0-100
  performance: number; // 0-100
  issues: Issue[];
}

export interface ReadinessReport {
  overallStatus: 'READY' | 'NOT_READY' | 'CONDITIONAL';
  score: number; // 0-100
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
  moduleStatuses: Map<string, ModuleStatus>;
  generatedAt: Date;
}

export class ReportGenerator {
  private logger: Logger;

  constructor() {
    this.logger = createLogger('ReportGenerator');
  }

  /**
   * Generate JSON report
   */
  async generateJSON(results: TestResults): Promise<string> {
    this.logger.info('Generating JSON report');

    try {
      const report = {
        summary: {
          totalTests: results.totalTests,
          passedTests: results.passedTests,
          failedTests: results.failedTests,
          skippedTests: results.skippedTests,
          duration: results.duration,
          startTime: results.startTime,
          endTime: results.endTime,
        },
        modules: Array.from(results.moduleResults.entries()).map(([name, result]) => ({
          name,
          status: result.status,
          duration: result.duration,
          completeness: result.report.completeness,
          availability: result.report.availability,
          performance: result.report.performance,
          testCases: result.testCases,
        })),
        generatedAt: new Date(),
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      this.logger.error('Failed to generate JSON report', error);
      throw error;
    }
  }

  /**
   * Generate HTML report with charts
   */
  async generateHTML(results: TestResults): Promise<string> {
    this.logger.info('Generating HTML report');

    try {
      const readinessReport = await this.generateReadinessAssessment(results);
      const passRate = results.totalTests > 0 
        ? ((results.passedTests / results.totalTests) * 100).toFixed(1)
        : '0.0';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Report - Interview AI</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .meta {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .summary-card.pass { border-left-color: #10b981; }
    .summary-card.fail { border-left-color: #ef4444; }
    .summary-card.skip { border-left-color: #f59e0b; }
    .summary-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #111827;
    }
    .readiness {
      padding: 30px;
      border-bottom: 1px solid #e5e7eb;
    }
    .readiness-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .readiness-score {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    .score-circle.ready { background: #10b981; }
    .score-circle.conditional { background: #f59e0b; }
    .score-circle.not-ready { background: #ef4444; }
    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
    }
    .status-badge.ready { background: #d1fae5; color: #065f46; }
    .status-badge.conditional { background: #fef3c7; color: #92400e; }
    .status-badge.not-ready { background: #fee2e2; color: #991b1b; }
    .modules {
      padding: 30px;
    }
    .module-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
    }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .module-name {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .module-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .module-status.pass { background: #d1fae5; color: #065f46; }
    .module-status.fail { background: #fee2e2; color: #991b1b; }
    .module-status.warning { background: #fef3c7; color: #92400e; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .metric {
      background: white;
      padding: 12px;
      border-radius: 6px;
    }
    .metric-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #111827;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: #667eea;
      transition: width 0.3s ease;
    }
    .progress-fill.high { background: #10b981; }
    .progress-fill.medium { background: #f59e0b; }
    .progress-fill.low { background: #ef4444; }
    .issues {
      padding: 30px;
      background: #f9fafb;
    }
    .issue-card {
      background: white;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .issue-card.critical { border-left-color: #dc2626; }
    .issue-card.high { border-left-color: #ef4444; }
    .issue-card.medium { border-left-color: #f59e0b; }
    .issue-card.low { border-left-color: #3b82f6; }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .issue-severity {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .issue-severity.critical { background: #fee2e2; color: #991b1b; }
    .issue-severity.high { background: #fef3c7; color: #92400e; }
    .issue-severity.medium { background: #dbeafe; color: #1e40af; }
    .issue-severity.low { background: #e5e7eb; color: #374151; }
    .recommendations {
      padding: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .recommendation {
      padding: 12px 16px;
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Core Functionality Verification Report</h1>
      <div class="meta">
        <div>Generated: ${new Date().toLocaleString()}</div>
        <div>Duration: ${(results.duration / 1000).toFixed(2)}s</div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="label">Total Tests</div>
        <div class="value">${results.totalTests}</div>
      </div>
      <div class="summary-card pass">
        <div class="label">Passed</div>
        <div class="value">${results.passedTests}</div>
      </div>
      <div class="summary-card fail">
        <div class="label">Failed</div>
        <div class="value">${results.failedTests}</div>
      </div>
      <div class="summary-card skip">
        <div class="label">Skipped</div>
        <div class="value">${results.skippedTests}</div>
      </div>
      <div class="summary-card">
        <div class="label">Pass Rate</div>
        <div class="value">${passRate}%</div>
      </div>
    </div>

    <div class="readiness">
      <div class="readiness-header">
        <h2>Production Readiness Assessment</h2>
        <div class="readiness-score">
          <div class="score-circle ${readinessReport.overallStatus.toLowerCase().replace('_', '-')}">
            ${readinessReport.score}
          </div>
          <span class="status-badge ${readinessReport.overallStatus.toLowerCase().replace('_', '-')}">
            ${readinessReport.overallStatus.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>

    <div class="modules">
      <h2 style="margin-bottom: 20px;">Module Results</h2>
      ${this.generateModuleCardsHTML(results.moduleResults)}
    </div>

    ${readinessReport.criticalIssues.length > 0 ? `
    <div class="issues">
      <h2 style="margin-bottom: 20px;">Critical Issues</h2>
      ${readinessReport.criticalIssues.map(issue => `
        <div class="issue-card ${issue.severity.toLowerCase()}">
          <div class="issue-header">
            <strong>${issue.module}</strong>
            <span class="issue-severity ${issue.severity.toLowerCase()}">${issue.severity}</span>
          </div>
          <div>${issue.message}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${readinessReport.recommendations.length > 0 ? `
    <div class="recommendations">
      <h2 style="margin-bottom: 20px;">Recommendations</h2>
      ${readinessReport.recommendations.map(rec => `
        <div class="recommendation">💡 ${rec}</div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      Interview AI Verification System v1.0.0
    </div>
  </div>
</body>
</html>`;

      return html;
    } catch (error) {
      this.logger.error('Failed to generate HTML report', error);
      throw error;
    }
  }

  /**
   * Generate module cards HTML
   */
  private generateModuleCardsHTML(moduleResults: Map<string, ModuleTestResult>): string {
    return Array.from(moduleResults.entries())
      .map(([name, result]) => {
        const completenessPercent = result.report.completeness.totalChecks > 0
          ? (result.report.completeness.passedChecks / result.report.completeness.totalChecks * 100).toFixed(0)
          : '0';
        
        const availabilityPercent = result.report.availability.available ? '100' : '0';
        
        return `
        <div class="module-card">
          <div class="module-header">
            <div class="module-name">${name}</div>
            <span class="module-status ${result.status.toLowerCase()}">${result.status}</span>
          </div>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Completeness</div>
              <div class="metric-value">${completenessPercent}%</div>
              <div class="progress-bar">
                <div class="progress-fill ${this.getProgressClass(Number(completenessPercent))}" 
                     style="width: ${completenessPercent}%"></div>
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Availability</div>
              <div class="metric-value">${availabilityPercent}%</div>
              <div class="progress-bar">
                <div class="progress-fill ${this.getProgressClass(Number(availabilityPercent))}" 
                     style="width: ${availabilityPercent}%"></div>
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Duration</div>
              <div class="metric-value">${(result.duration / 1000).toFixed(2)}s</div>
            </div>
          </div>
        </div>
        `;
      })
      .join('');
  }

  /**
   * Get progress bar class based on percentage
   */
  private getProgressClass(percent: number): string {
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'medium';
    return 'low';
  }

  /**
   * Generate Markdown report
   */
  async generateMarkdown(results: TestResults): Promise<string> {
    this.logger.info('Generating Markdown report');

    try {
      const readinessReport = await this.generateReadinessAssessment(results);
      const passRate = results.totalTests > 0 
        ? ((results.passedTests / results.totalTests) * 100).toFixed(1)
        : '0.0';

      let markdown = `# Core Functionality Verification Report

**Generated:** ${new Date().toLocaleString()}  
**Duration:** ${(results.duration / 1000).toFixed(2)}s

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.totalTests} |
| Passed | ${results.passedTests} ✅ |
| Failed | ${results.failedTests} ❌ |
| Skipped | ${results.skippedTests} ⏭️ |
| Pass Rate | ${passRate}% |

## Production Readiness Assessment

**Overall Status:** ${this.getStatusEmoji(readinessReport.overallStatus)} **${readinessReport.overallStatus}**  
**Readiness Score:** ${readinessReport.score}/100

`;

      // Add module results
      markdown += `## Module Results\n\n`;
      
      for (const [name, result] of results.moduleResults.entries()) {
        const statusEmoji = this.getStatusEmoji(result.status);
        const completenessPercent = result.report.completeness.totalChecks > 0
          ? (result.report.completeness.passedChecks / result.report.completeness.totalChecks * 100).toFixed(0)
          : '0';
        
        markdown += `### ${statusEmoji} ${name}\n\n`;
        markdown += `- **Status:** ${result.status}\n`;
        markdown += `- **Completeness:** ${completenessPercent}% (${result.report.completeness.passedChecks}/${result.report.completeness.totalChecks} checks passed)\n`;
        markdown += `- **Availability:** ${result.report.availability.available ? '✅ Available' : '❌ Unavailable'}\n`;
        markdown += `- **Health:** ${result.report.availability.healthStatus}\n`;
        markdown += `- **Duration:** ${(result.duration / 1000).toFixed(2)}s\n`;
        
        if (result.report.completeness.failedChecks.length > 0) {
          markdown += `\n**Failed Checks:**\n`;
          result.report.completeness.failedChecks.forEach(check => {
            markdown += `- ❌ ${check.name}: ${check.error?.message || 'Unknown error'}\n`;
          });
        }
        
        markdown += `\n`;
      }

      // Add critical issues
      if (readinessReport.criticalIssues.length > 0) {
        markdown += `## Critical Issues\n\n`;
        readinessReport.criticalIssues.forEach(issue => {
          markdown += `### 🚨 ${issue.severity} - ${issue.module}\n\n`;
          markdown += `${issue.message}\n\n`;
        });
      }

      // Add warnings
      if (readinessReport.warnings.length > 0) {
        markdown += `## Warnings\n\n`;
        readinessReport.warnings.forEach(warning => {
          markdown += `- ⚠️ **${warning.module}:** ${warning.message}\n`;
        });
        markdown += `\n`;
      }

      // Add recommendations
      if (readinessReport.recommendations.length > 0) {
        markdown += `## Recommendations\n\n`;
        readinessReport.recommendations.forEach((rec, index) => {
          markdown += `${index + 1}. ${rec}\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
      markdown += `*Generated by Interview AI Verification System v1.0.0*\n`;

      return markdown;
    } catch (error) {
      this.logger.error('Failed to generate Markdown report', error);
      throw error;
    }
  }

  /**
   * Generate production readiness assessment
   */
  async generateReadinessAssessment(results: TestResults): Promise<ReadinessReport> {
    this.logger.info('Generating readiness assessment');

    try {
      const moduleStatuses = new Map<string, ModuleStatus>();
      const criticalIssues: Issue[] = [];
      const warnings: Issue[] = [];

      // Analyze each module
      for (const [name, result] of results.moduleResults.entries()) {
        const moduleStatus = this.analyzeModuleStatus(name, result);
        moduleStatuses.set(name, moduleStatus);

        // Collect issues
        moduleStatus.issues.forEach(issue => {
          if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
            criticalIssues.push(issue);
          } else {
            warnings.push(issue);
          }
        });
      }

      // Calculate overall score
      const score = this.calculateReadinessScore(moduleStatuses);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(score, criticalIssues.length);

      // Generate recommendations
      const recommendations = this.generateRecommendations(moduleStatuses, criticalIssues);

      return {
        overallStatus,
        score,
        criticalIssues,
        warnings,
        recommendations,
        moduleStatuses,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to generate readiness assessment', error);
      throw error;
    }
  }

  /**
   * Analyze module status and calculate scores
   */
  private analyzeModuleStatus(moduleName: string, result: ModuleTestResult): ModuleStatus {
    const issues: Issue[] = [];

    // Calculate completeness score
    const completeness = result.report.completeness.totalChecks > 0
      ? (result.report.completeness.passedChecks / result.report.completeness.totalChecks) * 100
      : 0;

    // Calculate availability score
    const availability = result.report.availability.available ? 100 : 0;

    // Calculate performance score (default to 100 if not tested)
    const performance = result.report.performance 
      ? this.calculatePerformanceScore(result.report.performance)
      : 100;

    // Identify issues
    if (result.status === 'FAIL') {
      issues.push({
        severity: 'CRITICAL',
        module: moduleName,
        message: `Module verification failed`,
        details: result.report.completeness.failedChecks,
      });
    }

    if (!result.report.availability.available) {
      issues.push({
        severity: 'CRITICAL',
        module: moduleName,
        message: `Module is not available`,
        details: result.report.availability.errors,
      });
    }

    if (result.report.availability.healthStatus === 'degraded') {
      issues.push({
        severity: 'MEDIUM',
        module: moduleName,
        message: `Module health is degraded`,
      });
    }

    result.report.completeness.failedChecks.forEach(check => {
      issues.push({
        severity: 'HIGH',
        module: moduleName,
        message: `Check failed: ${check.name}`,
        details: check.error,
      });
    });

    return {
      name: moduleName,
      status: result.status,
      completeness,
      availability,
      performance,
      issues,
    };
  }

  /**
   * Calculate performance score from performance metrics
   */
  private calculatePerformanceScore(performance: any): number {
    // Simple scoring based on error rate and latency
    let score = 100;

    // Penalize for high error rate
    if (performance.errorRate > 0.05) score -= 30; // > 5% error rate
    else if (performance.errorRate > 0.01) score -= 15; // > 1% error rate

    // Penalize for high latency
    if (performance.p95Latency > 5000) score -= 30; // > 5s
    else if (performance.p95Latency > 3000) score -= 15; // > 3s

    return Math.max(0, score);
  }

  /**
   * Calculate overall readiness score
   */
  private calculateReadinessScore(moduleStatuses: Map<string, ModuleStatus>): number {
    if (moduleStatuses.size === 0) return 0;

    let totalScore = 0;
    const weights = {
      completeness: 0.5,
      availability: 0.3,
      performance: 0.2,
    };

    for (const status of moduleStatuses.values()) {
      const moduleScore = 
        status.completeness * weights.completeness +
        status.availability * weights.availability +
        status.performance * weights.performance;
      
      totalScore += moduleScore;
    }

    return Math.round(totalScore / moduleStatuses.size);
  }

  /**
   * Determine overall status based on score and critical issues
   */
  private determineOverallStatus(score: number, criticalIssueCount: number): 'READY' | 'NOT_READY' | 'CONDITIONAL' {
    if (criticalIssueCount > 0) {
      return 'NOT_READY';
    }

    if (score >= 90) {
      return 'READY';
    } else if (score >= 70) {
      return 'CONDITIONAL';
    } else {
      return 'NOT_READY';
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    moduleStatuses: Map<string, ModuleStatus>,
    criticalIssues: Issue[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical issues first
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical issue(s) before production deployment`);
    }

    // Module-specific recommendations
    for (const [name, status] of moduleStatuses.entries()) {
      if (status.completeness < 80) {
        recommendations.push(`Improve ${name} module completeness (currently ${status.completeness.toFixed(0)}%)`);
      }

      if (status.availability < 100) {
        recommendations.push(`Ensure ${name} module is fully available before deployment`);
      }

      if (status.performance < 70) {
        recommendations.push(`Optimize ${name} module performance (score: ${status.performance.toFixed(0)})`);
      }
    }

    // General recommendations
    const avgCompleteness = Array.from(moduleStatuses.values())
      .reduce((sum, s) => sum + s.completeness, 0) / moduleStatuses.size;

    if (avgCompleteness < 90) {
      recommendations.push('Increase test coverage across all modules');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is ready for production deployment');
      recommendations.push('Continue monitoring performance and error rates');
      recommendations.push('Maintain regular verification runs to catch regressions');
    }

    return recommendations;
  }

  /**
   * Get status emoji for display
   */
  private getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      'PASS': '✅',
      'FAIL': '❌',
      'WARNING': '⚠️',
      'READY': '✅',
      'NOT_READY': '❌',
      'CONDITIONAL': '⚠️',
    };
    return emojiMap[status] || '❓';
  }
}
