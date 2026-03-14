     AI Provider & Agent 重构计划

     用户决策确认

     1. Provider策略: 统一使用 OpenAI SDK，通过 baseUrl 切换不同 provider
     2. 场景选择: 简化为配置，业务代码直接指定 model
     3. Team/Workflow系统: 保留但禁用（标记为deprecated）
     4. 兼容策略: 直接替换，不保留旧API

     Context

     当前 ai-provider 和 agent 模块架构过度复杂，存在以下问题：

     1. ai-provider 模块 (~70个文件)：
       - 7层子目录 (interfaces, config, utils, providers, factory, selector, tracking, monitoring, logging, security)
       - 8个独立provider实现 (OpenAI, Qwen, DeepSeek, Gemini, Ollama, SiliconCloud)
       - 复杂的模型选择策略 (ModelSelector, ScenarioModelMapping, ModelRegistry)
       - AIEngineService 有 8 个依赖注入
     2. agent 模块 (~65个文件)：
       - 多个抽象层 (agents, tools, workflows, services, adapters, team)
       - LangChain集成复杂 (custom-llm.adapter, custom-memory.adapter, custom-vector-store.adapter)
       - Team系统 (leader.agent, workers, communication, monitoring) 未被业务使用
       - 多个重复的orchestrator (agent-orchestrator, workflow-orchestrator, lcel-workflow-orchestrator)
     3. 核心问题：
       - 过度工程化：为"未来可能"的需求设计了复杂的抽象
       - 层级太深：简单的AI调用需要经过5+层
       - 维护成本高：修改一个功能需要改动多个文件
       - Skills扩展困难：没有统一的扩展机制

     目标

     1. 简化架构，减少50%+的代码量
     2. 支持Skills扩展机制，允许动态注册能力
     3. 保持核心功能不变
     4. 提高可维护性和可测试性

     核心业务场景（需要保留）

     通过代码分析，识别出以下真实业务场景：

     1. Resume优化 (resume-optimizer.service.ts)
       - AI生成优化建议
       - 场景：RESUME_OPTIMIZATION
     2. Match分析 (match-analysis.service.ts)
       - 简历与JD匹配度分析
       - 使用embedding进行相似度计算
     3. 面试问题生成 (question-generator.service.ts, strategist.agent.ts)
       - 基于简历+JD生成定制问题
       - 场景：AGENT_CUSTOM_QUESTION_GENERATION
     4. 面试模拟 (interview-session.service.ts, role-play.agent.ts)
       - 模拟面试官对话
       - 实时反馈
     5. 回答评估 (answer-evaluation.service.ts, pitch-perfect.agent.ts)
       - 评估面试回答质量
       - 提供改进建议
     6. Chat对话 (chat模块)
       - 通用AI对话
       - 场景：GENERAL

     新架构设计

     目录结构

     packages/backend/src/core/ai/
     ├── ai.module.ts                 # NestJS模块
     ├── ai.service.ts                # 统一入口服务（合并AIEngineService）
     ├── types.ts                     # 所有类型定义
     │
     ├── providers/                   # Provider实现
     │   ├── base.provider.ts         # 基类（OpenAI兼容）
     │   ├── openai.provider.ts
     │   ├── deepseek.provider.ts
     │   ├── qwen.provider.ts
     │   ├── gemini.provider.ts
     │   ├── ollama.provider.ts
     │   └── index.ts
     │
     ├── skills/                      # Skills扩展系统
     │   ├── skill.interface.ts       # Skill接口定义
     │   ├── skill-registry.ts        # Skill注册中心
     │   ├── skills/                  # 内置Skills
     │   │   ├── resume-analyzer.skill.ts
     │   │   ├── jd-matcher.skill.ts
     │   │   ├── interview-coach.skill.ts
     │   │   ├── answer-evaluator.skill.ts
     │   │   └── rag-retrieval.skill.ts
     │   └── index.ts
     │
     ├── memory/                      # 对话记忆
     │   ├── memory.interface.ts
     │   ├── redis-memory.ts
     │   └── index.ts
     │
     └── utils/                       # 工具函数
         ├── retry.ts
         ├── embedding.ts
         └── index.ts

     Provider实现（统一OpenAI SDK）

     根据用户选择：所有provider统一使用 OpenAI SDK，通过 baseUrl 切换

     // providers/provider.ts
     import OpenAI from 'openai';

     export class AIProvider {
       private clients: Map<string, OpenAI> = new Map();

       constructor(configs: Record<string, { apiKey: string; baseUrl?: string }>) {
         for (const [name, cfg] of Object.entries(configs)) {
           if (cfg.apiKey) {
             this.clients.set(name, new OpenAI({
               apiKey: cfg.apiKey,
               baseURL: cfg.baseUrl || PROVIDER_BASE_URLS[name],
             }));
           }
         }
       }

       getClient(provider: string): OpenAI {
         const client = this.clients.get(provider);
         if (!client) throw new Error(`Provider ${provider} not configured`);
         return client;
       }
     }

     // 预定义的provider baseUrl
     export const PROVIDER_BASE_URLS = {
       openai: 'https://api.openai.com/v1',
       deepseek: 'https://api.deepseek.com/v1',
       qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
       gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
       ollama: 'http://localhost:11434/v1',
       siliconcloud: 'https://api.siliconflow.cn/v1',
     };

     模型配置（简化为配置）

     根据用户选择：删除复杂的场景选择策略，业务代码直接指定 model

     // config/models.ts
     export const Models = {
       // 默认模型 - 可通过环境变量覆盖
       Chat: process.env.AI_CHAT_MODEL || 'openai:gpt-4o-mini',
       ChatPro: process.env.AI_CHAT_PRO_MODEL || 'openai:gpt-4o',
       Embedding: process.env.AI_EMBEDDING_MODEL || 'openai:text-embedding-3-small',

       // 业务场景专用（可选覆盖）
       ResumeOptimization: process.env.AI_RESUME_MODEL || 'openai:gpt-4o',
       InterviewChat: process.env.AI_INTERVIEW_MODEL || 'openai:gpt-4o-mini',
     };

     // 使用示例
     // await ai.chat(Models.Chat, messages);
     // await ai.chat(Models.ResumeOptimization, messages);

     AIService 完整实现

     // ai.service.ts
     @Injectable()
     export class AIService implements OnModuleInit {
       private provider: AIProvider;
       private skills: Map<string, Skill> = new Map();

       constructor(
         private configService: ConfigService,
         private prisma: PrismaService,      // 用于usage tracking
         private redis: RedisService,         // 用于caching & memory
       ) {}

       async onModuleInit() {
         // 初始化providers
         this.provider = new AIProvider({
           openai: { apiKey: this.configService.get('OPENAI_API_KEY') },
           deepseek: { apiKey: this.configService.get('DEEPSEEK_API_KEY') },
           qwen: { apiKey: this.configService.get('QWEN_API_KEY') },
           gemini: { apiKey: this.configService.get('GEMINI_API_KEY') },
           ollama: { apiKey: 'ollama', baseUrl: 'http://localhost:11434/v1' },
         });

         // 注册内置skills
         this.registerBuiltInSkills();
       }

       // 核心方法
       async chat(model: string, messages: AIMessage[], options?: ChatOptions): Promise<AIResult> {
         const [provider, modelName] = this.parseModel(model);
         const client = this.provider.getClient(provider);

         const response = await client.chat.completions.create({
           model: modelName,
           messages: this.formatMessages(messages),
           temperature: options?.temperature ?? 0.7,
           max_tokens: options?.maxTokens,
           stream: false,
         });

         // 记录usage
         await this.trackUsage(model, response.usage, options?.userId);

         return {
           content: response.choices[0].message.content,
           usage: { input: response.usage.prompt_tokens, output: response.usage.completion_tokens },
         };
       }

       // 流式输出
       async *stream(model: string, messages: AIMessage[], options?: ChatOptions): AsyncGenerator<string> {
         const [provider, modelName] = this.parseModel(model);
         const client = this.provider.getClient(provider);

         const stream = await client.chat.completions.create({
           model: modelName,
           messages: this.formatMessages(messages),
           temperature: options?.temperature ?? 0.7,
           stream: true,
         });

         for await (const chunk of stream) {
           const content = chunk.choices[0]?.delta?.content;
           if (content) yield content;
         }
       }

       // Embedding
       async embed(model: string, text: string): Promise<number[]> {
         const [provider, modelName] = this.parseModel(model);
         const client = this.provider.getClient(provider);

         const response = await client.embeddings.create({
           model: modelName,
           input: text,
         });

         return response.data[0].embedding;
       }

       // Skill执行
       async executeSkill(name: string, inputs: any, userId: string): Promise<any> {
         const skill = this.skills.get(name);
         if (!skill) throw new Error(`Skill ${name} not found`);

         return skill.execute({
           ai: this,
           memory: new RedisMemory(this.redis, `${name}:${userId}`),
           inputs,
           userId,
         });
       }

       // Skill注册
       registerSkill(skill: Skill): void {
         this.skills.set(skill.name, skill);
       }

       private parseModel(model: string): [string, string] {
         const idx = model.indexOf(':');
         return [model.slice(0, idx), model.slice(idx + 1)];
       }
     }

     Skills 系统实现

     // skills/skill.interface.ts
     export interface Skill {
       name: string;
       description: string;
       execute(ctx: SkillContext): Promise<any>;
     }

     export interface SkillContext {
       ai: AIService;
       memory: Memory;
       inputs: any;
       userId: string;
     }

     // skills/skills/resume-analyzer.skill.ts
     @Injectable()
     export class ResumeAnalyzerSkill implements Skill {
       name = 'resume-analyzer';
       description = '解析简历并提取结构化信息';

       async execute(ctx: SkillContext): Promise<ParsedResume> {
         const { ai, inputs } = ctx;
         const { resumeText } = inputs;

         const result = await ai.chat(Models.ChatPro, [
           { role: 'system', content: RESUME_PARSER_PROMPT },
           { role: 'user', content: resumeText },
         ]);

         return JSON.parse(result.content);
       }
     }

     // skills/skills/interview-coach.skill.ts
     @Injectable()
     export class InterviewCoachSkill implements Skill {
       name = 'interview-coach';
       description = '生成定制化面试问题';

       async execute(ctx: SkillContext): Promise<InterviewQuestions> {
         const { ai, memory, inputs, userId } = ctx;
         const { resumeData, jobDescription, experienceLevel } = inputs;

         // 1. 分析上下文
         const analysis = await this.analyzeContext(ai, resumeData, jobDescription);

         // 2. 从知识库检索常见问题
         const commonQuestions = await ai.executeSkill('rag-retrieval', {
           keywords: analysis.keywords,
           type: 'interview-questions',
         }, userId);

         // 3. 生成定制问题
         const customQuestions = await this.generateCustom(ai, resumeData, jobDescription, analysis);

         // 4. 合并和排序
         return this.prioritize([...commonQuestions, ...customQuestions], analysis);
       }
     }

     // skills/skill-registry.ts
     @Injectable()
     export class SkillRegistry {
       private skills: Map<string, Skill> = new Map();

       register(skill: Skill): void {
         this.skills.set(skill.name, skill);
       }

       get(name: string): Skill | undefined {
         return this.skills.get(name);
       }

       list(): Skill[] {
         return Array.from(this.skills.values());
       }
     }

     实施步骤（详细）

     Phase 1: 创建新核心 (估计: 2-3小时)

     创建目录结构:
     mkdir -p packages/backend/src/core/ai/{providers,skills/skills,memory,utils}

     创建文件清单:
     1. core/ai/types.ts - 所有类型定义
     2. core/ai/models.ts - 模型配置常量
     3. core/ai/providers/provider.ts - 统一Provider实现
     4. core/ai/ai.service.ts - 核心AIService
     5. core/ai/ai.module.ts - NestJS模块
     6. core/ai/utils/retry.ts - 重试逻辑
     7. core/ai/memory/memory.interface.ts - Memory接口
     8. core/ai/memory/redis-memory.ts - Redis实现

     Phase 2: 实现Skills (估计: 3-4小时)

     迁移并实现:
     1. skills/skill.interface.ts - Skill接口
     2. skills/skill-registry.ts - 注册中心
     3. skills/skills/resume-analyzer.skill.ts - 简历解析
     4. skills/skills/jd-matcher.skill.ts - JD匹配
     5. skills/skills/interview-coach.skill.ts - 面试教练
     6. skills/skills/answer-evaluator.skill.ts - 回答评估
     7. skills/skills/rag-retrieval.skill.ts - RAG检索

     Phase 3: 更新业务调用 (估计: 2-3小时)

     修改文件清单:
     1. features/resume/services/resume-optimizer.service.ts
     2. features/resume/services/match-analysis.service.ts
     3. features/interview/services/question-generator.service.ts
     4. features/interview/services/interview-session.service.ts
     5. features/interview/services/answer-evaluation.service.ts
     6. core/chat/chat.service.ts

     修改示例:
     // 旧代码
     const response = await this.aiEngineService.call({
       model: '',
       prompt,
       maxTokens: 800,
     }, userId, ScenarioType.AGENT_CUSTOM_QUESTION_GENERATION);

     // 新代码
     const result = await this.ai.chat(Models.ResumeOptimization, [
       { role: 'user', content: prompt },
     ], { maxTokens: 800, userId });

     Phase 4: 清理旧代码 (估计: 1小时)

     删除目录:
     - core/ai-provider/ (保留: 无，全部迁移)
     - core/agent/team/ (标记deprecated后删除)
     - core/agent/workflows/ (标记deprecated后删除)
     - core/agent/adapters/ (简化后删除)

     标记deprecated:
     - core/agent/team/ - 添加 @deprecated 注释
     - core/agent/workflows/ - 添加 @deprecated 注释

     更新imports:
     - 全局搜索 AIEngineService 替换为 AIService
     - 全局搜索 @/core/ai-provider 替换为 @/core/ai

     关键文件清单

     新创建文件 (约15个)

     ┌────────────────────────────────────┬──────────────────┐
     │              文件路径              │       说明       │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/types.ts                   │ 所有类型定义     │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/models.ts                  │ 模型配置常量     │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/ai.service.ts              │ 核心AIService    │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/ai.module.ts               │ NestJS模块       │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/providers/provider.ts      │ 统一Provider     │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/skills/skill.interface.ts  │ Skill接口        │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/skills/skill-registry.ts   │ Skill注册中心    │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/skills/skills/*.skill.ts   │ 内置Skills (5个) │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/memory/memory.interface.ts │ Memory接口       │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/memory/redis-memory.ts     │ Redis实现        │
     ├────────────────────────────────────┼──────────────────┤
     │ core/ai/utils/retry.ts             │ 重试逻辑         │
     └────────────────────────────────────┴──────────────────┘

     需要修改的业务文件 (16个)

     ┌───────────────────────────────────────────────────────────┬─────────────────────┐
     │                         文件路径                          │      修改内容       │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/resume/services/resume-optimizer.service.ts      │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/resume/services/match-analysis.service.ts        │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/interview/services/question-generator.service.ts │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/interview/services/interview-session.service.ts  │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/interview/services/answer-evaluation.service.ts  │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/interview/services/interview-report.service.ts   │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/job/job.service.ts                               │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ features/job-search/agents/coach.agent.ts                 │ 迁移到Skill         │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ core/chat/chat.service.ts                                 │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ core/chat/chat-intent.service.ts                          │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ core/chat/scene-analysis.service.ts                       │ 替换AIEngineService │
     ├───────────────────────────────────────────────────────────┼─────────────────────┤
     │ core/ai/queue/ai-queue.processor.ts                       │ 替换AIEngineService │
     └───────────────────────────────────────────────────────────┴─────────────────────┘

     将被删除的文件 (~120个)

     core/ai-provider/ 目录 (约70个文件):
     - selector/ 整个目录
     - tracking/ 整个目录
     - monitoring/ 整个目录
     - logging/ 整个目录
     - security/ 整个目录
     - config/ 大部分文件
     - interfaces/ 迁移到types.ts
     - factory/ 简化删除

     core/agent/ 目录 (约65个文件):
     - team/ 整个目录 (保留但标记deprecated)
     - workflows/ 整个目录 (保留但标记deprecated)
     - adapters/ 整个目录
     - agents/ 迁移到Skills
     - tools/ 迁移到Skills
     - 大部分services迁移到Skills或删除

     验证计划

     1. 单元测试

     # 运行新AI模块测试
     pnpm --filter @interview-ai/backend test -- --testPathPattern="core/ai"

     # 测试覆盖
     - AIService.chat()
     - AIService.stream()
     - AIService.embed()
     - AIService.executeSkill()
     - 各Skill的execute()

     2. 集成测试

     # 启动后端服务
     pnpm dev:backend

     # 测试API端点
     curl -X POST http://localhost:3000/api/resume/optimize \
       -H "Authorization: Bearer $TOKEN" \
       -d '{"resumeId": "...", "jobId": "..."}'

     curl -X POST http://localhost:3000/api/interview/start \
       -H "Authorization: Bearer $TOKEN" \
       -d '{"resumeId": "...", "jobId": "..."}'

     3. 功能验证清单

     - Resume上传和解析正常
     - Resume优化建议生成正常
     - Match分析计算正常
     - 面试问题生成正常
     - 面试模拟对话正常
     - 回答评估反馈正常
     - Chat对话正常
     - Streaming输出正常
     - Embedding生成正常

     4. 性能验证

     # 对比重构前后的响应时间
     # 应该相似或更快（减少了一层抽象）

     风险与缓解

     1. 风险：迁移过程中破坏现有功能
       - 缓解：Phase 1-2 保持旧代码可用，渐进迁移
     2. 风险：Skill接口设计不满足所有场景
       - 缓解：先迁移主要场景，接口可扩展
     3. 风险：LangChain功能依赖
       - 缓解：保留 LangChain 仅用于流式处理和工具调用，简化集成

     预期收益

     1. 代码量减少：从 ~135个文件 减少到 ~25个文件（减少80%）
     2. 依赖简化：AIService 只有 3-4 个依赖
     3. 扩展性提升：新功能通过注册 Skill 实现
     4. 可维护性提升：清晰的目录结构和职责划分

⏺ 计划已批准！现在开始实施重构。让我创建任务列表来跟踪进度。