import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
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
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.accountService.getSubscription(userId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage stats for current user' })
  async getUsage(
    @Request() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.accountService.getUsage(userId, { start, end });
  }
}
