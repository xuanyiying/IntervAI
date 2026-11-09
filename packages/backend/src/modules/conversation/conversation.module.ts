import { Module } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { ConversationContextService } from './services/conversation-context.service';
import { ConversationController } from './controllers/conversation.controller';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { AIModule } from '@/modules/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationContextService],
  exports: [ConversationService, ConversationContextService],
})
export class ConversationModule {}
