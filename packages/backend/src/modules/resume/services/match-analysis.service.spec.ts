import { Test, TestingModule } from '@nestjs/testing';
import { MatchAnalysisService } from './match-analysis.service';
import { PrismaService } from '@/infrastructure/database/services/prisma.service';
import { AIService } from '@/modules/ai/services/ai.service';

describe('MatchAnalysisService', () => {
  let service: MatchAnalysisService;

  const mockResume = {
    id: 'resume-id',
    extractedText:
      'Experienced software engineer with JavaScript, Python, React skills',
    optimizations: [],
  };

  const mockJob = {
    id: 'job-id',
    jobDescription: 'Looking for a senior software engineer',
    requirements: '5+ years experience, JavaScript, Python, React, AWS',
  };

  const mockPrismaService = {
    resume: {
      findUnique: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
  };

  const mockAIService = {
    executeSkill: jest.fn(),
    embed: jest.fn(),
  };

  const mockSkillPayload = {
    success: true,
    data: {
      analysis: 'Overall a good fit with a skill gap in AWS.',
      overallScore: 75,
      confidence: 'high',
      radar: [
        { dimension: 'skills', label: '技能匹配', score: 70 },
        { dimension: 'experience', label: '经验匹配', score: 60 },
        { dimension: 'education', label: '教育背景', score: 80 },
        { dimension: 'softSkills', label: '软技能', score: 85 },
        { dimension: 'hiddenRequirements', label: '隐性需求', score: 72 },
        { dimension: 'development', label: '发展潜力', score: 78 },
      ],
      breakdown: {
        skills: {
          score: 70,
          matched: ['JavaScript', 'Python', 'React'],
          missing: ['AWS'],
          partial: ['Docker'],
        },
        experience: {
          score: 60,
          yearsRequired: 5,
          yearsCandidate: 3,
          relevantExperience: ['Software Engineer at Tech Co'],
        },
        education: {
          score: 80,
          requirements: ['Bachelor degree'],
          candidateEducation: ['Bachelor of Science'],
          gap: [],
        },
        softSkills: {
          score: 85,
          required: ['沟通协作'],
          evidenced: ['跨团队协作'],
          gap: [],
        },
        hiddenRequirements: {
          score: 72,
          identified: ['能适应快节奏迭代'],
          aligned: ['有创业公司经历'],
          risk: ['稳定性待确认'],
        },
        development: {
          score: 78,
          signals: ['持续学习新框架'],
          trajectory: '从初级到高级稳步成长',
          fitForRole: '具备向资深岗位发展的潜力',
        },
      },
      gaps: [
        {
          area: 'skills',
          expectation: '熟悉 AWS 云服务',
          reality: '简历中未体现 AWS 经验',
          severity: 'high',
          suggestion: '补充 AWS 相关实践或考取认证',
        },
      ],
      strengths: ['技术栈高度契合'],
      concerns: ['云服务经验不足'],
      recommendations: ['补充 AWS 实战经验'],
      interviewFocus: ['云服务使用场景'],
    },
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
          provide: AIService,
          useValue: mockAIService,
        },
      ],
    }).compile();

    service = module.get<MatchAnalysisService>(MatchAnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMatch', () => {
    beforeEach(() => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockAIService.executeSkill.mockResolvedValue(mockSkillPayload);
      mockAIService.embed
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);
    });

    it('should analyze match with six-dimension radar', async () => {
      const result = await service.analyzeMatch(
        'resume-id',
        'job-id',
        'user-id'
      );

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.radar).toHaveLength(6);
      expect(result.radar.map((r) => r.dimension)).toEqual([
        'skills',
        'experience',
        'education',
        'softSkills',
        'hiddenRequirements',
        'development',
      ]);
      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0].severity).toBe('high');
      expect(result.breakdown.softSkills.score).toBe(85);
      expect(result.interviewFocus).toContain('云服务使用场景');
      expect(result.learningPath).toBeDefined();
    });

    it('should pass matchDepth detailed to the skill', async () => {
      await service.analyzeMatch('resume-id', 'job-id', 'user-id');

      expect(mockAIService.executeSkill).toHaveBeenCalledWith(
        'jd-matcher',
        expect.objectContaining({ matchDepth: 'detailed' }),
        'user-id'
      );
    });

    it('should fall back to defaults when skill output is malformed', async () => {
      mockAIService.executeSkill.mockResolvedValue({ success: false });

      const result = await service.analyzeMatch(
        'resume-id',
        'job-id',
        'user-id'
      );

      expect(result.radar).toHaveLength(6);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.gaps).toEqual([]);
    });

    it('should throw error if resume not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('invalid-id', 'job-id', 'user-id')
      ).rejects.toThrow();
    });

    it('should throw error if job not found', async () => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeMatch('resume-id', 'invalid-id', 'user-id')
      ).rejects.toThrow();
    });
  });

  describe('skill matching', () => {
    beforeEach(() => {
      mockPrismaService.resume.findUnique.mockResolvedValue(mockResume);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockAIService.executeSkill.mockResolvedValue(mockSkillPayload);
      mockAIService.embed
        .mockResolvedValueOnce([0.1, 0.2, 0.3])
        .mockResolvedValueOnce([0.15, 0.25, 0.35]);
    });

    it('should identify matched skills', async () => {
      const result = await service.analyzeMatch(
        'resume-id',
        'job-id',
        'user-id'
      );

      expect(result.breakdown.skills.matched).toContain('JavaScript');
    });

    it('should identify missing skills and build learning path', async () => {
      const result = await service.analyzeMatch(
        'resume-id',
        'job-id',
        'user-id'
      );

      expect(result.breakdown.skills.missing).toContain('AWS');
      expect(result.learningPath?.[0].skill).toBe('AWS');
    });
  });
});
