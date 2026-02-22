import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InterviewerPersonaService } from './services/interviewer-persona.service';
import { CreatePersonaDto, UpdatePersonaDto } from './dto/persona.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/user/guards/roles.guard';
import { Roles } from '@/user/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('interviewer-personas')
@UseGuards(JwtAuthGuard)
export class InterviewerPersonaController {
  constructor(private readonly personaService: InterviewerPersonaService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.personaService.findAll(include);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getStats() {
    return this.personaService.getPersonaStats();
  }

  @Get('recommended')
  async getRecommended(
    @Query('jobDescription') jobDescription?: string,
    @Query('resumeData') resumeData?: string
  ) {
    const resume = resumeData ? JSON.parse(resumeData) : undefined;
    return this.personaService.getRecommendedPersona(jobDescription, resume);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.personaService.findById(id);
  }

  @Get('style/:style')
  async findByStyle(@Param('style') style: string) {
    return this.personaService.findByStyle(style as any);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreatePersonaDto) {
    return this.personaService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdatePersonaDto) {
    return this.personaService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    await this.personaService.delete(id);
    return { success: true };
  }
}
