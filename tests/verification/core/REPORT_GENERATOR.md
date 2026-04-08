# ReportGenerator Documentation

## Overview

The `ReportGenerator` class is responsible for generating comprehensive verification reports in multiple formats (JSON, HTML, Markdown) and producing production readiness assessments with scoring algorithms.

## Features

- **Multiple Report Formats**: Generate reports in JSON, HTML, and Markdown
- **Production Readiness Assessment**: Calculate readiness scores and identify critical issues
- **Visual HTML Reports**: Beautiful, styled HTML reports with charts and progress bars
- **Scoring Algorithm**: Intelligent scoring based on completeness, availability, and performance
- **Actionable Recommendations**: Generate specific recommendations based on test results

## Installation

The ReportGenerator is part of the core verification framework:

```typescript
import { ReportGenerator } from '@/core/report-generator';
```

## Usage

### Basic Usage

```typescript
import { ReportGenerator } from '@/core/report-generator';
import { TestResults } from '@/core/test-orchestrator';

const reportGenerator = new ReportGenerator();

// Assuming you have test results from TestOrchestrator
const testResults: TestResults = await orchestrator.runAll();

// Generate JSON report
const jsonReport = await reportGenerator.generateJSON(testResults);

// Generate HTML report
const htmlReport = await reportGenerator.generateHTML(testResults);

// Generate Markdown report
const markdownReport = await reportGenerator.generateMarkdown(testResults);

// Generate readiness assessment
const assessment =
  await reportGenerator.generateReadinessAssessment(testResults);
```

### Saving Reports to Files

```typescript
import * as fs from 'fs';
import * as path from 'path';

const reportsDir = path.join(__dirname, '../reports');

// Save JSON report
fs.writeFileSync(
  path.join(reportsDir, 'report.json'),
  await reportGenerator.generateJSON(testResults)
);

// Save HTML report
fs.writeFileSync(
  path.join(reportsDir, 'report.html'),
  await reportGenerator.generateHTML(testResults)
);

// Save Markdown report
fs.writeFileSync(
  path.join(reportsDir, 'report.md'),
  await reportGenerator.generateMarkdown(testResults)
);
```

## Report Formats

### JSON Report

The JSON report contains structured data suitable for programmatic processing:

```json
{
  "summary": {
    "totalTests": 100,
    "passedTests": 95,
    "failedTests": 5,
    "skippedTests": 0,
    "duration": 45000,
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:00:45.000Z"
  },
  "modules": [
    {
      "name": "auth",
      "status": "PASS",
      "duration": 5000,
      "completeness": {
        "passed": true,
        "totalChecks": 10,
        "passedChecks": 10,
        "failedChecks": [],
        "warnings": []
      },
      "availability": {
        "available": true,
        "responseTime": 150,
        "errors": [],
        "healthStatus": "healthy"
      }
    }
  ],
  "generatedAt": "2024-01-01T10:01:00.000Z"
}
```

### HTML Report

The HTML report is a beautiful, self-contained web page with:

- **Summary Dashboard**: Overview of test results with visual cards
- **Readiness Score**: Large circular score indicator with status badge
- **Module Cards**: Detailed module results with progress bars
- **Issue Tracking**: Critical issues and warnings highlighted
- **Recommendations**: Actionable recommendations for improvement
- **Responsive Design**: Works on desktop and mobile devices

Features:

- Color-coded status indicators (green for pass, red for fail, yellow for warnings)
- Progress bars showing completeness and availability percentages
- Gradient header with modern styling
- Print-friendly layout

### Markdown Report

The Markdown report is ideal for documentation and version control:

```markdown
# Core Functionality Verification Report

**Generated:** 2024-01-01 10:01:00  
**Duration:** 45.00s

## Summary

| Metric      | Value |
| ----------- | ----- |
| Total Tests | 100   |
| Passed      | 95 ✅ |
| Failed      | 5 ❌  |
| Skipped     | 0 ⏭️  |
| Pass Rate   | 95.0% |

## Production Readiness Assessment

**Overall Status:** ✅ **READY**  
**Readiness Score:** 92/100

## Module Results

### ✅ auth

- **Status:** PASS
- **Completeness:** 100% (10/10 checks passed)
- **Availability:** ✅ Available
- **Health:** healthy
- **Duration:** 5.00s
```

## Production Readiness Assessment

### Readiness Report Structure

```typescript
interface ReadinessReport {
  overallStatus: 'READY' | 'NOT_READY' | 'CONDITIONAL';
  score: number; // 0-100
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
  moduleStatuses: Map<string, ModuleStatus>;
  generatedAt: Date;
}
```

### Scoring Algorithm

The readiness score is calculated using a weighted average of three factors:

1. **Completeness (50%)**: Percentage of checks that passed
2. **Availability (30%)**: Whether the module is available
3. **Performance (20%)**: Performance metrics (latency, error rate)

**Formula:**

```
moduleScore = (completeness × 0.5) + (availability × 0.3) + (performance × 0.2)
overallScore = average(all module scores)
```

### Status Determination

- **READY** (score ≥ 90): No critical issues, high scores across all modules
- **CONDITIONAL** (70 ≤ score < 90): No critical issues, but some improvements needed
- **NOT_READY** (score < 70 or critical issues > 0): Critical issues must be fixed

### Issue Severity Levels

- **CRITICAL**: Module verification failed or unavailable
- **HIGH**: Individual check failed
- **MEDIUM**: Module health degraded
- **LOW**: Minor warnings

## Module Status

Each module is analyzed and scored individually:

```typescript
interface ModuleStatus {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARNING';
  completeness: number; // 0-100
  availability: number; // 0-100
  performance: number; // 0-100
  issues: Issue[];
}
```

