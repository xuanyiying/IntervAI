import { testConfig } from '@/config/test.config';

describe('Verification System Setup', () => {
  describe('Configuration', () => {
    it('should load test configuration', () => {
      expect(testConfig).toBeDefined();
      expect(testConfig.environment).toBeDefined();
      expect(testConfig.apiBaseUrl).toBeDefined();
    });

    it('should have valid timeout configuration', () => {
      expect(testConfig.timeout.default).toBeGreaterThan(0);
      expect(testConfig.timeout.upload).toBeGreaterThan(0);
      expect(testConfig.timeout.ai).toBeGreaterThan(0);
    });

    it('should have valid retry configuration', () => {
      expect(testConfig.retry.maxAttempts).toBeGreaterThan(0);
      expect(testConfig.retry.delay).toBeGreaterThan(0);
      expect(testConfig.retry.backoff).toBeGreaterThan(0);
    });
  });

  describe('Test Helpers', () => {
    it('should generate unique test IDs', async () => {
      const { testData } = await import('@/helpers/test-data.helper');
      const id1 = testData.generateUniqueId();
      const id2 = testData.generateUniqueId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid test email', async () => {
      const { testData } = await import('@/helpers/test-data.helper');
      const email = testData.generateEmail();
      
      expect(email).toMatch(/^test-.*@interview-ai-test\.com$/);
    });

    it('should generate valid test user data', async () => {
      const { testData } = await import('@/helpers/test-data.helper');
      const userData = testData.generateUserData();
      
      expect(userData.email).toBeDefined();
      expect(userData.password).toBeDefined();
      expect(userData.name).toBeDefined();
    });
  });
});
