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

- **`common/`** - Shared utilities, middleware, guards, decorators, exceptions
- **`core/`** - Core business logic modules (auth, user, chat, conversation, storage, quota, ai)
- **`features/`** - Feature-specific modules (resume, job, interview, payment, job-search, invitation)
- **`e2e/`** - End-to-end tests

Key architectural patterns:
- **Skills Engine**: Pluggable AI capabilities system. Engine in `core/ai/skills/`, skills in `skills/` directory
- **AI Provider Factory**: Multi-provider abstraction supporting OpenAI, DeepSeek, Qwen, Gemini, Ollama, SiliconCloud
- **WebSocket Gateway**: Real-time chat via Socket.IO with Redis adapter for scaling
- **Queue System**: Bull queues for async AI processing (`core/ai/queue/`)

### Core AI Module (`packages/backend/src/core/ai/`)

```
core/ai/
├── providers/          # AI provider implementations
├── skills/             # Skills engine
│   ├── skill.interface.ts        # Core interfaces
│   ├── skill-registry.ts         # Skill registration & execution
│   ├── skill-loader.ts           # Load skills from directories
│   ├── skill-markdown-parser.ts  # Parse Markdown skill definitions
│   └── skill-installer.service.ts # Install skills from remote sources
├── utils/              # Circuit breaker, rate limiter, usage tracker
├── memory/             # Conversation memory (Redis-backed)
├── queue/              # BullMQ queue for async processing
├── ai.service.ts       # Main AI service
├── ai.engine.ts        # AI engine with provider selection
└── degradation.service.ts # Graceful degradation
```

### Skills Directory (`packages/backend/skills/`)

Skills are defined in Markdown format with YAML frontmatter:

```
skills/
├── resume-analyzer.md      # Resume parsing & analysis
├── jd-matcher.md           # Job description matching
├── interview-prep.md       # Interview preparation
├── job-scraper.md          # Job posting extraction
└── answer-evaluator.md     # Interview answer evaluation
```

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

### AI Service (`core/ai/ai.service.ts`)
Central service for all AI calls. Handles:
- Model selection based on scenario
- Skill execution via `executeSkill(name, inputs, userId)`
- Streaming responses
- Embeddings generation
- Usage tracking and cost monitoring

### Skills Engine
The skills engine provides a pluggable architecture for AI capabilities:

1. **Skill Definition**: Markdown files with YAML frontmatter
2. **Skill Loading**: Automatic loading from `skills/` directory
3. **Skill Execution**: `aiService.executeSkill('skill-name', inputs, userId)`
4. **Skill Installation**: Install from URL, NPM, or GitHub

### Chat Flow
1. Frontend sends message via WebSocket or REST
2. Backend creates/retrieves conversation context
3. Intent service classifies the message
4. Appropriate skill is executed (resume-analyzer, jd-matcher, etc.)
5. AI engine processes with selected model
6. Response streamed back via WebSocket

### Resume Optimization Flow
1. User uploads resume (stored via StorageModule)
2. `resume-analyzer` skill parses and extracts structured info
3. `jd-matcher` skill matches job description against resume
4. AI generates optimization suggestions
5. PDF generated with optimized content

## Environment Variables

Backend requires (see `packages/backend/.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `ENCRYPTION_KEY`
- OAuth credentials (`GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.)
- AI provider API keys configured via admin UI (stored encrypted in ModelConfig table)
- `SKILLS_DIR` - Skills directory path (default: `skills/`)

## Development Notes

- **Monorepo**: Uses pnpm workspaces. Filter packages with `--filter @interview-ai/backend` or `--filter @interview-ai/frontend`
- **Turbo**: Build/test caching configured in `turbo.json`
- **API Docs**: Swagger available at `/api/docs` when backend running
- **Admin Routes**: Protected by `requiredRole="ADMIN"` in router
- **i18n**: Frontend supports zh-CN and en-US via react-i18next

## Skills Development

### Creating a New Skill

1. Create a Markdown file in `skills/` directory:

```markdown
---
name: my-skill
version: 1.0.0
description: Skill description
author: Your Name
tags: [tag1, tag2]
inputs:
  inputName:
    type: string
    required: true
    description: Input description
outputs:
  type: object
---

# System Prompt

Your skill's prompt template goes here. Use {{inputName}} for variable substitution.
```

2. The skill will be automatically loaded on server startup

3. Execute the skill:
```typescript
const result = await aiService.executeSkill('my-skill', {
  inputName: 'value'
}, userId);
```

### Skill Interface

```typescript
interface SkillDefinition {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags: string[];
  inputs: Record<string, SkillInputDefinition>;
  outputs?: SkillOutputDefinition;
  prompt?: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}
```
