import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../config/.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
  console.log('[JestSetup] Starting test suite setup');
});

// Global cleanup after all tests
afterAll(async () => {
  console.log('[JestSetup] Starting test suite cleanup');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[JestSetup] Unhandled Rejection at:', { promise, reason });
});
