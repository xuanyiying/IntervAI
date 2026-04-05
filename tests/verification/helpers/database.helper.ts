import { Pool, PoolClient } from 'pg';
import { testConfig } from '@/config/test.config';

export class DatabaseHelper {
  private pool: Pool;
  private static instance: DatabaseHelper;

  private constructor() {
    this.pool = new Pool({
      connectionString: testConfig.database.url,
      min: testConfig.database.poolMin,
      max: testConfig.database.poolMax,
    });
  }

  static getInstance(): DatabaseHelper {
    if (!DatabaseHelper.instance) {
      DatabaseHelper.instance = new DatabaseHelper();
    }
    return DatabaseHelper.instance;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params?: any[]): Promise<number> {
    const client = await this.getClient();
    try {
      const result = await client.query(sql, params);
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async clearTestData(): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      
      // Clear test data in reverse order of dependencies
      await client.query(`DELETE FROM "InterviewMessage" WHERE "sessionId" IN (SELECT id FROM "InterviewSession" WHERE "userId" LIKE 'test-%')`);
      await client.query(`DELETE FROM "InterviewSession" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "OptimizationResult" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Application" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Job" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Resume" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "SubscriptionEvent" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Subscription" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Account" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "Session" WHERE "userId" LIKE 'test-%'`);
      await client.query(`DELETE FROM "User" WHERE id LIKE 'test-%' OR email LIKE 'test%@%'`);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const db = DatabaseHelper.getInstance();
