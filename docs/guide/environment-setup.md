# 🛠️ 环境配置与开发指南

本文档旨在帮助开发者快速搭建 IntervAI 的本地开发环境。

## 1. 系统要求

- **操作系统**: macOS, Linux, 或 Windows (WSL2)
- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **pnpm**: >= 9.0.0
- **Docker**: >= 24.0.0 (用于运行数据库和中间件)
- **Docker Compose**: >= 2.0.0

## 2. 依赖服务启动

项目依赖 PostgreSQL, Redis 和 MinIO。我们提供了一键启动脚本：

```bash
# 在项目根目录执行
docker compose -f deployment/docker-compose.yml up -d
```

确认服务状态：
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (Console: `localhost:9001`)

## 3. 项目安装

```bash
# 1. 克隆仓库
git clone https://github.com/yiying/ai-resume.git
cd ai-resume

# 2. 安装依赖 (使用 pnpm workspace)
pnpm install

# 3. 环境变量配置
cp .env.example .env
# 编辑 .env 文件，填入你的 OpenAI Key 等信息
```

## 4. 数据库迁移

```bash
# 进入后端目录
cd packages/backend

# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev
```

## 5. 启动应用

### 开发模式 (Development)

在根目录执行：

```bash
# 同时启动前端和后端
pnpm dev
```

或者分别启动：

```bash
# 启动后端 (Watch Mode)
pnpm --filter backend dev

# 启动前端
pnpm --filter frontend dev
```

- 前端地址: `http://localhost:5173`
- 后端 API: `http://localhost:3000`
- API 文档 (Swagger): `http://localhost:3000/api`

### 生产构建 (Production Build)

```bash
# 构建所有包
pnpm build

# 仅构建特定包
pnpm --filter backend build
```

## 6. 开发规范

### 代码风格
项目使用 ESLint + Prettier 统一代码风格。提交前请确保通过 lint 检查：

```bash
pnpm lint
```

### Git 提交规范
遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档变更
- `style`: 代码格式 (不影响逻辑)
- `refactor`: 重构
- `chore`: 构建过程或辅助工具变动

示例: `feat(interview): add speech-to-text support`
