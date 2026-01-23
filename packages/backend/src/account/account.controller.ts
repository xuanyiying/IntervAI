import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AccountService } from './account.service';

@ApiTags('account')
@ApiBearerAuth()
@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get subscription records for current user' })
  async getSubscription(@Request() req: any) {
    return this.accountService.getSubscription(req.user.id);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage stats for current user' })
  async getUsage(
    @Request() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    return this.accountService.getUsage(req.user.id, { start, end });
  }
}

