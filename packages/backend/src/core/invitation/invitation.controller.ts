import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate invitation codes (Admin only)' })
  async generate(@Body() body: { count: number; createdBy: string }) {
    return this.invitationService.generateCodes(body.count, body.createdBy);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an invitation code' })
  async validate(@Body() body: { code: string }) {
    const isValid = await this.invitationService.validateCode(body.code);
    return { valid: isValid };
  }
}
