# Refactor Mock Interview Module to Match Java Reference Architecture

I will refactor the existing `interview` module in the NestJS backend and React frontend to align with the structured, scalable architecture described in the `INTERVIEW_MODULE_TECHNICAL_DOC.md`.

## 1. Backend Refactoring (NestJS)

### 1.1 Service Layer Restructuring

I will split the monolithic `InterviewService` into specialized services:

* **`InterviewQuestionService`**: Responsible for generating questions (AI + Rule-based) and persisting them to the DB. (Refactored from existing logic).

* **`InterviewSessionService`**: Core state machine.

  * **Redis Caching**: Will cache the active session state (`currentQuestionIndex`, `questionsList`, `answers`) in Redis to minimize DB hits during the interview.

  * **State Management**: Enforce `CREATED` -> `IN_PROGRESS` -> `COMPLETED` -> `EVALUATED` transitions.

  * **Flow**: `submitAnswer()` will update Redis state and return the *next* question immediately.

* **`AnswerEvaluationService`**: Specialized service for AI evaluation of the completed interview.

### 1.2 Async Processing (Evaluation)

* **Queue Implementation**: Replace the current "fire-and-forget" promise with a robust **Bull Queue** (using `@nestjs/bull`). This maps to the "Redis Stream" requirement in the Java doc, ensuring reliability and scalability.

* **Processor**: Create `EvaluationProcessor` to consume completed sessions, run AI evaluation, and update the DB.

### 1.3 Controller Updates

* Update `InterviewController` to expose structured endpoints:

  * `POST /session/:id/answer`: Submit answer for current question.

  * `GET /session/:id/current`: Get current question state.

## 2. Frontend Refactoring (React)

### 2.1 UI / UX Updates

* **Structured Flow**: Refactor `InterviewPage.tsx` to move away from a "Free Chat" model to a "Structured Interview" model:

  * Display the **Current Question** prominently at the top.

  * Display the **Answer Input** (Text/Audio) below.

  * "Next Question" button instead of generic "Send".

  * Show progress (e.g., "Question 3 of 10").

* **State Management**: Update local state to track the current question and progress.

## 3. Implementation Steps

1. **Backend Setup**:

   * Install `@nestjs/bull` (if not fully configured) and verify Redis connection.

   * Create new service files (`interview-session.service.ts`, `answer-evaluation.service.ts`).
2. **Core Logic Migration**:

   * Move question generation to `InterviewQuestionService`.

   * Implement Redis-based session caching in `InterviewSessionService`.

   * Implement the Async Evaluation Processor.
3. **Frontend Integration**:

   * Update `interview-service.ts` to match new API endpoints.

   * Refactor `InterviewPage` UI components.
4. **Verification**:

   * Verify the full flow: Start Session -> Cache Hit -> Answer Q1..QN -> Queue Job -> Evaluation Result.

## 4. Quality & Standards

* **Type Safety**: Ensure strict typing for all DTOs and Redis structures.

* **Error Handling**: Add graceful fallbacks for Redis failures (fallback to DB).

* **Testing**: Add unit tests for the new Services and Processor.

