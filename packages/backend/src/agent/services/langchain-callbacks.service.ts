import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { Logger } from '@nestjs/common';
import { UsageTrackerService } from '@/ai-providers/tracking/usage-tracker.service';
import { PerformanceMonitorService } from '@/ai-providers/monitoring/performance-monitor.service';
import { LLMResult } from '@langchain/core/outputs';
import { Serialized } from '@langchain/core/load/serializable';

/**
 * Advanced LangChain Callback Handler (Middleware)
 * Extends LangChain lifecycle to project-specific services:
 * - Real-time usage tracking (tokens/cost)
 * - Performance monitoring (latency)
 * - Structured auditing
 */
export class ProjectCallbackHandler extends BaseCallbackHandler {
  name = 'project_callback_handler';
  private readonly logger = new Logger('LangChainMiddleware');
  private readonly runStartTimes: Map<string, number> = new Map();
  private readonly chainStartTimes: Map<string, number> = new Map();
  private readonly toolExecutionCount: Map<string, number> = new Map();
  private rootChainRunId: string | null = null;

  constructor(
    private readonly userId: string,
    private readonly scenario: string,
    private readonly usageTracker: UsageTrackerService,
    private readonly performanceMonitor: PerformanceMonitorService,
    private readonly metadata?: Record<string, any>
  ) {
    super();
  }

  /**
   * Called when an LLM starts running
   */
  async handleLLMStart(
    _llm: Serialized,
    _prompts: string[],
    runId: string,
    parentRunId?: string,
    _extraParams?: Record<string, any>,
    _tags?: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    this.runStartTimes.set(runId, Date.now());
    this.logger.debug(
      `[LLM Start] RunID: ${runId}, ParentID: ${parentRunId || 'root'}, Model: ${metadata?.model_name || 'unknown'}`
    );
  }

  /**
   * Called when an LLM finishes running
   */
  async handleLLMEnd(
    output: LLMResult,
    runId: string,
    parentRunId?: string,
    _tags?: string[]
  ): Promise<void> {
    const startTime = this.runStartTimes.get(runId) || Date.now();
    const duration = Date.now() - startTime;
    this.runStartTimes.delete(runId);

    const { llmOutput } = output;

    // Capture token usage if available in the LLM response
    const tokenUsage = llmOutput?.tokenUsage || llmOutput?.usage || {};
    const modelName =
      llmOutput?.model_name || this.metadata?.modelName || 'langchain-model';

    this.logger.log(
      `[LLM End] RunID: ${runId}, Duration: ${duration}ms, Tokens: ${tokenUsage.totalTokens || 0}`
    );

    // Track usage in our project services
    if (tokenUsage.totalTokens) {
      try {
        await this.usageTracker.recordUsage({
          userId: this.userId,
          model: modelName,
          provider: 'langchain-adapter',
          scenario: this.scenario,
          inputTokens: tokenUsage.promptTokens || 0,
          outputTokens: tokenUsage.completionTokens || 0,
          cost: 0, // In a real scenario, we'd calculate this based on model tier
          latency: duration,
          success: true,
          agentType: this.metadata?.agentType || null,
          workflowStep: runId,
          errorCode: null,
        });

        await this.performanceMonitor.recordMetrics(
          modelName,
          'langchain',
          duration,
          true
        );
      } catch (error) {
        this.logger.error(`Failed to record usage in middleware: ${error}`);
      }
    }
  }

  /**
   * Called when an LLM errors
   */
  async handleLLMError(
    err: Error,
    runId: string,
    parentRunId?: string,
    _tags?: string[]
  ): Promise<void> {
    const startTime = this.runStartTimes.get(runId) || Date.now();
    const duration = Date.now() - startTime;
    this.runStartTimes.delete(runId);

    this.logger.error(`[LLM Error] RunID: ${runId}, Error: ${err.message}`);

    await this.performanceMonitor.recordMetrics(
      'langchain-model',
      'langchain',
      duration,
      false
    );
  }

  /**
   * Called when a chain starts
   */
  async handleChainStart(
    chain: Serialized,
    _inputs: Record<string, any>,
    runId: string,
    parentRunId?: string
  ): Promise<void> {
    this.chainStartTimes.set(runId, Date.now());

    // Track root chain for agent duration calculation
    if (!parentRunId) {
      this.rootChainRunId = runId;
    }

    const chainName = chain.id?.[chain.id.length - 1] || 'unknown';
    this.logger.debug(`[Chain Start] Chain: ${chainName}, RunID: ${runId}`);
  }

