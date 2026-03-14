# Implementation Plan: AI Resume Enhancements

## 1. Prompt Integration
**Goal**: Integrate the new prompt templates from `/packages/backend/prompts/` into the system configuration.

-   **Update Interfaces**:
    -   Modify `packages/backend/src/ai-providers/interfaces/prompt-template.interface.ts` to add new `PromptScenario` enum values:
        -   `INTERVIEW_EVALUATION`
        -   `MOCK_INTERVIEW` (for interview question generation based on context)
        -   `RESUME_ANALYSIS` (distinct from optimization)
        -   `KNOWLEDGE_BASE_QUERY`
-   **Register Templates**:
    -   Update `packages/backend/src/ai-providers/config/predefined-templates.ts` to include the content of the `.st` files.
    -   Standardize variable names (e.g., using `{resume_content}` instead of `{resumeText}` for consistency).

## 2. Resume Analysis Feature
**Goal**: Implement Resume Analysis and Result Display (as per reference image).

-   **Backend**:
    -   **Service**: Enhance `ResumeService` or create `ResumeAnalysisService` to handle the `RESUME_ANALYSIS` scenario.
    -   **Controller**: Add `POST /resumes/analyze` endpoint to handle file upload, text extraction (using `pdf-parse`/`mammoth`), and AI analysis.
    -   **DTO**: Define response structure matching the JSON output of the prompt (scores, suggestions, etc.).
-   **Frontend**:
    -   **Page**: Create `ResumeAnalysisPage.tsx`.
    -   **Components**:
        -   File Upload Area (Drag & Drop).
        -   Analysis Result Dashboard (Score Cards, Radar Chart for dimensions, Suggestion List).
    -   **Route**: Add to `App.tsx` and Sidebar.

## 3. Voice Mock Interview Feature
**Goal**: Implement Voice Mock Interview, Recording, and Review.

-   **Backend**:
    -   **Audio Service**: Create `AudioService` using `openai` SDK for:
        -   STT (Speech-to-Text): `transcribe` method.
        -   TTS (Text-to-Speech): `synthesize` method (optional, for AI voice response).
    -   **Controller**:
        -   `POST /interview/audio/transcribe`: Accepts audio file, returns text.
    -   **Evaluation**: Use the `INTERVIEW_EVALUATION` prompt to generate a report after the session ends.
-   **Frontend**:
    -   **Audio Recorder**: Implement a React component/hook to capture microphone input as `Blob`.
    -   **Integration**: Add "Voice Mode" toggle to `ChatPage`.
        -   When active, user speaks -> auto-send audio -> transcribe -> send text to AI -> play response (optional).
    -   **Review Page**: Display the "Interview Evaluation" JSON result (Scores, Q&A feedback).

## Execution Order
1.  **Configuration**: Update Prompt Enums and Templates.
2.  **Resume Analysis**: Backend Service/Controller -> Frontend Page.
3.  **Voice Interview**: Audio Service/Controller -> Frontend Integration.
