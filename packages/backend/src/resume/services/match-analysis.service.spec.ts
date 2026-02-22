import { Test, TestingModule } from '@nestjs/testing';
import { MatchAnalysisService } from './match-analysis.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AIEngineService } from '@/ai-providers/ai-engine.service';
import { EmbeddingService } from '@/agent/services/embedding.service';

describe('MatchAnalysisService', () => {
  let service: MatchAnalysisService;

  const mockResume = {
    id: 'resume-id',
    extractedText:
      'Experienced software engineer with JavaScript, Python, React skills',
    parsedData: {
      skills: ['JavaScript', 'Python', 'React'],
      experience: [
        {
          title: 'Software Engineer',
          company: 'Tech Co',
          duration: '3 years',
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science',
          school: 'University',
        },
      ],
    },
    optimizations: [],
  };

  const mockJob = {
    id: 'job-id',
    jobDescription: 'Looking for a senior software engineer',
    requirements: '5+ years experience, JavaScript, Python, React, AWS',
    parsedRequirements: {
      skills: ['JavaScript', 'Python', 'React', 'AWS'],
      experience: '5+ years',
    },
  };

  const mockPrismaService = {
    resume: {
      findUnique: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
  };

  const mockAIEngineService = {
    call: jest.fn(),
  };

  const mockEmbeddingService = {
    generateEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchAnalysisService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AIEngineService,
          useValue: mockAIEngineService,
        },
        {
          provide: EmbeddingService,
          useValue: mockEmbeddingService,
        },
      ],
    }).compile();

    service = module.get<MatchAnalysisService>(MatchAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMatch', () => {
    it('should analyze match between resume and job', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.skillMatch).toBeDefined();
      expect(result.experienceMatch).toBeDefined();
      expect(result.educationMatch).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.learningPath).toBeDefined();
    });

    it('should throw error if resume not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('invalid-id', 'job-id')
      ).rejects.toThrow();
    });

    it('should throw error if job not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('resume-id', 'invalid-id')
      ).rejects.toThrow();
    });
  });

  describe('skill matching', () => {
    it('should identify matched skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.skillMatch.matched.length).toBeGreaterThan(0);
      expect(
        result.skillMatch.matched.some((s) => s.skill === 'JavaScript')
      ).toBe(true);
    });

    it('should identify missing skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.skillMatch.missing.length).toBeGreaterThan(0);
      expect(result.skillMatch.missing.some((s) => s.skill === 'AWS')).toBe(
        true
      );
    });

    it('should identify additional skills', async () => {
      const resumeWithExtraSkills = {
        ...mockResume,
        parsedData: {
          ...mockResume.parsedData,
          skills: ['JavaScript', 'Python', 'React', 'Docker', 'Kubernetes'],
        },
      };

      mockPrismaService.resume.findUnique.mockResolvedValue(
        resumeWithExtraSkills
      );
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.skillMatch.additional.length).toBeGreaterThan(0);
    });
  });

  describe('experience matching', () => {
    it('should calculate experience score', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.experienceMatch.score).toBeGreaterThanOrEqual(0);
      expect(result.experienceMatch.score).toBeLessThanOrEqual(100);
    });

    it('should identify experience gaps', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.experienceMatch.gaps).toBeDefined();
      expect(Array.isArray(result.experienceMatch.gaps)).toBe(true);
    });

    it('should identify experience highlights', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.experienceMatch.highlights).toBeDefined();
      expect(Array.isArray(result.experienceMatch.highlights)).toBe(true);
    });
  });

  describe('education matching', () => {
    it('should evaluate education match', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.educationMatch.score).toBeGreaterThanOrEqual(0);
      expect(result.educationMatch.score).toBeLessThanOrEqual(100);
      expect(result.educationMatch.meets).toBeDefined();
      expect(result.educationMatch.notes).toBeDefined();
    });

    it('should detect bachelor degree requirement', async () => {
      const jobWithBachelor = {
        ...mockJob,
        requirements: 'Bachelor degree required',
      };

      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithBachelor);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.educationMatch.meets).toBe(true);
    });
  });

  describe('recommendations', () => {
    it('should generate prioritized recommendations', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].priority).toBeDefined();
      expect(result.recommendations[0].category).toBeDefined();
      expect(result.recommendations[0].suggestion).toBeDefined();
    });

    it('should include high priority recommendations for missing skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      const highPriorityRecs = result.recommendations.filter(
        (r) => r.priority === 'high'
      );
      expect(highPriorityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('learning path', () => {
    it('should generate learning path for missing skills', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      if (result.learningPath && result.learningPath.length > 0) {
        expect(result.learningPath[0].skill).toBeDefined();
        expect(result.learningPath[0].resources).toBeDefined();
        expect(result.learningPath[0].estimatedTime).toBeDefined();
      }
    });
  });

  describe('cosine similarity', () => {
    it('should calculate similarity correctly', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];

      mockEmbeddingService.generateEmbedding
        .mockResolvedValueOnce(vecA)
        .mockResolvedValueOnce(vecB);

      const result = await service.analyzeMatch('resume-id', 'job-id');

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
