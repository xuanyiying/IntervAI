import { AIService } from '@/modules/ai';
import { Test, TestingModule } from '@nestjs/testing';
import { ResumeAIService } from './resume-ai.service';

describe('ResumeAIService.diagnoseResume', () => {
  let service: ResumeAIService;
  let aiService: jest.Mocked<AIService>;

  const parsedData = {
    personalInfo: { name: '李四', email: 'a@b.com', phone: '13800138000' },
    summary: '八年经验的软件工程师',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    experience: [
      {
        company: 'A公司',
        position: '工程师',
        startDate: '2020.01',
        description: ['负责后端开发，效率提升 30%'],
        achievements: [],
      },
    ],
    education: [
      { institution: '某大学', degree: '本科', field: '计算机', startDate: '2016.09' },
    ],
    projects: [],
    certifications: [],
    languages: [],
  } as any;

  beforeEach(async () => {
    const mockAiService = { executeSkill: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeAIService,
        { provide: AIService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<ResumeAIService>(ResumeAIService);
    aiService = module.get(AIService);
  });

  it('should normalize AI diagnosis: clamp scores and recompute the sum', async () => {
    aiService.executeSkill.mockResolvedValue({
      success: true,
      metadata: { skillName: 'resume-diagnosis', duration: 100 },
      data: {
        overallScore: 999,
        scoreDetail: {
          projectScore: 100,
          skillMatchScore: -5,
          contentScore: 12.4,
          structureScore: 15,
          expressionScore: 8,
        },
        language: 'zh',
        summary: '整体不错，缺项目经历',
        strengths: ['技能描述具体'],
        weaknesses: [],
        suggestions: [
          {
            category: '项目经历',
            priority: '高',
            issue: '没有项目经历',
            recommendation: '补充 2 个项目',
          },
          { category: '', priority: '', issue: '', recommendation: '' },
        ],
      },
    });

    const result = await service.diagnoseResume(parsedData, 'u1');

    expect(result.scoreDetail.projectScore).toBe(40);
    expect(result.scoreDetail.skillMatchScore).toBe(0);
    expect(result.scoreDetail.contentScore).toBe(12);
    expect(result.overallScore).toBe(
      Object.values(result.scoreDetail).reduce((a, b) => a + b, 0)
    );
    expect(result.suggestions.length).toBe(1);
    expect(result.summary).toBe('整体不错，缺项目经历');
  });

  it('should unwrap { raw } executor output', async () => {
    const diagnosis = {
      scoreDetail: {
        projectScore: 20,
        skillMatchScore: 10,
        contentScore: 10,
        structureScore: 10,
        expressionScore: 5,
      },
      language: 'zh',
      summary: 's',
      strengths: ['x'],
      weaknesses: ['y'],
      suggestions: [],
    };
    aiService.executeSkill.mockResolvedValue({
      success: true,
      metadata: { skillName: 'resume-diagnosis', duration: 100 },
      data: { raw: JSON.stringify(diagnosis) },
    });

    const result = await service.diagnoseResume(parsedData, 'u1');
    expect(result.overallScore).toBe(55);
    expect(result.strengths).toEqual(['x']);
  });

  it('should fall back to rule-based scoring when AI fails', async () => {
    aiService.executeSkill.mockRejectedValue(new Error('provider down'));

    const result = await service.diagnoseResume(parsedData, 'u1');

    expect(result.overallScore).toBeGreaterThan(0);
    expect(Object.keys(result.scoreDetail).sort()).toEqual([
      'contentScore',
      'expressionScore',
      'projectScore',
      'skillMatchScore',
      'structureScore',
    ]);
    expect(typeof result.summary).toBe('string');
  });

  it('should fall back when the AI result is structurally unusable', async () => {
    aiService.executeSkill.mockResolvedValue({
      success: true,
      metadata: { skillName: 'resume-diagnosis', duration: 100 },
      data: { note: 'not a diagnosis' },
    });

    const result = await service.diagnoseResume(parsedData, 'u1');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
