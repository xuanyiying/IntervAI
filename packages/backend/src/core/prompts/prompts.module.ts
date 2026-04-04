/**
 * Prompts Module
 * Centralized prompt management with multi-language support
 */

import { Global, Module } from '@nestjs/common';
import { PromptService } from './prompt.service';

@Global()
@Module({
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptsModule {}