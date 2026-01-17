# Agent 模块 (LangChain AI Agent 系统)

AI Agent 服务模块，基于 LangChain 构建智能对话和任务执行能力。

## 目录结构

```
agent/
├── adapters/           # 适配器层 - LangChain组件适配
├── agents/             # Agent实现 - 具体Agent定义
├── controllers/        # API控制器
├── dto/                # 数据传输对象
├── middleware/         # 中间件
├── services/           # 核心服务 (19个)
├── tools/              # LangChain工具函数
├── workflows/          # 工作流定义
├── agent.module.ts     # 模块配置
├── index.ts            # 导出入口
└── DESIGN.md           # 设计文档
```

## 核心服务

| 服务                             | 职责                  |
| -------------------------------- | --------------------- |
| `agentic.service.ts`             | Agent编排入口         |
| `rag.service.ts`                 | 检索增强生成(RAG)     |
| `vector-db.service.ts`           | 向量数据库操作        |
| `embedding.service.ts`           | 文本嵌入生成          |
| `langchain-callbacks.service.ts` | LangChain生命周期回调 |
| `batch-processor.service.ts`     | 批量处理任务          |
| `context-compressor.service.ts`  | 上下文压缩            |
| `document-processor.service.ts`  | 文档处理              |
| `structured-output.service.ts`   | 结构化输出解析        |

## 工具函数 (Tools)

LangChain Agent 可调用的工具：

- 简历分析工具
- 网页抓取工具
- 知识库检索工具

## 使用示例

```typescript
import { AgenticService } from './services/agentic.service';

// 注入服务
constructor(private agenticService: AgenticService) {}

// 执行Agent任务
const result = await this.agenticService.runAgent({
  userId: 'user-123',
  task: 'optimize_resume',
  input: { resumeId: 'resume-456' }
});
```

## 相关文档

- [Agent设计文档](./DESIGN.md)
- [LangChain官方文档](https://js.langchain.com/)
