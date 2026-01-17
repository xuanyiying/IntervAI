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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InvitationService } from '@/invitation/invitation.service';
import { PrismaService } from '@/prisma/prisma.service';

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
    const count = body.count || 1;
    const createdBy = req.user.id;

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
}
