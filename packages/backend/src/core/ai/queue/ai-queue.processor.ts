import { ChatGateway } from '@/core/chat/chat.gateway';
import { PrismaService } from '@/shared/database/prisma.service';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { MessageRole, ParseStatus } from '@prisma/client';
import { Job } from 'bull';
import { ResumeAIService } from '@/features/resume/services/resume-ai.service';

@Processor('ai-processing')
export class AIQueueProcessor {
  private readonly logger = new Logger(AIQueueProcessor.name);

  constructor(
    private resumeAI: ResumeAIService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway
  ) {}

  @Process({ name: 'resume-parsing', concurrency: 6 })
  async handleResumeParsing(
    job: Job<{
      resumeId: string;
      userId: string;
      content: string;
      conversationId?: string; // 可选的会话 ID
    }>
  ) {
    const { resumeId, userId, content, conversationId } = job.data;
    this.logger.log(
      `Processing resume parsing job for resume ${resumeId} (Job ID: ${job.id})`
    );

    try {
      // 1. Update status to PROCESSING (if not already)
      await this.prisma.resume.update({
        where: { id: resumeId, userId: userId },
        data: { parseStatus: ParseStatus.PROCESSING },
      });

      // Send progress update: Extracting text
      if (conversationId) {
        this.chatGateway.emitToUser(userId, 'system', {
          type: 'system',
          content: '正在提取简历文本...',
          timestamp: Date.now(),
          metadata: { resumeId, stage: 'extracting', progress: 20 },
        });
      }

      // 2. Call AI Engine to parse AND optimize resume in a single call
      // This combines the previous two serial AI calls into one, saving ~50% time and cost
      if (conversationId) {
        this.chatGateway.emitToUser(userId, 'system', {
          type: 'system',
          content: 'AI 正在分析并优化您的简历...',
          timestamp: Date.now(),
          metadata: { resumeId, stage: 'parsing', progress: 40 },
        });
      }

      let parsedData: any;
      let optimizedContent: string | null = null;

      try {
        const result = await this.resumeAI.parseAndOptimizeResume(
          content,
          userId
        );
        parsedData = result.parsedData;
        optimizedContent = result.optimizedContent || null;
        this.logger.log(
          `Resume parsing and optimization completed in single call for resume ${resumeId}`
        );

        // 3. Send optimized content to conversation if conversationId is provided
        if (optimizedContent && conversationId) {
          await this.sendOptimizationToConversation(
            userId,
            conversationId,
            resumeId,
            optimizedContent
          );
        }
      } catch (combinedError) {
        // Fallback: try parse-only if combined call fails
        this.logger.warn(
          `Combined parse+optimize failed for ${resumeId}, falling back to parse-only:`,
          combinedError
        );
        parsedData = await this.resumeAI.parseResumeContent(content, userId);

        // Attempt optimization separately as a non-critical enhancement
        try {
          if (conversationId) {
            this.chatGateway.emitToUser(userId, 'system', {
              type: 'system',
              content: '正在优化简历内容...',
              timestamp: Date.now(),
              metadata: { resumeId, stage: 'optimizing', progress: 70 },
            });
          }
          optimizedContent = await this.resumeAI.optimizeResumeContent(
            content,
            userId
          );
          if (optimizedContent && conversationId) {
            await this.sendOptimizationToConversation(
              userId,
              conversationId,
              resumeId,
              optimizedContent
            );
          }
        } catch (optimizeError) {
          this.logger.warn(
            `Resume optimization also failed for ${resumeId}, continuing with parsed data only:`,
            optimizeError
          );
        }
      }

      // Send progress update: Finalizing
      if (conversationId) {
        this.chatGateway.emitToUser(userId, 'system', {
          type: 'system',
          content: '解析完成，正在同步结果...',
          timestamp: Date.now(),
          metadata: { resumeId, stage: 'finalizing', progress: 95 },
        });
      }

      // 5. Update resume with results (include optimized content if available)
      const updateData: any = {
        parsedData: {
          ...parsedData,
          optimizedContent: optimizedContent,
        },
        extractedText: content, // Save extracted text to top-level field
        parseStatus: ParseStatus.COMPLETED,
        version: { increment: 1 }, // Increment version when completed
      };

      await this.prisma.resume.update({
        where: { id: resumeId, userId: userId },
        data: updateData,
      });

      this.logger.log(
        `Resume parsing and optimization completed for resume ${resumeId}`
      );
      return {
        ...parsedData,
        optimizedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to parse resume ${resumeId}:`, error);

      // Update status to FAILED
      await this.prisma.resume.update({
        where: { id: resumeId, userId: userId },
        data: { parseStatus: ParseStatus.FAILED },
      });

      throw error;
    }
  }

  /**
   * Handle sending cached optimization result to conversation
   */
  @Process({ name: 'send-optimization', concurrency: 6 })
  async handleSendOptimization(
    job: Job<{
      userId: string;
      conversationId: string;
      resumeId: string;
      optimizedContent: string;
    }>
  ) {
    const { userId, conversationId, resumeId, optimizedContent } = job.data;
    this.logger.log(
      `Processing send optimization job for resume ${resumeId} to conversation ${conversationId} (Job ID: ${job.id})`
    );

    await this.sendOptimizationToConversation(
      userId,
      conversationId,
      resumeId,
      optimizedContent
    );

    return { success: true };
  }

  /**
   * Send optimization result to conversation
   */
  private async sendOptimizationToConversation(
    userId: string,
    conversationId: string,
    resumeId: string,
    optimizedContent: string
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending optimization result to conversation ${conversationId}`
      );

      // Generate tips based on content
      const tips = this.generateOptimizationTips(optimizedContent);
      const finalContent = optimizedContent + tips;

      // Save message to database
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          userId,
          role: MessageRole.ASSISTANT,
          content: finalContent,
          metadata: {
            type: 'optimization_result',
            resumeId,
            optimizedContent,
            source: 'auto_optimization',
          },
        },
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });

      // Broadcast to user's connected clients via WebSocket
      this.chatGateway.emitToUser(userId, 'message', {
        type: 'message',
        messageId: message.id,
        content: finalContent,
        role: MessageRole.ASSISTANT,
        timestamp: Date.now(),
        metadata: {
          type: 'optimization_result',
          resumeId,
          optimizedContent,
          source: 'auto_optimization',
        },
      });

      this.logger.log(
        `Optimization result sent to conversation ${conversationId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send optimization to conversation: ${error instanceof Error ? error.message : String(error)}`
      );
      // Don't throw - optimization message is not critical
    }
  }

  /**
   * Generate optimization tips based on content
   */
  private generateOptimizationTips(content: string): string {
    const sections = [
      {
        key: '基本信息',
        tip: '✅ 已优化基本信息，增强了个人联系方式的排版',
      },
      {
        key: '专业总结',
        tip: '✅ 已优化专业总结，提升了核心竞争力的表达',
      },
      {
        key: '工作经历',
        tip: '✅ 已优化工作经历，强化了量化成果和技术关键词',
      },
      {
        key: '教育背景',
        tip: '✅ 已优化教育背景，整理了学术成就和荣誉',
      },
      {
        key: '项目经验',
        tip: '✅ 已优化项目经验，突出了个人在项目中的核心贡献',
      },
      {
        key: '技能列表',
        tip: '✅ 已优化技能列表，按专业类别进行了结构化分类',
      },
    ];

    const activeTips: string[] = [];
    sections.forEach((section) => {
      if (content.includes(section.key)) {
        activeTips.push(section.tip);
      }
    });

    if (activeTips.length === 0) return '';

    return (
      '\n\n---\n' +
      activeTips.join('\n') +
      '\n\n**✨ 简历自动优化完成！您可以点击下方按钮查看对比或下载结果。**'
    );
  }
}
