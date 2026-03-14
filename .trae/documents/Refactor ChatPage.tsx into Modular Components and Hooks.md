I will refactor `packages/frontend/src/pages/ChatPage.tsx` (~1278 lines) into a modular, clean structure within `packages/frontend/src/pages/ChatPage/`.

### **Refactoring Strategy**

1.  **Directory Structure**:
    ```text
    src/pages/ChatPage/
    ├── index.tsx                # Main entry (composed of sub-components)
    ├── components/
    │   ├── ChatWelcome.tsx      # Welcome screen with quick actions
    │   ├── ChatList.tsx         # Message list container
    │   ├── ChatInput.tsx        # Input area with file upload
    │   ├── MessageContent.tsx   # Factory component for rendering different message types
    │   ├── AttachmentMessage.tsx # (Move/Reuse existing)
    │   └── ...
    ├── hooks/
    │   ├── useChatMessages.ts   # Message loading, pagination, retries
    │   ├── useChatItems.ts      # Merging remote messages with local items (optimistic UI)
    │   ├── useResumeUpload.ts   # Resume upload, parsing, status tracking
    │   ├── useJobActions.ts     # Job creation/edit/delete logic
    │   └── useOptimization.ts   # Suggestion acceptance, PDF generation
    └── types.ts                 # Local types
    ```

2.  **Step-by-Step Implementation**:

    *   **Phase 1: Extract Business Logic (Hooks)**
        *   Create `useResumeUpload`: Isolate complex upload/parsing flow and `localItems` state management for files.
        *   Create `useChatItems`: encapsulate the logic that merges persisted `messages` with `localItems` (streaming chunks, upload progress).
        *   Create `useOptimization`: Group suggestion handling and comparison logic.

    *   **Phase 2: Extract UI Components**
        *   Create `MessageContent`: Isolate the massive `renderItem` switch-case logic into smaller, testable functional components (`JobMessage`, `SuggestionMessage`, `MarkdownMessage`).
        *   Create `ChatWelcome`: Move the static welcome UI out of the main render loop.

    *   **Phase 3: Reassemble ChatPage**
        *   Rebuild `ChatPage.tsx` (as `index.tsx`) to be a high-level orchestrator that connects hooks to UI components.
        *   Ensure strict adherence to Clean Code: Functions < 20 lines, no deep nesting.

    *   **Phase 4: Verification**
        *   Verify all existing features: Chat streaming, Resume upload, Job input, Optimization diff view.
        *   Ensure no regressions in state management.

### **Benefits**
*   **Readability**: Reduces main file from ~1300 lines to ~150 lines.
*   **Maintainability**: Logic is isolated in hooks; UI is isolated in components.
*   **Testability**: Hooks and small components can be tested individually.
