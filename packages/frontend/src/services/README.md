# Frontend Services

API client services for communicating with the backend APIs.

## Directory Structure

```
services/
├── auth-service.ts           # Authentication & User Management
├── user-service.ts           # User Profile & Settings
├── resume-service.ts         # Resume Upload & Management
├── interview-service.ts      # Interview Session & Questions
├── conversation-service.ts   # Chat & Message History
├── agent-service.ts          # Agent Interactions
├── knowledge-base-service.ts # RAG Knowledge Base
├── admin-service.ts          # Admin Dashboard
└── index.ts                  # Exports
```

## Usage Pattern

All services follow the singleton or static class pattern and use the configured `axios` instance (or fetch wrapper) for requests.

```typescript
import { interviewService } from '@/services/interview-service';

// Call API
const questions = await interviewService.generateQuestions(optimizationId);
```

## Service Details

### Auth Service

- `login`, `register`, `logout`
- `checkAuthStatus`

### Resume Service

- `uploadResume`: Multipart/form-data upload
- `getResumes`, `getResumeDetail`
- `deleteResume`

### Interview Service

- `generateQuestions`
- `startSession`, `endSession`
- `sendMessage`: Supports audio and text
- `getHistory`

### Admin Service

- `getUsers`, `getStats`
- `getSystemSettings`
