# Product & Technical Roadmap (Q1-Q2 2026)

**Date:** 2026-01-19
**Project:** AI Resume (IntervAI)

## Q1 2026: Stability, Persistence & User Retention

**Theme**: "Solidify the Core" - Ensuring users can trust the platform with their data and have a smooth experience.

### Month 1: Foundation Fixes
*   **Feature**: **Resume Builder Auto-Save**.
    *   *Tech*: Implement `ResumeDraft` entity, Debounced save hook, "Saved" indicator.
*   **Tech**: **Frontend Refactoring**.
    *   *Action*: Deconstruct `ChatPage.tsx` into atomic components.
    *   *Goal*: Reduce Cyclomatic Complexity by 50%.
*   **Infra**: **Observability**.
    *   *Action*: Setup Loki (Logs) + Grafana Dashboards for API error rates.

### Month 2: Engagement Loop
*   **Feature**: **Interview History & Analytics**.
    *   *Detail*: Visual charts showing score improvement over time.
    *   *Tech*: Aggregation queries on `InterviewSession` table.
*   **Feature**: **Email Drip Campaigns**.
    *   *Detail*: "Don't forget to practice" emails.
    *   *Tech*: BullMQ scheduled jobs + Email Service (SendGrid/SES).
*   **Tech**: **E2E Testing Suite**.
    *   *Action*: Playwright implementation for Critical User Journeys.

### Month 3: Monetization & Growth
*   **Feature**: **Pro Tier Limits Enforcement**.
    *   *Detail*: Strict locking of features after quota exceeded.
    *   *Tech*: Redis-based sliding window rate limiter.
*   **Feature**: **Referral System**.
    *   *Detail*: "Invite a friend, get 5 free parses".
    *   *Tech*: `InvitationCode` entity, linkage logic.

---

## Q2 2026: Expansion & Enterprise Ready

**Theme**: "Scale & Specialize" - Supporting more roles and team-based workflows.

### Month 4: Global Reach
*   **Feature**: **Internationalization (i18n)**.
    *   *Detail*: Full Chinese/English support toggle.
    *   *Tech*: `react-i18next` for FE, `nestjs-i18n` for BE responses/prompts.
*   **Tech**: **Shared Workspace**.
    *   *Action*: Extract types to `packages/shared`.

### Month 5: Advanced AI
*   **Feature**: **Coding Interview Mode**.
    *   *Detail*: Integrated Code Editor (Monaco) + Code Execution Sandbox.
    *   *Tech*: Judge0 API or isolated Docker containers for execution.
*   **Feature**: **Behavioral Analysis 2.0**.
    *   *Detail*: Tone analysis using Audio embeddings.

### Month 6: B2B / Enterprise
*   **Feature**: **Team Dashboard**.
    *   *Detail*: HR/Recruiters can view candidate performance.
    *   *Tech*: Organization-level RBAC (`OrgID` in JWT).
*   **Infra**: **Multi-Region Deployment**.
    *   *Action*: Deploy to US-East and AP-Southeast for lower latency.

## Resource Requirements

| Role | Q1 Count | Q2 Count | Focus Area |
| :--- | :--- | :--- | :--- |
| **Full Stack Dev** | 2 | 3 | Core Features, Frontend Refactor |
| **AI Engineer** | 1 | 1 | Prompt Tuning, RAG Optimization |
| **DevOps** | 0.5 | 1 | CI/CD, Monitoring, Multi-region |
| **QA Engineer** | 0.5 | 1 | E2E Tests, Manual Testing |

## Risk Assessment

1.  **AI Cost Scaling**: As usage grows, token costs will spike.
    *   *Mitigation*: Implement aggressive caching and consider cheaper models (e.g., Haiku/Flash) for simple tasks.
2.  **Data Compliance**: Storing user resumes requires GDPR/CCPA compliance.
    *   *Mitigation*: Implement "Delete Account" (Right to be Forgotten) fully in Q1.
