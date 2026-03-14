# Implementation Plan: Integrating Interview Preparation Guide and STAR Optimization

I will implement the frontend integration for the Interview Preparation Guide (Scenario A) and STAR Method Optimization (Scenario B) features, connecting them to the backend API we've already set up.

## 1. Service Layer Update

*   **File**: `packages/frontend/src/services/interview-service.ts`
*   **Task**: Add the `getPreparationGuide` method to call the `POST /api/v1/interview/preparation-guide` endpoint.
*   **Details**: Define the request interface matching the backend DTO (`type`, `language`, `resumeData`, `jobDescription`, `question`).

## 2. Scenario A: Strategist Page Integration (Interview Preparation Guide)

*   **File**: `packages/frontend/src/components/StrategistCard.tsx`
*   **Task**:
    *   Add a new state/mode to toggle between "Question Bank" (existing) and "Preparation Guide" (new).
    *   Add a "Generate Guide" button in the UI.
    *   Implement the API call to `interviewService.getPreparationGuide` with `type: 'guide'`.
    *   Render the returned Markdown content using a Markdown viewer (e.g., `StreamingMarkdownBubble` or similar).

## 3. Scenario B: Resume Optimization View Integration (STAR Method Polisher)

*   **File**: `packages/frontend/src/components/MyResumes/ResumeOptimizationView.tsx`
*   **Task**:
    *   Add a new section or modal for "STAR Method Polishing".
    *   Allow users to input a raw experience description.
    *   Implement the API call to `interviewService.getPreparationGuide` with `type: 'star'` and passing the description as `question` (or map it correctly in the service).
    *   Display the optimized STAR output (Situation, Task, Action, Result) for the user to copy or apply.

## 4. Conflict Resolution & Testing

*   **Conflict Check**: Ensure the new `type` parameter in the API call correctly maps to the backend templates (`interview_preparation_guide_zh` vs `interview_preparation_star_zh`) without interfering with existing question generation logic.
*   **Testing**:
    *   Verify "Generate Guide" returns the broad interview strategy.
    *   Verify "STAR Polish" returns a specific text optimization.
    *   Ensure error handling is robust (e.g., if AI service is down).

## 5. Execution Steps

1.  Update `interview-service.ts`.
2.  Refactor `StrategistCard.tsx` to support the Guide mode.
3.  Enhance `ResumeOptimizationView.tsx` with the STAR tool.
4.  Verify functionality.

