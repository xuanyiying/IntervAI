# TestOrchestrator

The `TestOrchestrator` class is the core component of the verification system, responsible for coordinating test execution across all modules. It provides lifecycle management, parallel/sequential execution, retry logic, and timeout handling.

## Features

- **Test Lifecycle Management**: Initialize, execute, and cleanup test environments
- **Parallel & Sequential Execution**: Run tests in parallel for speed or sequentially for debugging
- **Retry Logic**: Automatically retry failed tests with configurable attempts and exponential backoff
- **Timeout Handling**: Prevent long-running tests from blocking execution
- **Module Registration**: Dynamically register and manage module verifiers
- **Result Aggregation**: Collect and aggregate results from all test modules

## Installation

The TestOrchestrator is part of the verification system. Import it from the core module:

```typescript
import { TestOrchestrator, TestType } from '@/core/test-orchestrator';
```

## Basic Usage

### 1. Create and Initialize

```typescript
const orchestrator = new TestOrchestrator({
  environment: 'test',
  modules: ['auth', 'resume'],
  testTypes: [TestType.UNIT, TestType.INTEGRATION],
  parallel: false,
  timeout: 30000,
  retries: 3,
});

await orchestrator.initialize();
```

### 2. Register Verifiers

```typescript
import { AuthVerifier } from '@/modules/auth.verifier';
import { ResumeVerifier } from '@/modules/resume.verifier';

const authVerifier = new AuthVerifier();
const resumeVerifier = new ResumeVerifier();

orchestrator.registerVerifier('auth', authVerifier);
orchestrator.registerVerifier('resume', resumeVerifier);
```

### 3. Run Tests

```typescript
// Run all registered modules
const results = await orchestrator.runAll();

console.log(`Total: ${results.totalTests}`);
console.log(`Passed: ${results.passedTests}`);
console.log(`Failed: ${results.failedTests}`);
console.log(`Duration: ${results.duration}ms`);

// Or run a specific module
const authResult = await orchestrator.runModule('auth');
console.log(`Auth module status: ${authResult.status}`);
```

### 4. Cleanup

```typescript
await orchestrator.cleanup();
```

## Configuration

### TestConfig Interface

```typescript
interface TestConfig {
  environment: 'test' | 'staging' | 'production';
  modules: string[];
  testTypes: TestType[];
  parallel: boolean;
  timeout: number;
  retries: number;
}
```

### Configuration Options

| Option        | Type                                  | Default               | Description                             |
| ------------- | ------------------------------------- | --------------------- | --------------------------------------- |
| `environment` | `'test' \| 'staging' \| 'production'` | `'test'`              | Target environment for tests            |
| `modules`     | `string[]`                            | `[]`                  | List of modules to test                 |
| `testTypes`   | `TestType[]`                          | `[UNIT, INTEGRATION]` | Types of tests to run                   |
| `parallel`    | `boolean`                             | `false`               | Enable parallel execution               |
| `timeout`     | `number`                              | `30000`               | Timeout per test in milliseconds        |
| `retries`     | `number`                              | `3`                   | Maximum retry attempts for failed tests |

### TestType Enum

```typescript
enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
}
```

## API Reference

### Constructor

```typescript
constructor(config?: Partial<TestConfig>)
```

Creates a new TestOrchestrator instance with optional configuration.

### Methods

#### initialize(config?: TestConfig): Promise<void>

Initializes the test environment. Must be called before running tests.

**Parameters:**

- `config` (optional): Override configuration

**Throws:**

- Error if configuration is invalid
- Error if already initialized

**Example:**

```typescript
await orchestrator.initialize({
  environment: 'staging',
  timeout: 60000,
});
```

#### registerVerifier(moduleName: string, verifier: BaseVerifier): void

Registers a module verifier for testing.

**Parameters:**

- `moduleName`: Unique identifier for the module
- `verifier`: Instance of BaseVerifier

**Example:**

```typescript
const authVerifier = new AuthVerifier();
orchestrator.registerVerifier('auth', authVerifier);
```

#### runAll(): Promise<TestResults>

Executes tests for all registered modules.

**Returns:** `TestResults` object containing aggregated results

**Throws:**

- Error if not initialized
- Error if test execution fails

**Example:**

```typescript
const results = await orchestrator.runAll();
console.log(`Passed: ${results.passedTests}/${results.totalTests}`);
```

#### runModule(moduleName: string): Promise<ModuleTestResult>

Executes tests for a specific module.

**Parameters:**

- `moduleName`: Name of the module to test

**Returns:** `ModuleTestResult` for the specified module

**Throws:**

- Error if not initialized
- Error if module not registered

**Example:**

```typescript
const result = await orchestrator.runModule('auth');
console.log(`Status: ${result.status}`);
```

#### cleanup(): Promise<void>

Cleans up resources and resets the orchestrator state.

**Example:**

```typescript
await orchestrator.cleanup();
```

#### getConfig(): TestConfig

