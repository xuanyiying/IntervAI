# 分支保护规则（建议）

以下规则对应 `.github/workflows/ci.yml` 的实际 job；旧文档中列出的 `test-backend`、`build-docker` 等状态检查并不存在。

## `main` 分支

建议设置：

- 禁止直接 push，所有变更通过 PR 合并
- 要求至少 1 个审批，且新提交使旧审批失效
- 要求分支与 `main` 同步、会话式提交签名（按需）
- 合并前必须通过状态检查：

| 状态检查   | 对应 CI job                                                             |
| ---------- | ----------------------------------------------------------------------- |
| `lint`     | `pnpm run lint`                                                         |
| `backend`  | Prisma 迁移 + Jest 测试 + `nest build`（带 PostgreSQL / Redis service） |
| `frontend` | `typecheck` + Vitest + `vite build`                                     |

## 触发范围

- `ci.yml`：push 与 PR 到 `main`、`develop` 时运行。若同时保护 `develop`，可复用同一组状态检查。
- `deploy.yml`：push 到 `main`、push `v*` tag，以及 `workflow_dispatch`（必填 `environment`，默认 `staging`）时触发；push 事件一律部署 production，手动触发按所选环境部署。
- `release.yml`：push `v*` tag 时创建 Release 与构建产物。

也就是说，**打 tag 会同时触发 `deploy.yml` 与 `release.yml`**，配置保护规则与 Secrets 时需考虑这一点。

## GitHub 参考

- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Troubleshooting required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/troubleshooting-required-status-checks)
