# Resume Optimization Diff System Design

## Date: 2026-04-09

## Overview

Git-like diff/merge workflow for resume optimization. Users can review AI-generated suggestions with inline diff highlighting, accept or reject individual changes, and manage resume versions.

## Requirements Summary

- **Parsing**: Automatic on resume upload
- **Optimization**: Auto-generate after parsing + manual trigger option
- **Version Management**: Simple dual-version (original + current)
- **Diff Display**: Inline diff highlighting (GitHub PR style)
- **Scope**: Experience/project descriptions, skills, self-introduction
- **User Actions**: Accept/reject individual suggestions, batch operations, restore original

## Architecture

### Flow Diagram

```
Upload Resume → Auto Parse (Queue) → Auto Optimize (Queue) / Manual Trigger
                                              ↓
                                    WebSocket Notify User
                                              ↓
                                   Diff Review Page
                                   - Inline diff highlights
                                   - [Accept] [Reject] per suggestion
                                   - [Accept All] [Reject All]
                                   - [Restore Original]
                                              ↓
                              Apply Changes → Update Current Version
```

## Data Model

### New: ResumeVersion

```prisma
model ResumeVersion {
  id              String   @id @default(uuid())
  resumeId        String
  version         Int      // 1=original, 2+=subsequent
  label           String   // "Original", "v2 Optimized"
  personalInfo    Json
  summary         Json?
  education       Json[]
  experience      Json[]
  skills          Json[]
  projects        Json[]
  certifications  Json?
  languages       Json?
  markdown        String?
  createdAt       DateTime @default(now())
  resume          Resume   @relation(fields: [resumeId], references: [id], onDelete: Cascade)

  @@index([resumeId, version])
  @@map("resume_versions")
}
```

### Modified: Resume

Add to existing Resume model:
- `versions ResumeVersion[]`
- `currentVersionId String?`

### Enhanced: Optimization.suggestions Structure

```typescript
interface Suggestion {
  id: string;
  type: 'content' | 'keyword' | 'structure' | 'quantification';
  section: 'experience' | 'projects' | 'skills' | 'summary';
  sectionIndex: number;
  field: string;
  original: string;
  optimized: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/resumes/:id/optimize` | Manual trigger optimization |
| GET | `/resumes/:id/optimizations` | Get optimization list |
| GET | `/optimizations/:id` | Get optimization details with suggestions |
| PATCH | `/optimizations/:id/suggestions/:sugId/accept` | Accept single suggestion |
| PATCH | `/optimizations/:id/suggestions/:sugId/reject` | Reject single suggestion |
| POST | `/optimizations/:id/accept-all` | Accept all pending |
| POST | `/optimizations/:id/reject-all` | Reject all pending |
| POST | `/optimizations/:id/apply` | Apply accepted changes → new version |
| GET | `/resumes/:id/versions` | Version history |
| POST | `/resumes/:id/versions/:verId/restore` | Restore to version |

## AI Prompt Changes

### Optimization Prompt (Restructured)

Return structured JSON array of suggestions instead of free-text optimized content. Each suggestion must include:
- `original`: exact original text
- `optimized`: improved text with clear differences
- `reason`: explanation for the change
- `type`, `section`, `sectionIndex`, `field`: location metadata

## Frontend Components

### New Components
- `SuggestionDiffCard.tsx` - Enhanced card with inline diff viewer
- `InlineDiffViewer.tsx` - GitHub-style diff rendering (using react-diff-viewer-continued)
- `optimizationStore.ts` - Zustand store for optimization state
- `ResumeOptimizationPage.tsx` - Main review page/drawer

### Modified Components
- `SuggestionCard.tsx` - Add inline diff view mode
- `optimization-service.ts` - New API calls

## Implementation Phases

### P1: Database Migration + Backend Separation
- Prisma schema: Add ResumeVersion model
- Modify ai.queue.processor: Separate parse from optimize
- Modify resume.service: Auto-trigger optimization after parse

### P2: AI Prompt Refactor
- New generateSuggestions() method in ai.engine
- Updated prompt template for structured output
- Suggestion validation and normalization

### P3: API Endpoints + Version Logic
- New optimization controller endpoints
- ResumeVersionService for version management
- Apply/revert logic

### P4: Frontend Diff UI
- Install react-diff-viewer-continued
- Build SuggestionDiffCard with inline diff
- Optimization page with tabs by section
- WebSocket notification integration