Returns the current configuration.

**Returns:** Copy of current `TestConfig`

**Example:**

```typescript
const config = orchestrator.getConfig();
console.log(`Environment: ${config.environment}`);
```

#### getVerifiers(): string[]

Returns list of registered verifier names.

**Returns:** Array of module names

**Example:**

```typescript
const verifiers = orchestrator.getVerifiers();
console.log(`Registered modules: ${verifiers.join(', ')}`);
```

## Result Types

### TestResults

```typescript
interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  moduleResults: Map<string, ModuleTestResult>;
  startTime: Date;
  endTime?: Date;
}
```

### ModuleTestResult

```typescript
interface ModuleTestResult {
  moduleName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  report: ModuleReport;
  testCases: TestCaseResult[];
  duration: number;
}
```

### TestCaseResult

```typescript
interface TestCaseResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: Error;
  logs: string[];
  attempts?: number;
}
```

## Advanced Usage

### Parallel Execution

Enable parallel execution for faster test runs:

```typescript
const orchestrator = new TestOrchestrator({
  parallel: true,
  timeout: 60000,
});

await orchestrator.initialize();

// Register multiple verifiers
orchestrator.registerVerifier('auth', new AuthVerifier());
orchestrator.registerVerifier('resume', new ResumeVerifier());
orchestrator.registerVerifier('payment', new PaymentVerifier());

// All modules run in parallel
const results = await orchestrator.runAll();
```

### Custom Retry Strategy

Configure retry behavior for flaky tests:

```typescript
const orchestrator = new TestOrchestrator({
  retries: 5, // Retry up to 5 times
  timeout: 10000, // 10 second timeout
});
```

The orchestrator uses exponential backoff for retries:

- Attempt 1: Immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay
- Attempt 5: 8s delay

### Environment-Specific Configuration

Run tests against different environments:

```typescript
// Test environment
const testOrchestrator = new TestOrchestrator({
  environment: 'test',
  timeout: 30000,
});

// Staging environment
const stagingOrchestrator = new TestOrchestrator({
  environment: 'staging',
  timeout: 60000,
});

// Production environment (read-only checks)
const prodOrchestrator = new TestOrchestrator({
  environment: 'production',
  timeout: 120000,
  retries: 1, // Minimal retries in production
});
```

## Error Handling

The TestOrchestrator handles errors gracefully:

1. **Timeout Errors**: Tests exceeding the timeout are marked as failed
2. **Retry Logic**: Failed tests are automatically retried up to the configured limit
3. **Module Isolation**: Failure in one module doesn't affect others
4. **Detailed Logging**: All errors are logged with context

Example error handling:

```typescript
try {
  const results = await orchestrator.runAll();

  if (results.failedTests > 0) {
    console.error('Some tests failed:');
    results.moduleResults.forEach((result, moduleName) => {
      if (result.status === 'FAIL') {
        console.error(
          `- ${moduleName}: ${result.report.completeness.failedChecks.length} checks failed`
        );
      }
    });
  }
} catch (error) {
  console.error('Test execution failed:', error);
} finally {
  await orchestrator.cleanup();
}
```

## Best Practices

1. **Always Initialize**: Call `initialize()` before running tests
2. **Always Cleanup**: Call `cleanup()` in a finally block
3. **Use Parallel Wisely**: Enable parallel execution for independent tests only
4. **Set Appropriate Timeouts**: Configure timeouts based on test complexity
5. **Monitor Retries**: High retry counts may indicate flaky tests
6. **Check Results**: Always verify test results before proceeding

## Integration with CI/CD

Example GitHub Actions workflow:

```yaml
- name: Run Verification Tests
  run: |
    cd tests/verification
    npm test
  env:
    TEST_ENV: staging
    TEST_PARALLEL: true
```

## Troubleshooting

### Tests Timing Out

Increase the timeout value:

```typescript
const orchestrator = new TestOrchestrator({
  timeout: 120000, // 2 minutes
});
```

### Flaky Tests

Increase retry attempts:

```typescript
const orchestrator = new TestOrchestrator({
  retries: 5,
});
```

### Slow Execution

Enable parallel execution:

```typescript
const orchestrator = new TestOrchestrator({
  parallel: true,
});
```

### Module Not Found

Ensure the verifier is registered:

```typescript
orchestrator.registerVerifier('module-name', verifier);
const verifiers = orchestrator.getVerifiers();
console.log('Registered:', verifiers);
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 9.1**: Test lifecycle management (initialize, runAll, runModule, cleanup)
- **Requirement 9.2**: Parallel and sequential test execution support
- **Requirement 9.3**: Retry logic with configurable attempts
- **Requirement 9.4**: Timeout handling for long-running tests

## See Also

- [BaseVerifier](../modules/base.verifier.ts) - Base class for module verifiers
- [Test Configuration](../config/test.config.ts) - Configuration management
- [Usage Examples](../examples/orchestrator-usage.ts) - More examples
