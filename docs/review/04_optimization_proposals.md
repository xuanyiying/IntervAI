# Optimization Proposals & Refactoring Plan

**Date:** 2026-01-19
**Project:** AI Resume (IntervAI)

## 1. Architectural Improvements (P0 - Critical)

### 1.1 Refactor Frontend `ChatPage`
**Problem**: The `ChatPage.tsx` component is monolithic (>370 lines), making it hard to test and maintain.
**Proposal**:
1.  Extract `useChatSocket` logic into a dedicated context provider or cleaner hook.
2.  Split UI into sub-components:
    *   `ChatInputArea`: Handles text input and file upload triggers.
    *   `MessageStream`: Renders the list of messages.
    *   `OptimizationPanel`: Handles the side-by-side resume comparison.
3.  **Estimated Effort**: 3 Days.

### 1.2 Implement Resume Builder Persistence
**Problem**: Resume edits are local-only. Browser refresh loses data.
**Proposal**:
1.  Create `ResumeDraft` entity in Prisma.
2.  Add `POST /resumes/:id/draft` endpoint.
3.  Implement "Auto-save" hook in Frontend (debounce 2s).
4.  **Estimated Effort**: 4 Days.

## 2. Performance Optimization (P1 - High)

### 2.1 Database Query Optimization
**Problem**: Potential N+1 issues in listing endpoints.
**Proposal**:
1.  Review `PrismaService` usage.
2.  Use `prisma.$queryRaw` for complex aggregations if needed.
3.  Add indexes on `Job.userId`, `InterviewSession.userId`, `Resume.createdAt`.
4.  **Estimated Effort**: 2 Days.

### 2.2 Bundle Size Reduction
**Problem**: Frontend bundle is likely large due to full library imports.
**Proposal**:
1.  Use `React.lazy` and `Suspense` for heavy routes (`ResumeBuilder`, `InterviewPage`).
2.  Analyze bundle with `rollup-plugin-visualizer`.
3.  Switch to partial imports for icons (`@ant-design/icons`).
4.  **Estimated Effort**: 2 Days.

## 3. Developer Experience & Quality (P2 - Medium)

### 3.1 Unified Type System
**Problem**: Manual syncing of types between FE and BE.
**Proposal**:
1.  Create `packages/shared` workspace.
2.  Move all DTOs and Interfaces there.
3.  Import from `@ai-resume/shared` in both FE and BE.
4.  **Estimated Effort**: 3 Days.

### 3.2 E2E Testing Pipeline
**Problem**: No automated verification of critical flows.
**Proposal**:
1.  Install **Playwright**.
2.  Write tests for:
    *   Login -> Upload Resume -> Parse Success.
    *   Start Interview -> Receive Question -> Submit Answer.
3.  **Estimated Effort**: 5 Days.

## 4. Implementation Priorities

| Priority | Task | Impact | Cost (Days) |
| :--- | :--- | :--- | :--- |
| **P0** | Refactor `ChatPage` | Maintainability | 3 |
| **P0** | Resume Builder Auto-save | User Experience | 4 |
| **P1** | E2E Tests (Core Flows) | Stability | 5 |
| **P1** | Database Indexing | Performance | 2 |
| **P2** | Shared Types Workspace | Dev Velocity | 3 |
| **P3** | Bundle Optimization | Performance | 2 |

**Total Estimated Effort**: ~19 Man-days (approx. 1 month for 1 developer).
