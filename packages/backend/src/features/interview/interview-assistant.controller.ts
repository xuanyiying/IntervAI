import { AIService } from '@/core/ai/ai.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { JwtPayload } from '@/core/auth/interfaces/jwt-payload.interface';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';

interface ExecuteSkillDto {
  skillName: string;
  inputs: any;
}

@Controller('api/ai/skill')
export class InterviewAssistantController {
  constructor(private readonly aiService: AIService) { }

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  async executeSkill(
    @Body() dto: ExecuteSkillDto,
    @Request() req: { user: JwtPayload }
  ) {
    try {
      const result = await this.aiService.executeSkill(
        dto.skillName,
        dto.inputs,
        req.user.sub
      );

      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to execute skill'
        }
      };
    }
  }
}