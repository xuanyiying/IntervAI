import { Injectable } from '@nestjs/common';
import { RedisService } from '@/redis/redis.service';
import { AgentRole, AgentCapability } from '@/agent/team';
import { Task, TaskResult, TaskType } from '@/agent/team';
import { BaseWorkerAgent } from '@/agent/team';
import { RAGService } from '@/agent/services';

const RETRIEVAL_WORKER_ID = 'retrieval-worker-001';

@Injectable()
export class RetrievalWorker extends BaseWorkerAgent {
  readonly id = RETRIEVAL_WORKER_ID;
  readonly role = AgentRole.RETRIEVAL_WORKER;
  readonly maxConcurrentTasks = 5;

  readonly capabilities: AgentCapability[] = [
    {
      name: 'rag_query',
      description: 'Query knowledge base using RAG',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          topK: { type: 'number' },
        },
      },
    },
    {
      name: 'document_search',
      description: 'Search for relevant documents',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          filters: { type: 'object' },
        },
      },
    },
    {
      name: 'context_retrieval',
      description: 'Retrieve context for a given topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          depth: { type: 'number' },
        },
      },
    },
  ];

  constructor(
    private readonly ragService: RAGService,
    redisService: RedisService
  ) {
    super(redisService);
  }

  async execute(task: Task): Promise<TaskResult> {
    this.logger.log(`Retrieval Worker executing task: ${task.id}`);
    this.currentTaskCount++;

    const startTime = Date.now();

    try {
      let result: Record<string, any>;

      switch (task.type) {
        case TaskType.RAG_QUERY:
          result = await this.executeRAGQuery(task.input.data);
          break;

        default:
          result = await this.executeGenericRetrieval(task.input.data);
      }

      const taskResult = this.createSuccessResult(
        task,
        result,
        Date.now() - startTime
      );

      await this.reportResult(taskResult);

      return taskResult;
    } catch (error) {
      const taskResult = this.createErrorResult(
        task,
        error instanceof Error ? error : new Error(String(error)),
        Date.now() - startTime
      );

      await this.reportResult(taskResult);

      return taskResult;
    }
  }

  private async executeRAGQuery(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { query, topK = 5, filters } = data;

    if (!query) {
      throw new Error('Query is required for RAG retrieval');
    }

    try {
      const results = await this.ragService.retrieve(query, topK);

      return {
        query,
        results: results || [],
        metadata: {
          totalResults: results?.length || 0,
          retrievalTime: Date.now(),
        },
      };
    } catch (error) {
      this.logger.warn(
        `RAG query failed, returning empty results: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        query,
        results: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          totalResults: 0,
          retrievalTime: Date.now(),
        },
      };
    }
  }

  private async executeGenericRetrieval(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const { query, type } = data;

    return {
      query,
      type,
      results: [],
      metadata: {
        retrievedAt: new Date(),
        note: 'Generic retrieval - implement specific retrieval logic',
      },
    };
  }
}
