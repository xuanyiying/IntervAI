import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { InvitationService } from '../invitation/invitation.service';
import { PrismaService } from '../prisma/prisma.service';

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
    @Body() body: { count: number },
    @Request() req: any
  ) {
    const { count } = body;
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
