import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationContextService } from './conversation-context.service';
import { ConversationController } from './conversation.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { AIModule } from '@/core/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationContextService],
  exports: [ConversationService, ConversationContextService],
})
export class ConversationModule {}
