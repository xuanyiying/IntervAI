/**
 * Example usage of TestOrchestrator
 * 
 * This file demonstrates how to use the TestOrchestrator class
 * to coordinate test execution across multiple modules.
 */

import { TestOrchestrator, TestType } from '../core/test-orchestrator';
import { BaseVerifier } from '../modules/base.verifier';

// Example: Create a simple verifier
class ExampleVerifier extends BaseVerifier {
  readonly moduleName = 'example-module';

  async verifyCompleteness() {
    const checks = [
      this.executeCheck('Check 1', async () => {
        // Your verification logic here
        console.log('Executing check 1');
      }),
      this.executeCheck('Check 2', async () => {
        // Your verification logic here
        console.log('Executing check 2');
      }),
    ];

    return this.aggregateResults(checks);
  }

  async verifyAvailability() {
    return {
      available: true,
      responseTime: 100,
      errors: [],
      healthStatus: 'healthy' as const,
    };
  }
}

// Example: Basic usage
async function basicUsage() {
  // Create orchestrator with configuration
  const orchestrator = new TestOrchestrator({
    environment: 'test',
    modules: ['example-module'],
    testTypes: [TestType.UNIT, TestType.INTEGRATION],
    parallel: false,
    timeout: 30000,
    retries: 3,
  });

  try {
    // Initialize the orchestrator
    await orchestrator.initialize();

    // Register verifiers
    const exampleVerifier = new ExampleVerifier();
    orchestrator.registerVerifier('example-module', exampleVerifier);

    // Run all tests
    const results = await orchestrator.runAll();

    console.log('Test Results:', {
      total: results.totalTests,
      passed: results.passedTests,
      failed: results.failedTests,
      duration: results.duration,
    });

    // Cleanup
    await orchestrator.cleanup();
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Example: Running a specific module
async function runSpecificModule() {
  const orchestrator = new TestOrchestrator();

  await orchestrator.initialize();

  const verifier = new ExampleVerifier();
  orchestrator.registerVerifier('example-module', verifier);

  // Run only the specific module
  const result = await orchestrator.runModule('example-module');

  console.log(`Module ${result.moduleName} status: ${result.status}`);

  await orchestrator.cleanup();
}

// Example: Parallel execution
async function parallelExecution() {
  const orchestrator = new TestOrchestrator({
    parallel: true, // Enable parallel execution
    timeout: 60000,
    retries: 2,
  });

  await orchestrator.initialize();

  // Register multiple verifiers
  const verifier1 = new ExampleVerifier();
  const verifier2 = new ExampleVerifier();

  orchestrator.registerVerifier('module1', verifier1);
  orchestrator.registerVerifier('module2', verifier2);

  // All modules will run in parallel
  const results = await orchestrator.runAll();

  console.log('Parallel execution completed:', {
    duration: results.duration,
    modules: results.moduleResults.size,
  });

  await orchestrator.cleanup();
}

// Example: Custom timeout and retry configuration
async function customConfiguration() {
  const orchestrator = new TestOrchestrator({
    timeout: 10000, // 10 seconds timeout per test
    retries: 5, // Retry up to 5 times on failure
    parallel: false,
  });

  await orchestrator.initialize();

  const verifier = new ExampleVerifier();
  orchestrator.registerVerifier('example-module', verifier);

  const results = await orchestrator.runAll();

  console.log('Tests completed with custom config');

  await orchestrator.cleanup();
}

// Export examples for documentation
export {
  basicUsage,
  runSpecificModule,
  parallelExecution,
  customConfiguration,
};
