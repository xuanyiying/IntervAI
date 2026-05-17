import { Roles } from '@/common/guards/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { InvitationService } from '@/core/invitation/invitation.service';
import { PrismaService } from '@/shared/database/prisma.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly prisma: PrismaService
  ) {}

  // ==================== User Management ====================

  @Get('users')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async listUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a single user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    return user;
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUser(
    @Param('id') id: string,
    @Body()
    body: { username?: string; email?: string; role?: string; status?: string }
  ) {
    const updateData: any = {};
    if (body.username) updateData.username = body.username;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.status) updateData.status = body.status;

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async deleteUser(@Param('id') id: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  // ==================== System Settings ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'System settings' })
  async getSettings() {
    // Get or create default settings
    let settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteName: 'AI Resume Assistant',
          siteDescription: 'AI-powered resume optimization platform',
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: false,
          requireInviteCode: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: 'AI Resume Assistant',
        },
      });
    }

    return settings;
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Body() body: any) {
    let settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteName: body.siteName || 'AI Resume Assistant',
          siteDescription:
            body.siteDescription || 'AI-powered resume optimization platform',
          maintenanceMode: body.maintenanceMode ?? false,
          allowRegistration: body.allowRegistration ?? true,
          requireEmailVerification: body.requireEmailVerification ?? false,
          requireInviteCode: body.requireInviteCode ?? false,
          sessionTimeout: body.sessionTimeout ?? 30,
          maxLoginAttempts: body.maxLoginAttempts ?? 5,
          lockoutDuration: body.lockoutDuration ?? 15,
          smtpHost: body.smtpHost || '',
          smtpPort: body.smtpPort ?? 587,
          smtpUser: body.smtpUser || '',
          smtpPassword: body.smtpPassword || '',
          fromEmail: body.fromEmail || '',
          fromName: body.fromName || 'AI Resume Assistant',
        },
      });
    } else {
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return settings;
  }

  // ==================== Invite Codes ====================

  @Get('invite-codes')
  @ApiOperation({ summary: 'List invitation codes (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of invitation codes' })
  async listInviteCodes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status === 'used') {
      where.isUsed = true;
    } else if (status === 'unused') {
      where.isUsed = false;
    }

    const [codes, total] = await Promise.all([
      this.prisma.invitationCode.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          isUsed: true,
          usedBy: true,
          usedAt: true,
          createdBy: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      this.prisma.invitationCode.count({ where }),
    ]);

    return {
      data: codes,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Post('invite-codes/generate')
  @ApiOperation({ summary: 'Generate invitation codes (Admin only)' })
  @ApiResponse({ status: 201, description: 'Invitation codes generated' })
  async generateInviteCodes(
    @Body() body: { type?: string; count?: number; validDays?: number },
    @Request() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }

    const count = body.count || 1;
    const createdBy = userId;

    return this.invitationService.generateCodes(count, createdBy);
  }

  @Delete('invite-codes/:id')
  @ApiOperation({ summary: 'Delete invitation code (Admin only)' })
  @ApiResponse({ status: 200, description: 'Invitation code deleted' })
  async deleteInviteCode(@Param('id') id: string) {
    await this.prisma.invitationCode.delete({
      where: { id },
    });

    return { message: 'Invitation code deleted successfully' };
  }

  // ==================== Model Config Management ====================

  @Get('models')
  @ApiOperation({ summary: 'List AI model configurations (Admin only)' })
  async listModels(
    @Query('provider') provider?: string,
    @Query('active') active?: string
  ) {
    const where: any = {};
    if (provider) where.provider = provider;
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [models, total] = await Promise.all([
      this.prisma.modelConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          provider: true,
          endpoint: true,
          defaultTemperature: true,
          defaultMaxTokens: true,
          costPerInputToken: true,
          costPerOutputToken: true,
          rateLimitPerMinute: true,
          rateLimitPerDay: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.modelConfig.count({ where }),
    ]);

    return { data: models, total };
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get a model configuration (Admin only)' })
  async getModel(@Param('id') id: string) {
    return this.prisma.modelConfig.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        provider: true,
        endpoint: true,
        defaultTemperature: true,
        defaultMaxTokens: true,
        costPerInputToken: true,
        costPerOutputToken: true,
        rateLimitPerMinute: true,
        rateLimitPerDay: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Post('models')
  @ApiOperation({ summary: 'Create a model configuration (Admin only)' })
  async createModel(
    @Body()
    body: {
      name: string;
      provider: string;
      apiKey: string;
      endpoint?: string;
      defaultTemperature?: number;
      defaultMaxTokens?: number;
      costPerInputToken?: number;
      costPerOutputToken?: number;
      rateLimitPerMinute?: number;
      rateLimitPerDay?: number;
      isActive?: boolean;
    }
  ) {
    return this.prisma.modelConfig.create({ data: body });
  }

  @Patch('models/:id')
  @ApiOperation({ summary: 'Update a model configuration (Admin only)' })
  async updateModel(@Param('id') id: string, @Body() body: any) {
    return this.prisma.modelConfig.update({
      where: { id },
      data: body,
    });
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Delete a model configuration (Admin only)' })
  async deleteModel(@Param('id') id: string) {
    await this.prisma.modelConfig.delete({ where: { id } });
    return { message: 'Model deleted successfully' };
  }

  @Post('models/:id/enable')
  @ApiOperation({ summary: 'Enable a model configuration (Admin only)' })
  async enableModel(@Param('id') id: string) {
    return this.prisma.modelConfig.update({
      where: { id },
      data: { isActive: true },
    });
  }

  @Post('models/:id/disable')
  @ApiOperation({ summary: 'Disable a model configuration (Admin only)' })
  async disableModel(@Param('id') id: string) {
    return this.prisma.modelConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ==================== Prompt Template Management ====================

  @Get('prompts')
  @ApiOperation({ summary: 'List prompt templates (Admin only)' })
  async listPrompts(
    @Query('scenario') scenario?: string,
    @Query('language') language?: string
  ) {
    const where: any = {};
    if (scenario) where.scenario = scenario;
    if (language) where.language = language;

    const [prompts, total] = await Promise.all([
      this.prisma.promptTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 5,
          },
        },
      }),
      this.prisma.promptTemplate.count({ where }),
    ]);

    return { data: prompts, total };
  }

  @Get('prompts/:id')
  @ApiOperation({ summary: 'Get a prompt template (Admin only)' })
  async getPrompt(@Param('id') id: string) {
    return this.prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
      },
    });
  }

  @Post('prompts')
  @ApiOperation({ summary: 'Create a prompt template (Admin only)' })
  async createPrompt(
    @Body()
    body: {
      name: string;
      scenario: string;
      language?: string;
      template: string;
      variables?: string[];
      provider?: string;
      isActive?: boolean;
    }
  ) {
    return this.prisma.promptTemplate.create({ data: body });
  }

  @Patch('prompts/:id')
  @ApiOperation({ summary: 'Update a prompt template (Admin only)' })
  async updatePrompt(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      scenario?: string;
      language?: string;
      template?: string;
      variables?: string[];
      provider?: string;
      isActive?: boolean;
    }
  ) {
    const existing = await this.prisma.promptTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return { error: 'Prompt template not found' };
    }

    const newVersion = existing.version + 1;

    await this.prisma.promptTemplateVersion.create({
      data: {
        templateId: id,
        version: newVersion,
        content: body.template ?? existing.template,
        variables: body.variables ?? existing.variables,
        author: 'admin',
        reason: 'Updated via admin API',
      },
    });

    return this.prisma.promptTemplate.update({
      where: { id },
      data: {
        ...body,
        version: newVersion,
      },
    });
  }

  @Delete('prompts/:id')
  @ApiOperation({ summary: 'Delete a prompt template (Admin only)' })
  async deletePrompt(@Param('id') id: string) {
    await this.prisma.promptTemplate.delete({ where: { id } });
    return { message: 'Prompt template deleted successfully' };
  }

  @Get('prompts/:scenario/versions')
  @ApiOperation({ summary: 'Get version history for a scenario (Admin only)' })
  async getPromptVersions(@Param('scenario') scenario: string) {
    const template = await this.prisma.promptTemplate.findFirst({
      where: { scenario },
    });
    if (!template) {
      return { data: [], total: 0 };
    }

    const versions = await this.prisma.promptTemplateVersion.findMany({
      where: { templateId: template.id },
      orderBy: { version: 'desc' },
    });

    return { data: versions, total: versions.length };
  }

  @Post('prompts/:scenario/rollback')
  @ApiOperation({
    summary: 'Rollback prompt template to a specific version (Admin only)',
  })
  async rollbackPrompt(
    @Param('scenario') scenario: string,
    @Body() body: { version: number }
  ) {
    const template = await this.prisma.promptTemplate.findFirst({
      where: { scenario },
    });
    if (!template) {
      return { error: 'Prompt template not found' };
    }

    const targetVersion = await this.prisma.promptTemplateVersion.findUnique({
      where: {
        templateId_version: {
          templateId: template.id,
          version: body.version,
        },
      },
    });
    if (!targetVersion) {
      return { error: 'Version not found' };
    }

    return this.prisma.promptTemplate.update({
      where: { id: template.id },
      data: {
        template: targetVersion.content,
        variables: targetVersion.variables,
        version: targetVersion.version,
      },
    });
  }
}