  /**
   * Called when a chain ends
   */
  async handleChainEnd(
    _outputs: Record<string, any>,
    runId: string
  ): Promise<void> {
    const startTime = this.chainStartTimes.get(runId);
    const duration = startTime ? Date.now() - startTime : 0;
    this.chainStartTimes.delete(runId);

    this.logger.debug(`[Chain End] RunID: ${runId}, Duration: ${duration}ms`);

    // Record chain performance metrics
    if (duration > 0) {
      try {
        await this.performanceMonitor.recordMetrics(
          'chain-execution',
          'langchain',
          duration,
          true
        );
      } catch (error) {
        this.logger.error('Failed to record chain performance', {
          runId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Called when a tool starts running
   */
  async handleToolStart(
    tool: Serialized,
    _input: string,
    runId: string
  ): Promise<void> {
    this.runStartTimes.set(runId, Date.now());
    this.logger.debug(
      `[Tool Start] Tool: ${tool.id?.[tool.id.length - 1] || 'unknown'}, RunID: ${runId}`
    );
  }

  /**
   * Called when a tool ends running
   */
  async handleToolEnd(output: string, runId: string): Promise<void> {
    const startTime = this.runStartTimes.get(runId) || Date.now();
    const duration = Date.now() - startTime;
    this.runStartTimes.delete(runId);

    // Increment tool execution count
    const currentCount = this.toolExecutionCount.get(runId) || 0;
    this.toolExecutionCount.set(runId, currentCount + 1);

    this.logger.debug(`[Tool End] RunID: ${runId}, Duration: ${duration}ms`);

    try {
      // Record performance metrics
      await this.performanceMonitor.recordMetrics(
        'tool-execution',
        'langchain',
        duration,
        true
      );

      // Record tool usage for tracking
      await this.usageTracker.recordUsage({
        userId: this.userId,
        model: 'tool-execution',
        provider: 'langchain-adapter',
        scenario: this.scenario,
        inputTokens: 0,
        outputTokens: output?.length || 0,
        cost: 0,
        latency: duration,
        success: true,
        agentType: this.metadata?.agentType || null,
        workflowStep: `tool-${runId}`,
        errorCode: null,
      });
    } catch (error) {
      this.logger.error('Failed to record tool performance', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async handleToolError(err: Error, runId: string): Promise<void> {
    const startTime = this.runStartTimes.get(runId) || Date.now();
    const duration = Date.now() - startTime;
    this.runStartTimes.delete(runId);

    this.logger.error('[Tool Error]', {
      runId,
      error: err.message,
      duration,
    });

    try {
      await this.performanceMonitor.recordMetrics(
        'tool-execution',
        'langchain',
        duration,
        false
      );

      // Record failed tool usage for error tracking
      await this.usageTracker.recordUsage({
        userId: this.userId,
        model: 'tool-execution',
        provider: 'langchain-adapter',
        scenario: this.scenario,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        latency: duration,
        success: false,
        agentType: this.metadata?.agentType || null,
        workflowStep: `tool-error-${runId}`,
        errorCode: err.name || 'TOOL_ERROR',
      });
    } catch (error) {
      this.logger.error('Failed to record tool error', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Called when an agent action is received
   */
  async handleAgentAction(action: any, runId: string): Promise<void> {
    this.logger.log(`[Agent Action] Tool: ${action.tool}, RunID: ${runId}`);
    // We could track specific tool usage counts here if needed via UsageTrackerService
  }

  async handleAgentEnd(_finish: any, runId: string): Promise<void> {
    // Calculate agent duration from root chain start time
    let duration = 0;
    if (this.rootChainRunId) {
      const chainStartTime = this.chainStartTimes.get(this.rootChainRunId);
      if (chainStartTime) {
        duration = Date.now() - chainStartTime;
      }
    }

    // Get total tool execution count for this session
    const totalToolExecutions = Array.from(
      this.toolExecutionCount.values()
    ).reduce((sum, count) => sum + count, 0);

    this.logger.log('[Agent End]', {
      runId,
      duration,
      toolExecutions: totalToolExecutions,
    });

    try {
      // Record usage for the final agent result with proper duration
      await this.usageTracker.recordUsage({
        userId: this.userId,
        model: 'agent-orchestrator',
        provider: 'langchain-adapter',
        scenario: this.scenario,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        latency: duration,
        success: true,
        agentType: this.metadata?.agentType || null,
        workflowStep: 'agent-complete',
        errorCode: null,
      });

      // Record agent performance metrics
      if (duration > 0) {
        await this.performanceMonitor.recordMetrics(
          'agent-orchestrator',
          'langchain',
          duration,
          true
        );
      }
    } catch (error) {
      this.logger.error('Failed to record agent end usage', {
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Clean up tracking state for this agent session
    this.toolExecutionCount.clear();
    this.rootChainRunId = null;
  }
}
