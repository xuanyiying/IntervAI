/**
 * Example usage of ReportGenerator
 * 
 * This file demonstrates how to use the ReportGenerator class to create
 * comprehensive reports in JSON, HTML, and Markdown formats, as well as
 * generate production readiness assessments.
 */

import { ReportGenerator } from '@/core/report-generator';
import { TestOrchestrator, TestType } from '@/core/test-orchestrator';
import * as fs from 'fs';
import * as path from 'path';

async function generateReports() {
  console.log('🔍 Starting verification and report generation...\n');

  // Step 1: Initialize and run tests
  const orchestrator = new TestOrchestrator({
    environment: 'test',
    modules: ['auth', 'resume', 'optimization'],
    testTypes: [TestType.UNIT, TestType.INTEGRATION],
    parallel: true,
    timeout: 30000,
    retries: 3,
  });

  await orchestrator.initialize();

  // Register your verifiers here
  // orchestrator.registerVerifier('auth', new AuthVerifier());
  // orchestrator.registerVerifier('resume', new ResumeVerifier());
  // etc.

  console.log('Running all tests...');
  const testResults = await orchestrator.runAll();

  console.log(`\n✅ Tests completed:`);
  console.log(`   Total: ${testResults.totalTests}`);
  console.log(`   Passed: ${testResults.passedTests}`);
  console.log(`   Failed: ${testResults.failedTests}`);
  console.log(`   Duration: ${(testResults.duration / 1000).toFixed(2)}s\n`);

  // Step 2: Generate reports
  const reportGenerator = new ReportGenerator();
  const reportsDir = path.join(__dirname, '../reports');

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate JSON report
  console.log('📄 Generating JSON report...');
  const jsonReport = await reportGenerator.generateJSON(testResults);
  const jsonPath = path.join(reportsDir, 'verification-report.json');
  fs.writeFileSync(jsonPath, jsonReport);
  console.log(`   Saved to: ${jsonPath}`);

  // Generate HTML report
  console.log('🌐 Generating HTML report...');
  const htmlReport = await reportGenerator.generateHTML(testResults);
  const htmlPath = path.join(reportsDir, 'verification-report.html');
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`   Saved to: ${htmlPath}`);

  // Generate Markdown report
  console.log('📝 Generating Markdown report...');
  const markdownReport = await reportGenerator.generateMarkdown(testResults);
  const markdownPath = path.join(reportsDir, 'verification-report.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`   Saved to: ${markdownPath}`);

  // Step 3: Generate readiness assessment
  console.log('\n🎯 Generating production readiness assessment...');
  const readinessReport = await reportGenerator.generateReadinessAssessment(testResults);

  console.log(`\n📊 Production Readiness Assessment:`);
  console.log(`   Overall Status: ${readinessReport.overallStatus}`);
  console.log(`   Readiness Score: ${readinessReport.score}/100`);
  console.log(`   Critical Issues: ${readinessReport.criticalIssues.length}`);
  console.log(`   Warnings: ${readinessReport.warnings.length}`);

  if (readinessReport.criticalIssues.length > 0) {
    console.log(`\n🚨 Critical Issues:`);
    readinessReport.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity}] ${issue.module}: ${issue.message}`);
    });
  }

  if (readinessReport.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    readinessReport.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  // Step 4: Module-level details
  console.log(`\n📦 Module Status:`);
  readinessReport.moduleStatuses.forEach((status, moduleName) => {
    const statusIcon = status.status === 'PASS' ? '✅' : status.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`   ${statusIcon} ${moduleName}:`);
    console.log(`      Completeness: ${status.completeness.toFixed(0)}%`);
    console.log(`      Availability: ${status.availability.toFixed(0)}%`);
    console.log(`      Performance: ${status.performance.toFixed(0)}%`);
    if (status.issues.length > 0) {
      console.log(`      Issues: ${status.issues.length}`);
    }
  });

  // Cleanup
  await orchestrator.cleanup();

  console.log(`\n✨ Report generation completed!`);
  console.log(`   View HTML report: file://${htmlPath}`);
}

// Example: Generate reports for specific modules only
async function generateModuleReport(moduleName: string) {
  console.log(`🔍 Generating report for module: ${moduleName}\n`);

  const orchestrator = new TestOrchestrator({
    environment: 'test',
    modules: [moduleName],
    testTypes: [TestType.UNIT, TestType.INTEGRATION],
    parallel: false,
    timeout: 30000,
    retries: 3,
  });

  await orchestrator.initialize();

  // Register the specific verifier
  // orchestrator.registerVerifier(moduleName, new YourVerifier());

  const testResults = await orchestrator.runModule(moduleName);
  const reportGenerator = new ReportGenerator();

  // Generate markdown report for quick viewing
  const markdownReport = await reportGenerator.generateMarkdown({
    totalTests: testResults.testCases.length,
    passedTests: testResults.testCases.filter(tc => tc.status === 'PASS').length,
    failedTests: testResults.testCases.filter(tc => tc.status === 'FAIL').length,
    skippedTests: testResults.testCases.filter(tc => tc.status === 'SKIP').length,
    duration: testResults.duration,
    moduleResults: new Map([[moduleName, testResults]]),
    startTime: new Date(),
    endTime: new Date(),
  });

  console.log(markdownReport);

  await orchestrator.cleanup();
}

// Example: Custom readiness assessment
async function customReadinessCheck(testResults: any) {
  const reportGenerator = new ReportGenerator();
  const assessment = await reportGenerator.generateReadinessAssessment(testResults);

  // Custom logic based on assessment
  if (assessment.overallStatus === 'READY') {
    console.log('✅ System is ready for production deployment!');
    return true;
  } else if (assessment.overallStatus === 'CONDITIONAL') {
    console.log('⚠️  System can be deployed with caution. Review warnings.');
    return confirm('Proceed with deployment?');
  } else {
    console.log('❌ System is NOT ready for production. Fix critical issues first.');
    return false;
  }
}

// Run the example
if (require.main === module) {
  generateReports()
    .then(() => {
      console.log('\n✅ Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error);
      process.exit(1);
    });
}

export { generateReports, generateModuleReport, customReadinessCheck };