### Completeness Score

```
completeness = (passedChecks / totalChecks) × 100
```

### Availability Score

```
availability = module.available ? 100 : 0
```

### Performance Score

Performance is scored based on error rate and latency:

- Base score: 100
- Penalty for error rate > 5%: -30 points
- Penalty for error rate > 1%: -15 points
- Penalty for P95 latency > 5s: -30 points
- Penalty for P95 latency > 3s: -15 points

## Recommendations

The report generator automatically generates recommendations based on:

1. **Critical Issues**: Must be addressed before production
2. **Low Completeness**: Modules with < 80% completeness
3. **Availability Issues**: Modules that are not fully available
4. **Performance Issues**: Modules with performance score < 70
5. **General Advice**: Best practices for maintaining quality

Example recommendations:

- "Address 3 critical issue(s) before production deployment"
- "Improve auth module completeness (currently 75%)"
- "Ensure payment module is fully available before deployment"
- "Optimize storage module performance (score: 65)"
- "Increase test coverage across all modules"

## API Reference

### ReportGenerator Class

#### Methods

##### `generateJSON(results: TestResults): Promise<string>`

Generates a JSON report from test results.

**Parameters:**

- `results`: Test results from TestOrchestrator

**Returns:** JSON string

**Example:**

```typescript
const jsonReport = await reportGenerator.generateJSON(testResults);
```

##### `generateHTML(results: TestResults): Promise<string>`

Generates an HTML report with visual styling and charts.

**Parameters:**

- `results`: Test results from TestOrchestrator

**Returns:** HTML string

**Example:**

```typescript
const htmlReport = await reportGenerator.generateHTML(testResults);
```

##### `generateMarkdown(results: TestResults): Promise<string>`

Generates a Markdown report suitable for documentation.

**Parameters:**

- `results`: Test results from TestOrchestrator

**Returns:** Markdown string

**Example:**

```typescript
const markdownReport = await reportGenerator.generateMarkdown(testResults);
```

##### `generateReadinessAssessment(results: TestResults): Promise<ReadinessReport>`

Generates a production readiness assessment with scoring and recommendations.

**Parameters:**

- `results`: Test results from TestOrchestrator

**Returns:** ReadinessReport object

**Example:**

```typescript
const assessment =
  await reportGenerator.generateReadinessAssessment(testResults);
console.log(`Readiness Score: ${assessment.score}/100`);
console.log(`Status: ${assessment.overallStatus}`);
```

## Integration Examples

### CI/CD Integration

```typescript
// In your CI/CD pipeline
const testResults = await orchestrator.runAll();
const reportGenerator = new ReportGenerator();
const assessment =
  await reportGenerator.generateReadinessAssessment(testResults);

if (assessment.overallStatus === 'NOT_READY') {
  console.error('❌ Deployment blocked: System not ready');
  process.exit(1);
} else if (assessment.overallStatus === 'CONDITIONAL') {
  console.warn('⚠️  Deployment allowed with warnings');
  // Generate reports for review
  fs.writeFileSync(
    'report.html',
    await reportGenerator.generateHTML(testResults)
  );
} else {
  console.log('✅ Deployment approved: System ready');
}
```

### Automated Reporting

```typescript
// Schedule daily verification reports
async function dailyVerificationReport() {
  const orchestrator = new TestOrchestrator({
    /* config */
  });
  await orchestrator.initialize();

  const testResults = await orchestrator.runAll();
  const reportGenerator = new ReportGenerator();

  // Generate all formats
  const reports = {
    json: await reportGenerator.generateJSON(testResults),
    html: await reportGenerator.generateHTML(testResults),
    markdown: await reportGenerator.generateMarkdown(testResults),
  };

  // Save to dated directory
  const date = new Date().toISOString().split('T')[0];
  const reportDir = `reports/${date}`;
  fs.mkdirSync(reportDir, { recursive: true });

  fs.writeFileSync(`${reportDir}/report.json`, reports.json);
  fs.writeFileSync(`${reportDir}/report.html`, reports.html);
  fs.writeFileSync(`${reportDir}/report.md`, reports.markdown);

  // Send notification with readiness score
  const assessment =
    await reportGenerator.generateReadinessAssessment(testResults);
  await sendNotification({
    title: 'Daily Verification Report',
    score: assessment.score,
    status: assessment.overallStatus,
    reportUrl: `file://${reportDir}/report.html`,
  });
}
```

## Best Practices

1. **Save Reports**: Always save reports to files for historical tracking
2. **Version Control**: Commit Markdown reports to track changes over time
3. **CI/CD Gates**: Use readiness assessment to gate deployments
4. **Regular Monitoring**: Run verification regularly to catch regressions early
5. **Review Recommendations**: Act on recommendations to improve system quality
6. **Share HTML Reports**: HTML reports are great for sharing with stakeholders

## Troubleshooting

### Empty Reports

If reports are empty, ensure:

- TestOrchestrator has registered verifiers
- Tests have been executed before generating reports
- TestResults object is properly populated

### Low Readiness Scores

If readiness scores are unexpectedly low:

- Check module completeness percentages
- Review failed checks in module reports
- Verify availability status of all modules
- Check performance metrics if available

### Missing Recommendations

If no recommendations are generated:

- System is likely in excellent condition (score ≥ 90)
- All modules passing with high completeness
- No critical issues or warnings detected

## See Also

- [TestOrchestrator Documentation](./README.md)
- [BaseVerifier Documentation](../modules/base.verifier.ts)
- [Example Usage](../examples/report-generator-usage.ts)
