import { AIService } from '@/core/ai';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PitchPerfectService } from './pitch-perfect.service';

describe('PitchPerfectService', () => {
  let service: PitchPerfectService;
  let aiService: jest.Mocked<AIService>;

  const mockUserId = 'test-user-id';

  const mockResumeData = {
    personalInfo: {
      name: 'Test User',
      email: 'test@example.com',
    },
    summary: 'Experienced software engineer',
    skills: ['JavaScript', 'TypeScript', 'React'],
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Developer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: ['Built web applications'],
        achievements: ['Improved performance by 50%'],
      },
    ],
    projects: [],
  };

  const mockJobDescription = `
    Senior Software Engineer position at Tech Company.
    Requirements: JavaScript, TypeScript, React, Node.js
    Responsibilities: Build scalable web applications
  `;

  const mockPitchOutput = {
    introduction:
      'I am an experienced software engineer with expertise in JavaScript and React.',
    highlights: [
      '5+ years of experience in web development',
      'Improved application performance by 50%',
    ],
    keywordOverlap: {
      matched: ['JavaScript', 'React', 'TypeScript'],
      missing: ['Node.js'],
      overlapPercentage: 75,
    },
    suggestions: [
      'Add more details about Node.js experience',
      'Quantify project outcomes',
    ],
  };

  const mockSkillMetadata = {
    skillName: 'pitch-perfect',
    duration: 1500,
    tokensUsed: 500,
    modelUsed: 'gpt-4',
  };

  beforeEach(async () => {
    const mockAiService = {
      executeSkill: jest.fn(),
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PitchPerfectService,
        { provide: AIService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<PitchPerfectService>(PitchPerfectService);
    aiService = module.get(AIService);
  });

  describe('generatePitch', () => {
    it('should generate pitch successfully', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: true,
        data: mockPitchOutput,
        metadata: mockSkillMetadata,
      });

      const result = await service.generatePitch(
        {
          resumeData: mockResumeData as any,
          jobDescription: mockJobDescription,
          style: 'technical',
          duration: 30,
        },
        mockUserId
      );

      expect(result.introduction).toBeDefined();
      expect(result.highlights).toBeInstanceOf(Array);
      expect(result.keywordOverlap.overlapPercentage).toBe(75);
      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'pitch-perfect',
        expect.objectContaining({
          style: 'technical',
          duration: 30,
        }),
        mockUserId
      );
    });

    it('should use default style and duration when not provided', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: true,
        data: mockPitchOutput,
        metadata: mockSkillMetadata,
      });

      await service.generatePitch(
        {
          resumeData: mockResumeData as any,
          jobDescription: mockJobDescription,
        },
        mockUserId
      );

      expect(aiService.executeSkill).toHaveBeenCalledWith(
        'pitch-perfect',
        expect.objectContaining({
          style: 'technical',
          duration: 30,
        }),
        mockUserId
      );
    });

    it('should throw BadRequestException when resumeData is missing', async () => {
      await expect(
        service.generatePitch(
          {
            resumeData: null as any,
            jobDescription: mockJobDescription,
          },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when jobDescription is missing', async () => {
      await expect(
        service.generatePitch(
          {
            resumeData: mockResumeData as any,
            jobDescription: '',
          },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when AI skill fails', async () => {
      aiService.executeSkill.mockResolvedValue({
        success: false,
        error: {
          code: 'SKILL_ERROR',
          message: 'AI processing failed',
        },
        metadata: mockSkillMetadata,
      });

      await expect(
        service.generatePitch(
          {
            resumeData: mockResumeData as any,
            jobDescription: mockJobDescription,
          },
          mockUserId
        )
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle AI service exceptions', async () => {
      aiService.executeSkill.mockRejectedValue(new Error('Network error'));

      await expect(
        service.generatePitch(
          {
            resumeData: mockResumeData as any,
            jobDescription: mockJobDescription,
          },
          mockUserId
        )
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('refinePitch', () => {
    it('should refine pitch based on user feedback', async () => {
      aiService.generate.mockResolvedValue(
        'I am an experienced software engineer with 5+ years of expertise in JavaScript and React.'
      );

      const result = await service.refinePitch(
        {
          currentIntroduction: mockPitchOutput.introduction,
          feedback: 'Make it more confident',
        },
        mockUserId
      );

      expect(result.refinedIntroduction).toBeDefined();
      expect(aiService.generate).toHaveBeenCalled();
    });

    it('should throw BadRequestException when currentIntroduction is missing', async () => {
      await expect(
        service.refinePitch(
          {
            currentIntroduction: '',
            feedback: 'Make it better',
          },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when feedback is missing', async () => {
      await expect(
        service.refinePitch(
          {
            currentIntroduction: 'Current text',
            feedback: '',
          },
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('parsePitchOutput', () => {
    it('should parse valid JSON string', () => {
      const result = (service as any).parsePitchOutput(
        JSON.stringify(mockPitchOutput)
      );

      expect(result.introduction).toBe(mockPitchOutput.introduction);
      expect(result.highlights).toEqual(mockPitchOutput.highlights);
    });

    it('should handle object input directly', () => {
      const result = (service as any).parsePitchOutput(mockPitchOutput);

      expect(result.introduction).toBe(mockPitchOutput.introduction);
    });

    it('should return fallback output for invalid JSON', () => {
      const result = (service as any).parsePitchOutput('invalid json');

      expect(result.introduction).toBe('');
      expect(result.suggestions).toContain(
        'Unable to generate pitch. Please try again.'
      );
    });
  });

  describe('validateOutput', () => {
    it('should validate and normalize output structure', () => {
      const partialData = {
        introduction: 'Test introduction',
      };

      const result = (service as any).validateOutput(partialData);

      expect(result.introduction).toBe('Test introduction');
      expect(result.highlights).toEqual([]);
      expect(result.keywordOverlap.matched).toEqual([]);
      expect(result.keywordOverlap.overlapPercentage).toBe(0);
    });

    it('should handle keywordOverlap as nested object', () => {
      const data = {
        keywordOverlap: {
          matched: ['React', 'JavaScript'],
          missing: ['Node.js'],
          overlapPercentage: 66,
        },
      };

      const result = (service as any).validateOutput(data);

      expect(result.keywordOverlap.matched).toEqual(['React', 'JavaScript']);
      expect(result.keywordOverlap.overlapPercentage).toBe(66);
    });
  });
});
