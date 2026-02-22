import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationContextService } from './conversation-context.service';
import { ConversationController } from './conversation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
  imports: [PrismaModule, AIProvidersModule],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationContextService],
  exports: [ConversationService, ConversationContextService],
})
export class ConversationModule {}
