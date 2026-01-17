# Frontend Stores

State management using [Zustand](https://github.com/pmndrs/zustand).

## Directory Structure

```
stores/
├── authStore.ts          # Authentication State (User, Token)
├── uiStore.ts            # UI State (Sidebar, Modals, Theme)
├── resumeStore.ts        # Resume List & Current Active Resume
├── conversationStore.ts  # Chat Messages & Thread State
├── interviewStore.ts     # Active Interview Session State
├── optimizationStore.ts  # Resume Optimization Workflow State
└── index.ts
```

## Core Stores

### Auth Store

Manages user session, login status, and user profile.

- `user`: Current user object
- `isAuthenticated`: Boolean
- `login(credentials)`: Async action
- `logout()`: Clears state and local storage

### Resume Store

Manages the list of uploaded resumes and selection.

- `resumes`: Array of resumes
- `currentResume`: Selected resume
- `fetchResumes()`: Load from API

### Conversation Store

Manages the main chat interface state.

- `messages`: Array of chat messages
- `isTyping`: AI typing indicator
- `addMessage(msg)`: Optimistic updates

## Usage

```typescript
import { useAuthStore } from '@/stores/authStore';

const ProfileComponent = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```
