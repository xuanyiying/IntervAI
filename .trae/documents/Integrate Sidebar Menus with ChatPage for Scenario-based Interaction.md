I will implement the integration of the sidebar menu with the `ChatPage` to create a seamless, scenario-based interaction model as requested.

### 1. Route Configuration (`packages/frontend/src/router/index.tsx`)
- **Action**: Redirect existing agent routes to the `ChatPage` component instead of standalone pages.
- **Details**:
  - Map `/agents/pitch-perfect` to `<ChatPage mode="resume-polish" />`
  - Map `/agents/interview-prediction` to `<ChatPage mode="interview-prediction" />`
  - Map `/agents/mock-interview` to `<ChatPage mode="mock-interview" />`
  - Maintain `/resumes` pointing to `MyResumesPage` for resume management.

### 2. ChatPage Enhancement (`packages/frontend/src/pages/ChatPage.tsx`)
- **Action**: Add `mode` prop and implement scenario-specific logic.
- **Details**:
  - Accept `mode` prop.
  - **Dynamic UI**:
    - Update input placeholder based on mode (e.g., "Enter job description..." for prediction).
    - Display a mode indicator/badge in the header.
  - **Context Initialization**:
    - When entering a specific mode with a new conversation, automatically trigger a welcome message or system instruction appropriate for that scenario (e.g., "Welcome to Mock Interview. Please upload your resume...").
    - Ensure the conversation context aligns with the selected mode.

### 3. Sidebar Alignment (`packages/frontend/src/layouts/components/Sidebar.tsx`)
- **Action**: Ensure sidebar navigation triggers the correct routes and behavior.
- **Details**:
  - Verify that clicking menu items navigates to the updated routes.
  - Ensure the sidebar remains active/highlighted correctly when in these modes.

### 4. User Experience Optimization
- **Data Sync**: Ensure that operations in `ChatPage` (like uploading a resume) are reflected in the global store, accessible via "My Resumes".
- **Visual Feedback**: Add clear status indicators so users know which "Agent" they are interacting with.

This approach unifies the experience into a single, powerful chat interface while preserving distinct functional entry points.