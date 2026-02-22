import { Test, TestingModule } from '@nestjs/testing';
import { InterviewerPersonaService } from './interviewer-persona.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PersonaStyle } from '@prisma/client';

describe('InterviewerPersonaService', () => {
  let service: InterviewerPersonaService;

  const mockPersona = {
    id: 'test-id',
    name: 'Test Persona',
    style: PersonaStyle.TECHNICAL,
    company: 'Test Company',
    position: 'Senior Engineer',
    avatarUrl: 'https://example.com/avatar.png',
    description: 'A test persona',
    traits: ['technical', 'analytical'],
    questionStyle: { focusAreas: ['algorithms'] },
    systemPrompt: 'Test prompt',
    isDefault: false,
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    interviewerPersona: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewerPersonaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InterviewerPersonaService>(InterviewerPersonaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new persona', async () => {
      const createDto = {
        name: 'New Persona',
        style: PersonaStyle.FRIENDLY,
        description: 'A friendly persona',
        traits: ['patient', 'encouraging'],
        questionStyle: { toneStyle: 'encouraging' },
        systemPrompt: 'Be friendly',
      };

      mockPrismaService.interviewerPersona.create.mockResolvedValue({
        ...mockPersona,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(mockPrismaService.interviewerPersona.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          isDefault: false,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all active personas', async () => {
      const mockPersonas = [mockPersona];
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue(
        mockPersonas
      );

      const result = await service.findAll(false);

      expect(result).toEqual(mockPersonas);
      expect(
        mockPrismaService.interviewerPersona.findMany
      ).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
      });
    });

    it('should return all personas including inactive', async () => {
      const mockPersonas = [mockPersona, { ...mockPersona, isActive: false }];
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue(
        mockPersonas
      );

      const result = await service.findAll(true);

      expect(result).toEqual(mockPersonas);
      expect(
        mockPrismaService.interviewerPersona.findMany
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
      });
    });
  });

  describe('findById', () => {
    it('should return a persona by id', async () => {
      mockPrismaService.interviewerPersona.findUnique.mockResolvedValue(
        mockPersona
      );

      const result = await service.findById('test-id');

      expect(result).toEqual(mockPersona);
      expect(
        mockPrismaService.interviewerPersona.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('should return null if persona not found', async () => {
      mockPrismaService.interviewerPersona.findUnique.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByStyle', () => {
    it('should return personas by style', async () => {
      const mockPersonas = [mockPersona];
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue(
        mockPersonas
      );

      const result = await service.findByStyle(PersonaStyle.TECHNICAL);

      expect(result).toEqual(mockPersonas);
      expect(
        mockPrismaService.interviewerPersona.findMany
      ).toHaveBeenCalledWith({
        where: { style: PersonaStyle.TECHNICAL, isActive: true },
        orderBy: { usageCount: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update a persona', async () => {
      const updateDto = { name: 'Updated Name' };
      mockPrismaService.interviewerPersona.findUnique.mockResolvedValue(
        mockPersona
      );
      mockPrismaService.interviewerPersona.update.mockResolvedValue({
        ...mockPersona,
        ...updateDto,
      });

      const result = await service.update('test-id', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.interviewerPersona.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updateDto,
      });
    });

    it('should throw NotFoundException if persona not found', async () => {
      mockPrismaService.interviewerPersona.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should soft delete a persona', async () => {
      mockPrismaService.interviewerPersona.findUnique.mockResolvedValue(
        mockPersona
      );
      mockPrismaService.interviewerPersona.update.mockResolvedValue({
        ...mockPersona,
        isActive: false,
      });

      await service.delete('test-id');

      expect(mockPrismaService.interviewerPersona.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { isActive: false },
      });
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count', async () => {
      mockPrismaService.interviewerPersona.update.mockResolvedValue({
        ...mockPersona,
        usageCount: 1,
      });

      await service.incrementUsageCount('test-id');

      expect(mockPrismaService.interviewerPersona.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { usageCount: { increment: 1 } },
      });
    });
  });

  describe('getRecommendedPersona', () => {
    it('should return default persona if no job description', async () => {
      const defaultPersona = { ...mockPersona, isDefault: true };
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue([
        defaultPersona,
        mockPersona,
      ]);

      const result = await service.getRecommendedPersona();

      expect(result).toEqual(defaultPersona);
    });

    it('should return challenging persona for senior positions', async () => {
      const challengingPersona = {
        ...mockPersona,
        style: PersonaStyle.CHALLENGING,
      };
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue([
        mockPersona,
        challengingPersona,
      ]);

      const result = await service.getRecommendedPersona(
        'Senior Software Engineer position'
      );

      expect(result).not.toBeNull();
      expect(result?.style).toBe(PersonaStyle.CHALLENGING);
    });

    it('should return HR persona for HR positions', async () => {
      const hrPersona = { ...mockPersona, style: PersonaStyle.HR };
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue([
        mockPersona,
        hrPersona,
      ]);

      const result = await service.getRecommendedPersona('HR Manager position');

      expect(result).not.toBeNull();
      expect(result?.style).toBe(PersonaStyle.HR);
    });

    it('should return technical persona for engineering positions', async () => {
      const technicalPersona = {
        ...mockPersona,
        style: PersonaStyle.TECHNICAL,
      };
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue([
        mockPersona,
        technicalPersona,
      ]);

      const result = await service.getRecommendedPersona(
        'Software Engineer position'
      );

      expect(result).not.toBeNull();
      expect(result?.style).toBe(PersonaStyle.TECHNICAL);
    });

    it('should return supportive persona for junior candidates', async () => {
      const supportivePersona = {
        ...mockPersona,
        style: PersonaStyle.SUPPORTIVE,
      };
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue([
        mockPersona,
        supportivePersona,
      ]);

      const result = await service.getRecommendedPersona(undefined, {
        experience: 'junior developer',
      });

      expect(result).not.toBeNull();
      expect(result?.style).toBe(PersonaStyle.SUPPORTIVE);
    });
  });

  describe('getPersonaStats', () => {
    it('should return persona statistics', async () => {
      const mockPersonas = [
        { ...mockPersona, style: PersonaStyle.TECHNICAL, usageCount: 10 },
        { ...mockPersona, style: PersonaStyle.FRIENDLY, usageCount: 5 },
        { ...mockPersona, style: PersonaStyle.TECHNICAL, isActive: false },
      ];
      mockPrismaService.interviewerPersona.findMany.mockResolvedValue(
        mockPersonas
      );

      const result = await service.getPersonaStats();

      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.byStyle[PersonaStyle.TECHNICAL]).toBe(2);
      expect(result.byStyle[PersonaStyle.FRIENDLY]).toBe(1);
      expect(result.totalUsage).toBe(15);
    });
  });
});
