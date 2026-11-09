import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';

/**
 * E2E Test Suite: Interview Preparation Flow
 * Tests the interview question generation, session lifecycle and report.
 *
 * Scenarios covered:
 * 1. Interview question generation
 * 2. Question retrieval and filtering
 * 3. Interview prep export
 * 4. Session lifecycle (start -> answer -> end -> report)
 * 5. Error handling
 *
 * Requires PostgreSQL, Redis and a configured AI provider (see .env.example).
 */
describe('Interview Preparation Flow E2E Tests (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;
  let resumeId: string;
  let jobId: string;
  let optimizationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Setup: Register user and create resume/job/optimization
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'interview-e2e@example.com',
        password: 'SecurePassword123!',
        username: 'interview-user',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create resume
    const resumeResponse = await request(app.getHttpServer())
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Interview Test Resume')
      .attach(
        'file',
        Buffer.from('John Doe\nSoftware Engineer\n5 years experience')
      );

    resumeId = resumeResponse.body.id;

    // Create job
    const jobResponse = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        jobDescription: 'We are hiring a senior engineer',
        requirements: 'Node.js, TypeScript, AWS',
      });

    jobId = jobResponse.body.id;

    // Create optimization
    const optimizationResponse = await request(app.getHttpServer())
      .post('/api/v1/optimizations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        jobId,
      });

    optimizationId = optimizationResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await prismaService.user.deleteMany({
        where: { email: 'interview-e2e@example.com' },
      });
    }
    await app.close();
  });

  describe('Interview Question Generation', () => {
    it('should generate interview questions', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId, count: 10 })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(10);
      expect(response.body.length).toBeLessThanOrEqual(15);

      // Verify question structure
      response.body.forEach((question: any) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('questionType');
        expect(question).toHaveProperty('suggestedAnswer');
        expect(question).toHaveProperty('tips');
        expect(question).toHaveProperty('difficulty');
      });
    });

    it('should include different question types', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId, count: 12 })
        .expect(201);

      const questionTypes = response.body.map((q: any) => q.questionType);
      const hasMultipleTypes = new Set(questionTypes).size > 1;

      expect(hasMultipleTypes).toBe(true);
    });

    it('should include difficulty levels', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId, count: 12 })
        .expect(201);

      const difficulties = response.body.map((q: any) =>
        String(q.difficulty).toLowerCase()
      );
      const validDifficulties = ['easy', 'medium', 'hard'];

      difficulties.forEach((difficulty: string) => {
        expect(validDifficulties).toContain(difficulty);
      });
    });

    it('should reject generation without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .query({ optimizationId, count: 10 })
        .expect(401);
    });

    it('should reject generation with invalid optimization ID', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId: 'invalid-id', count: 10 })
        .expect(404);
    });

    it('should clamp an out-of-range count into the supported range', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId, count: -5 })
        .expect(201);

      expect(response.body.length).toBeGreaterThanOrEqual(10);
      expect(response.body.length).toBeLessThanOrEqual(15);
    });
  });

  describe('Interview Question Retrieval', () => {
    it('should retrieve generated questions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/interview/questions/${optimizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject retrieval without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/interview/questions/${optimizationId}`)
        .expect(401);
    });

    it('should return 404 for non-existent optimization', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/interview/questions/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Interview Preparation Export', () => {
    it('should export interview preparation as HTML', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/interview/export/${optimizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('html');
      expect(typeof response.body.html).toBe('string');
    });

    it('should reject export without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/interview/export/${optimizationId}`)
        .expect(401);
    });

    it('should return 404 for non-existent optimization export', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/interview/export/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should export within performance threshold', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get(`/api/v1/interview/export/${optimizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Interview Session Lifecycle', () => {
    it('should start with a generated question, accept an answer and produce a report', async () => {
      const started = await request(app.getHttpServer())
        .post('/api/v1/interview/session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ optimizationId, mode: 'mock', language: 'zh' })
        .expect(201);

      expect(started.body.session.status).toBe('IN_PROGRESS');
      expect(started.body.firstQuestion).toBeTruthy();

      const sessionId = started.body.session.id;

      const answered = await request(app.getHttpServer())
        .post(`/api/v1/interview/session/${sessionId}/answer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'I led a team of five to deliver the service.' })
        .expect(200);

      expect(answered.body).toHaveProperty('nextQuestion');
      expect(typeof answered.body.isCompleted).toBe('boolean');

      await request(app.getHttpServer())
        .post(`/api/v1/interview/session/${sessionId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = await request(app.getHttpServer())
        .get(`/api/v1/interview/session/${sessionId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(report.body.sessionId).toBe(sessionId);
      expect(report.body.analysis).toBeDefined();
      expect(typeof report.body.markdown).toBe('string');
    });

    it('should report a real question count instead of an empty list', async () => {
      const started = await request(app.getHttpServer())
        .post('/api/v1/interview/session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ optimizationId, mode: 'mock', language: 'en' })
        .expect(201);

      const state = await request(app.getHttpServer())
        .get(`/api/v1/interview/session/${started.body.session.id}/current`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(state.body.totalQuestions).toBeGreaterThan(0);
      expect(state.body.isCompleted).toBe(false);
    });
  });

  describe('Interview Flow Performance', () => {
    it('should generate questions within 30 seconds', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post(`/api/v1/interview/questions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ optimizationId, count: 10 })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(30000);
    });

    it('should retrieve questions within 2 seconds', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get(`/api/v1/interview/questions/${optimizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
    });
  });
});
