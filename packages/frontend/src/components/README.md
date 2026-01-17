# Shared Components

Reusable UI components used across pages.

## Directory Structure

```
components/
├── ResumeBuilder/            # Components specific to Resume Builder
├── MyResumes/                # Components specific to Dashboard
├── InterviewQuestionsCard.tsx # Display for generated questions
├── JobInfoCard.tsx           # Job Description display
├── PDFGenerationDialog.tsx   # PDF Export config
├── MarkdownPDFCard.tsx       # Markdown rendering
├── ProtectedRoute.tsx        # Auth Guard Wrapper
└── ...
```

## Core Components

### `ProtectedRoute`

Wraps routes that require authentication. Redirects to login if unauthenticated.

### `MarkdownPDFCard`

Renders Markdown content with support for PDF export. Used for resumes and interview feedback.

### `JobInputDialog`

Modal for entering job description or URL for analysis.

### `ResumeUploadButton`

Standardized upload button with drag-and-drop support.

## Design System

Components generally use Tailwind CSS for styling. Some components (legacy) use CSS Modules (`*.css`).
New components should prefer Tailwind.
