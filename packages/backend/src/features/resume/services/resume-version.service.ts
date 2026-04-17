import { PrismaService } from '@/shared/database/prisma.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class ResumeVersionService {
  private readonly logger = new Logger(ResumeVersionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createVersion(
    resumeId: string,
    data: Record<string, any>,
    label: string = 'Optimized'
  ) {
    const latestVersion = await this.getLatestVersion(resumeId);
    const newVersion = (latestVersion?.version ?? 0) + 1;

    const version = await this.prisma.resumeVersion.create({
      data: {
        resumeId,
        version: newVersion,
        label: `${label} v${newVersion}`,
        personalInfo: data.personalInfo ?? {},
        summary: data.summary ?? null,
        education: data.education ?? [],
        experience: data.experience ?? [],
        skills: data.skills ?? [],
        projects: data.projects ?? [],
        certifications: data.certifications ?? null,
        languages: data.languages ?? null,
        markdown: data.markdown ?? null,
      },
    });

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { currentVersionId: version.id },
    });

    this.logger.log(
      `Created resume version ${newVersion} for resume ${resumeId}`
    );
    return version;
  }

  async createOriginalVersion(resumeId: string, parsedData: any) {
    return this.createVersion(resumeId, parsedData, 'Original');
  }

  async getVersions(resumeId: string) {
    return this.prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });
  }

  async getCurrentVersion(resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      select: { currentVersionId: true },
    });

    if (!resume?.currentVersionId) {
      return this.getLatestVersion(resumeId);
    }

    return this.prisma.resumeVersion.findUnique({
      where: { id: resume.currentVersionId },
    });
  }

  async getLatestVersion(resumeId: string) {
    return this.prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { version: 'desc' },
    });
  }

  async getVersionById(versionId: string) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return version;
  }

  async restoreVersion(resumeId: string, versionId: string) {
    const version = await this.getVersionById(versionId);

    if (version.resumeId !== resumeId) {
      throw new NotFoundException('Version does not belong to this resume');
    }

    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        currentVersionId: version.id,
        parsedData: {
          personalInfo: version.personalInfo,
          summary: version.summary,
          education: version.education,
          experience: version.experience,
          skills: version.skills,
          projects: version.projects,
          certifications: version.certifications,
          languages: version.languages,
        },
      },
    });

    this.logger.log(
      `Restored resume ${resumeId} to version ${version.version}`
    );
    return version;
  }

  async applySuggestions(
    resumeId: string,
    suggestions: Array<{
      section: string;
      itemIndex?: number;
      original: string;
      optimized: string;
    }>
  ) {
    const currentVersion = await this.getCurrentVersion(resumeId);
    if (!currentVersion) {
      throw new NotFoundException('No current version found');
    }

    const updatedData: any = {
      personalInfo: currentVersion.personalInfo,
      summary: currentVersion.summary,
      education: currentVersion.education
        ? JSON.parse(JSON.stringify(currentVersion.education))
        : [],
      experience: currentVersion.experience
        ? JSON.parse(JSON.stringify(currentVersion.experience))
        : [],
      skills: currentVersion.skills
        ? JSON.parse(JSON.stringify(currentVersion.skills))
        : [],
      projects: currentVersion.projects
        ? JSON.parse(JSON.stringify(currentVersion.projects))
        : [],
      certifications: currentVersion.certifications,
      languages: currentVersion.languages,
    };

    for (const sug of suggestions) {
      if (sug.section === 'experience' && sug.itemIndex !== undefined) {
        if (
          Array.isArray(updatedData.experience) &&
          updatedData.experience[sug.itemIndex]
        ) {
          const exp = updatedData.experience[sug.itemIndex];
          if (
            typeof exp === 'object' &&
            exp.description &&
            exp.description.includes(sug.original)
          ) {
            exp.description = exp.description.replace(
              sug.original,
              sug.optimized
            );
          }
        }
      } else if (sug.section === 'projects' && sug.itemIndex !== undefined) {
        if (
          Array.isArray(updatedData.projects) &&
          updatedData.projects[sug.itemIndex]
        ) {
          const proj = updatedData.projects[sug.itemIndex];
          if (
            typeof proj === 'object' &&
            proj.description &&
            proj.description.includes(sug.original)
          ) {
            proj.description = proj.description.replace(
              sug.original,
              sug.optimized
            );
          }
        }
      } else if (sug.section === 'skills') {
        if (Array.isArray(updatedData.skills)) {
          const idx = updatedData.skills.indexOf(sug.original);
          if (idx !== -1) {
            updatedData.skills[idx] = sug.optimized;
          }
        }
      } else if (sug.section === 'summary') {
        if (
          updatedData.summary &&
          typeof updatedData.summary === 'string' &&
          updatedData.summary.includes(sug.original)
        ) {
          updatedData.summary = updatedData.summary.replace(
            sug.original,
            sug.optimized
          );
        }
      }
    }

    return this.createVersion(resumeId, updatedData, 'Applied');
  }

  async deleteVersions(resumeId: string) {
    return this.prisma.resumeVersion.deleteMany({
      where: { resumeId },
    });
  }
}
