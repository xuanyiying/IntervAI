# Frontend Pages & Routing

Application pages mapped to routes.

## Directory Structure

```
pages/
├── ChatPage/                  # Main Chat Interface (Complex)
├── LoginPage.tsx              # Login Screen
├── RegisterPage.tsx           # Registration Screen
├── InterviewPage.tsx          # Interview Simulation
├── MyResumesPage.tsx          # Resume Dashboard
├── ProfilePage.tsx            # User Profile
├── SettingsPage.tsx           # Application Settings
├── PricingPage.tsx            # Subscription Plans
├── Admin/                     # Admin Pages
│   ├── UserManagementPage.tsx
│   ├── ModelManagementPage.tsx
│   └── PromptManagementPage.tsx
└── ...
```

## Key Pages

### Chat Page (`/chat/:id?`)

The central interface for interacting with the AI Agent.

- Displays chat history
- Input area for text/audio
- Sidebar for conversation history

### Resume Builder (`/resumes/builder`)

Interactive resume creation and optimization tool.

### Interview Page (`/interview/:id`)

Real-time interview simulation interface.

- Audio/Video integration (optional)
- Real-time transcript
- Feedback display

### Admin Dashboard (`/admin`)

Restricted access area for system management.

- User Management
- AI Model Configuration
- System Stats
