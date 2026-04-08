/**
 * Example: Using AuthVerifier to verify authentication module
 * 
 * This example demonstrates how to use the AuthVerifier class to verify
 * the authentication module's completeness and availability.
 */

import { AuthVerifier } from '@/modules/auth.verifier';
import { TestOrchestrator } from '@/core/test-orchestrator';

async function runAuthVerification() {
  console.log('=== Authentication Module Verification ===\n');

  // Create an instance of AuthVerifier
  const authVerifier = new AuthVerifier();

  try {
    // 1. Check availability
    console.log('1. Checking authentication module availability...');
    const availability = await authVerifier.verifyAvailability();
    console.log(`   Available: ${availability.available}`);
    console.log(`   Response Time: ${availability.responseTime}ms`);
    console.log(`   Health Status: ${availability.healthStatus}\n`);

    // 2. Verify completeness
    console.log('2. Verifying authentication completeness...');
    const completeness = await authVerifier.verifyCompleteness();
    console.log(`   Passed: ${completeness.passed}`);
    console.log(`   Total Checks: ${completeness.totalChecks}`);
    console.log(`   Passed Checks: ${completeness.passedChecks}`);
    console.log(`   Failed Checks: ${completeness.failedChecks.length}\n`);

    if (completeness.failedChecks.length > 0) {
      console.log('   Failed Checks Details:');
      completeness.failedChecks.forEach((check) => {
        console.log(`     - ${check.name}: ${check.error?.message}`);
      });
      console.log();
    }

    // 3. Generate full report
    console.log('3. Generating authentication module report...');
    const report = await authVerifier.generateReport();
    console.log(`   Module: ${report.moduleName}`);
    console.log(`   Status: ${report.status}`);
    console.log(`   Timestamp: ${report.timestamp.toISOString()}\n`);

    // 4. Cleanup
    await authVerifier.cleanup();
    console.log('4. Cleanup completed\n');

    return report;
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

async function runWithOrchestrator() {
  console.log('=== Using TestOrchestrator ===\n');

  // Create orchestrator
  const orchestrator = new TestOrchestrator({
    modules: ['auth'],
    parallel: false,
  });

  try {
    // Initialize
    await orchestrator.initialize();

    // Register AuthVerifier
    const authVerifier = new AuthVerifier();
    orchestrator.registerVerifier('auth', authVerifier);

    // Run verification
    console.log('Running authentication module verification...');
    const result = await orchestrator.runModule('auth');

    console.log(`\nModule: ${result.moduleName}`);
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Test Cases: ${result.testCases.length}`);

    // Cleanup
    await orchestrator.cleanup();
    await authVerifier.cleanup();

    return result;
  } catch (error) {
    console.error('Error during orchestrated verification:', error);
    throw error;
  }
}

// Run examples
if (require.main === module) {
  (async () => {
    try {
      // Example 1: Direct usage
      await runAuthVerification();

      console.log('\n' + '='.repeat(50) + '\n');

      // Example 2: Using orchestrator
      await runWithOrchestrator();
    } catch (error) {
      console.error('Example failed:', error);
      process.exit(1);
    }
  })();
}

export { runAuthVerification, runWithOrchestrator };
