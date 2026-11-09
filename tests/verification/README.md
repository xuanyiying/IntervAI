# 验证测试（Verification）

独立 workspace `@interview-ai/verification`，用 Jest + axios + `pg` 对运行中的服务做接口级验证。旧的 Task 实施总结、重复的 core / modules 文档已合并到本文件。

## 当前实现范围

验证系统仍在建设中：实际实现的 verifier 只有 `AuthVerifier`。指向不存在模块目录的 `test:auth` / `test:resume` 等脚本与未实现的 `report` 脚本已从 `package.json` 移除，只保留 `test`、`test:watch`、`test:coverage`；报告生成逻辑见 `core/report-generator.ts`，暂无 CLI 入口。

| 目录 / 文件                 | 内容                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `core/test-orchestrator.ts` | `TestOrchestrator`：按需 `registerVerifier()` 注册 verifier 后执行（无动态加载），汇总结果 |
| `core/report-generator.ts`  | `ReportGenerator`：生成 JSON / HTML / Markdown 报告与评分                                  |
| `modules/base.verifier.ts`  | verifier 基类                                                                              |
| `modules/auth.verifier.ts`  | `AuthVerifier`：注册、登录、Token 校验等认证接口检查                                       |
| `helpers/`                  | api、database、logger、test-data helper                                                    |
| `config/test.config.ts`     | 测试环境配置（`config/.env.test` 提供变量）                                                |
| `setup/jest.setup.ts`       | Jest 初始化                                                                                |
| `__tests__/`                | orchestrator / report-generator / setup / auth-verifier 单元测试                           |
| `examples/`                 | 使用示例                                                                                   |
| `fixtures/`、`reports/`     | 测试数据与报告输出                                                                         |

## 运行

```bash
# 根目录：与其它 workspace 一起跑
pnpm test
pnpm test:parallel

# 仅本包
pnpm --filter @interview-ai/verification test
pnpm --filter @interview-ai/verification test:watch
pnpm --filter @interview-ai/verification test:coverage
```

Jest 配置见 `jest.config.js`：`ts-jest` preset、`testMatch` 为 `**/__tests__/**/*.ts` 与 `*.spec.ts`、`setup/jest.setup.ts`、`maxWorkers 50%`。

## 环境

接口验证需要可访问的后端、PostgreSQL 与 Redis，参数在 `config/test.config.ts` 与 `config/.env.test` 中配置（含 `MOCK_STRIPE` / `MOCK_PADDLE` / `MOCK_OPENAI` / `MOCK_STORAGE` 等开关）。本地启动方式见 [环境配置指南](../../docs/guide/environment-setup.md)。

## 相关文档

- [后端 E2E 测试](../../packages/backend/test/e2e/README.md)
- [CI/CD 工作流](../../docs/guide/workflows.md)
