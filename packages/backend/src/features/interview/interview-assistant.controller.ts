import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AIService } from '@/core/ai/ai.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';

interface ExecuteSkillDto {
  skillName: string;
  inputs: any;
}

@Controller('api/ai/skill')
export class InterviewAssistantController {
  constructor(private readonly aiService: AIService) {}

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  async executeSkill(
    @Body() dto: ExecuteSkillDto,
    @Request() req
  ) {
    try {
      const result = await this.aiService.executeSkill(
        dto.skillName,
        dto.inputs,
        req.user.id
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to execute skill'
        }
      };
    }
  }
}