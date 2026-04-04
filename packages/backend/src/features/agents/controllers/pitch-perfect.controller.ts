import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { PitchPerfectService, PitchPerfectOutput, RefinePitchOutput } from '../services/pitch-perfect.service';
import { GeneratePitchDto, RefinePitchDto } from '../dto/pitch-perfect.dto';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents/pitch-perfect')
@UseGuards(JwtAuthGuard)
export class PitchPerfectController {
  constructor(private readonly pitchPerfectService: PitchPerfectService) {}

  @Post('generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate elevator pitch based on resume and job description' })
  @ApiResponse({ status: 200, description: 'Pitch generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async generatePitch(
    @Request() req: any,
    @Body() dto: GeneratePitchDto,
  ): Promise<PitchPerfectOutput> {
    return this.pitchPerfectService.generatePitch(dto, req.user.id);
  }

  @Post('refine')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refine existing pitch based on user feedback' })
  @ApiResponse({ status: 200, description: 'Pitch refined successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refinePitch(
    @Request() req: any,
    @Body() dto: RefinePitchDto,
  ): Promise<RefinePitchOutput> {
    return this.pitchPerfectService.refinePitch(dto, req.user.id);
  }
}
