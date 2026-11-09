# E2E 测试

`packages/backend/test/e2e/` 下的用例使用 `supertest` 直接启动 `AppModule`，覆盖注册 / 登录、简历、面试、配额与安全等流程。

## 用例清单

| 文件                              | 说明                                                              |
| --------------------------------- | ----------------------------------------------------------------- |
| `complete-flow.e2e.spec.ts`       | 注册 → 简历 / 职位 → 优化 → 生成等完整流程                        |
| `resume-flow.e2e.spec.ts`         | 简历流程（目前仅验证 `/api/v1/health`，代码内标注为 Placeholder） |
| `interview-flow.e2e.spec.ts`      | 面试准备流程                                                      |
| `quota-and-limits.e2e.spec.ts`    | 配额与限流                                                        |
| `security-and-errors.e2e.spec.ts` | 鉴权与错误处理                                                    |
| `login-repro.e2e.spec.ts`         | 登录问题复现用例                                                  |

## 运行

```bash
# 仓库根目录
pnpm --filter @interview-ai/backend test:e2e
pnpm --filter @interview-ai/backend test:e2e -- --coverage

# 指定文件（在 packages/backend 内）
pnpm test:e2e -- complete-flow.e2e.spec.ts
```

`jest.e2e.config.js` 只匹配 `test/e2e/**/*.e2e.spec.ts`，`jest.config.js`（`rootDir: src`）只跑单元测试，因此 `pnpm test` 不再触发 E2E。`tsconfig.spec.json` 为 `src/` 与 `test/` 提供统一的测试编译配置。

## 前置条件

- 运行中的 PostgreSQL 与 Redis：`docker compose -f deployment/docker-compose.yml up -d`
- `packages/backend/.env` 中正确的 `DATABASE_URL`、`REDIS_*`、`JWT_SECRET` 等
- 已执行 `prisma migrate deploy` / `prisma migrate dev`；部分用例依赖测试数据的幂等性

## 相关文档

- [后端 README](../../README.md) · [验证测试](../../../../tests/verification/README.md) · [环境配置指南](../../../../docs/guide/environment-setup.md)
