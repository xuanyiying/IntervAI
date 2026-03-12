# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IntervAI is an AI-powered interview preparation and resume optimization SaaS platform. It's a monorepo with two packages:
- **Backend**: NestJS API with Prisma ORM, multi-provider AI integration, WebSocket support
- **Frontend**: React + Vite + Ant Design SPA with Zustand state management

## Commands

### Development
```bash
pnpm dev                    # Start both frontend and backend concurrently
pnpm dev:backend            # Start backend only (port 3000)
pnpm dev:frontend           # Start frontend only (port 5173)
```

### Build & Production
```bash
pnpm build:backend          # Build backend (outputs to packages/backend/dist)
pnpm build:frontend         # Build frontend (outputs to packages/frontend/dist)
```

### Database (run from packages/backend)
```bash
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run database migrations
pnpm prisma:studio          # Open Prisma Studio GUI
pnpm prisma:seed            # Seed database
pnpm seed:models            # Seed AI model configurations
```

### Testing
```bash
pnpm test                   # Run all tests (uses Turbo for parallelization)
pnpm --filter @interview-ai/backend test          # Backend tests (Jest)
pnpm --filter @interview-ai/frontend test         # Frontend tests (Vitest)
pnpm --filter @interview-ai/backend test:cov      # Backend coverage
pnpm --filter @interview-ai/frontend test:coverage # Frontend coverage
```

### Linting & Formatting
```bash
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Format with Prettier
```

### Docker (Infrastructure)
```bash
docker compose -f deployment/docker-compose.yml up -d      # Start PostgreSQL, Redis, MinIO, ChromaDB
docker compose -f deployment/docker-compose.yml down       # Stop services
```

## Architecture

### Backend Structure (`packages/backend/src/`)

The backend follows a layered architecture with clear separation:

- **`core/`** - Core business logic modules (auth, user, chat, conversation, storage, quota, agent, ai-provider)
- **`features/`** - Feature-specific modules (resume, job, interview, payment, voice, job-search, invitation)
- **`shared/`** - Shared infrastructure (database/prisma, cache/redis, logger, notification/email, monitoring)
- **`common/`** - Common utilities, middleware, guards, decorators

Key architectural patterns:
- **AI Provider Factory**: Multi-provider abstraction supporting OpenAI, DeepSeek, Qwen, Gemini, Ollama, SiliconCloud. See `core/ai-provider/factory/`
- **Agent System**: LangChain-based agent orchestration with tools (JD analyzer, resume parser, keyword matcher, RAG retrieval). See `core/agent/`
- **WebSocket Gateway**: Real-time chat via Socket.IO with Redis adapter for scaling
- **Queue System**: Bull queues for async AI processing (`core/ai/queue/`)

### Frontend Structure (`packages/frontend/src/`)

- **`pages/`** - Route-level components (ChatPage, ResumeBuilderPage, InterviewPage, etc.)
- **`components/`** - Reusable UI components
- **`stores/`** - Zustand state stores (authStore, conversationStore, resumeStore, etc.)
- **`services/`** - API client modules for backend communication
- **`hooks/`** - Custom React hooks (useChatSocket, useOptimization, etc.)
- **`router/`** - React Router configuration with protected routes

### Database Schema

PostgreSQL via Prisma. Key models:
- **User/Account/Session** - Authentication with OAuth support (Google, GitHub)
- **Resume/Job/Optimization** - Core resume-job matching workflow
- **Conversation/Message** - Chat history with attachments
- **InterviewSession/InterviewMessage** - Mock interview sessions
- **ModelConfig/PromptTemplate** - AI model and prompt management
- **JobPosting/Application/JobMatch** - Job search automation

### Path Aliases

Both packages use `@/*` for absolute imports:
- Backend: `@/` → `packages/backend/src/`
- Frontend: `@/` → `packages/frontend/src/`

## Key Integration Points

### AI Engine Service (`core/ai-provider/ai-engine.service.ts`)
Central service for all AI calls. Handles:
- Model selection based on scenario
- Prompt template management
- Retry logic with exponential backoff
- Usage tracking and cost monitoring
- Performance metrics

### Chat Flow
1. Frontend sends message via WebSocket or REST
2. Backend creates/retrieves conversation context
3. Agent orchestrator selects appropriate tools
4. AI engine processes with selected model
5. Response streamed back via WebSocket

### Resume Optimization Flow
1. User uploads resume (stored via StorageModule)
2. Resume parsed and analyzed
3. Job description matched against resume
4. AI generates optimization suggestions
5. PDF generated with optimized content

## Environment Variables

Backend requires (see `packages/backend/.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `ENCRYPTION_KEY`
- OAuth credentials (`GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.)
- AI provider API keys configured via admin UI (stored encrypted in ModelConfig table)

## Development Notes

- **Monorepo**: Uses pnpm workspaces. Filter packages with `--filter @interview-ai/backend` or `--filter @interview-ai/frontend`
- **Turbo**: Build/test caching configured in `turbo.json`
- **API Docs**: Swagger available at `/api/docs` when backend running
- **Admin Routes**: Protected by `requiredRole="ADMIN"` in router
- **i18n**: Frontend supports zh-CN and en-US via react-i18next
