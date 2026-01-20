import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AIQueueService } from './ai-queue.service';
import { AIQueueProcessor } from './ai-queue.processor';
import { AIModule } from '../ai.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-processing',
      limiter: {
        max: 30,
        duration: 60000,
      },
    }),
    AIModule,
    PrismaModule,
    forwardRef(() => ChatModule),
  ],
  providers: [AIQueueService, AIQueueProcessor],
  exports: [AIQueueService],
})
export class AIQueueModule {}
