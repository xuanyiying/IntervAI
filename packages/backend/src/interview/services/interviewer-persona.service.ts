import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PersonaStyle } from '@prisma/client';

export interface CreatePersonaDto {
  name: string;
  style: PersonaStyle;
  company?: string;
  position?: string;
  avatarUrl?: string;
  description: string;
  traits: string[];
  questionStyle: Record<string, any>;
  systemPrompt: string;
  isDefault?: boolean;
}

export interface PersonaWithStats {
  id: string;
  name: string;
  style: PersonaStyle;
  company: string | null;
  position: string | null;
  avatarUrl: string | null;
  description: string;
  traits: string[];
  questionStyle: any;
  systemPrompt: string;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InterviewerPersonaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePersonaDto) {
    return this.prisma.interviewerPersona.create({
      data: {
        name: dto.name,
        style: dto.style,
        company: dto.company,
        position: dto.position,
        avatarUrl: dto.avatarUrl,
        description: dto.description,
        traits: dto.traits,
        questionStyle: dto.questionStyle,
        systemPrompt: dto.systemPrompt,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findAll(includeInactive = false): Promise<PersonaWithStats[]> {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.interviewerPersona.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }],
    });
  }

  async findById(id: string): Promise<PersonaWithStats | null> {
    return this.prisma.interviewerPersona.findUnique({
      where: { id },
    });
  }

  async findByStyle(style: PersonaStyle): Promise<PersonaWithStats[]> {
    return this.prisma.interviewerPersona.findMany({
      where: { style, isActive: true },
      orderBy: { usageCount: 'desc' },
    });
  }

  async update(
    id: string,
    dto: Partial<CreatePersonaDto>
  ): Promise<PersonaWithStats> {
    const persona = await this.findById(id);
    if (!persona) {
      throw new NotFoundException(`Persona with ID ${id} not found`);
    }

    return this.prisma.interviewerPersona.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<void> {
    const persona = await this.findById(id);
    if (!persona) {
      throw new NotFoundException(`Persona with ID ${id} not found`);
    }

    await this.prisma.interviewerPersona.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async incrementUsageCount(id: string): Promise<void> {
    await this.prisma.interviewerPersona.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getRecommendedPersona(
    jobDescription?: string,
    resumeData?: any
  ): Promise<PersonaWithStats | null> {
    const personas = await this.findAll();

    if (personas.length === 0) {
      return null;
    }

    if (!jobDescription && !resumeData) {
      return personas.find((p) => p.isDefault) || personas[0];
    }

    const jobLower = (jobDescription || '').toLowerCase();
    const resumeStr = JSON.stringify(resumeData || {}).toLowerCase();

    if (
      jobLower.includes('senior') ||
      jobLower.includes('lead') ||
      jobLower.includes('principal')
    ) {
      const challenging = personas.find(
        (p) => p.style === PersonaStyle.CHALLENGING
      );
      if (challenging) return challenging;
    }

    if (
      jobLower.includes('hr') ||
      jobLower.includes('recruiter') ||
      jobLower.includes('people')
    ) {
      const hr = personas.find((p) => p.style === PersonaStyle.HR);
      if (hr) return hr;
    }

    if (
      jobLower.includes('engineer') ||
      jobLower.includes('developer') ||
      jobLower.includes('architect')
    ) {
      const technical = personas.find(
        (p) => p.style === PersonaStyle.TECHNICAL
      );
      if (technical) return technical;
    }

    if (
      resumeStr.includes('junior') ||
      resumeStr.includes('intern') ||
      resumeStr.includes('entry')
    ) {
      const supportive = personas.find(
        (p) => p.style === PersonaStyle.SUPPORTIVE
      );
      if (supportive) return supportive;
    }

    return personas.find((p) => p.isDefault) || personas[0];
  }

  async getPersonaStats(): Promise<{
    total: number;
    active: number;
    byStyle: Record<string, number>;
    totalUsage: number;
  }> {
    const all = await this.prisma.interviewerPersona.findMany();
    const active = all.filter((p) => p.isActive);

    const byStyle: Record<string, number> = {};
    all.forEach((p) => {
      byStyle[p.style] = (byStyle[p.style] || 0) + 1;
    });

    const totalUsage = all.reduce((sum, p) => sum + p.usageCount, 0);

    return {
      total: all.length,
      active: active.length,
      byStyle,
      totalUsage,
    };
  }
}
