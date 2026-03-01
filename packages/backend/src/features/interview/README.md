# Interview 模块 (模拟面试)

AI 驱动的模拟面试系统，提供问题生成、实时对话、评分反馈等功能。

## 目录结构

```
interview/
├── dto/                        # 数据传输对象
│   ├── create-session.dto.ts
│   ├── send-message.dto.ts
│   └── end-session.dto.ts
├── processors/                 # 后台任务处理器
├── services/                   # 子服务
│   ├── question-generator.service.ts # 问题生成 (AI + Rules)
│   ├── interview-session.service.ts  # 会话管理
│   └── interview-question.service.ts # 问题查询
├── interview.controller.ts     # API 控制器
├── interview.module.ts         # 模块配置
├── interview.service.ts        # Service Facade (代理到子服务)
└── interview.service.spec.ts   # 测试文件
```

## 架构说明

`InterviewService` 已重构为 Facade 模式，核心逻辑拆分为独立服务：

- `QuestionGeneratorService`: 负责生成面试题，集成 AI Agent。
- `InterviewSessionService`: 负责会话生命周期管理（开始、对话、结束）。
- `InterviewQuestionService`: 负责问题的 CRUD 操作。
