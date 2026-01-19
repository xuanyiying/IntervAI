# IntervAI - System Architecture

## Overview

This document provides a comprehensive view of the system architecture, including frontend, backend, databases, caching, and AI integration layers.

## High-Level Architecture

The system follows a layered architecture pattern, separating concerns between client presentation, business logic, data storage, and external AI services.

```mermaid
graph TB
    Client[Clients] --> LB[Load Balancer]
    LB --> API[Backend API]
    
    subgraph "Application Layer"
        API --> Auth[Auth Module]
        API --> Biz[Business Modules]
        Biz --> Agent[Agent Orchestrator]
    end

    subgraph "Data Layer"
        Biz --> DB[(PostgreSQL)]
        Biz --> Cache[(Redis)]
        Biz --> Storage[Object Storage]
    end

    subgraph "AI Services"
        Agent --> Providers[AI Providers]
        Providers --> LLMs[External LLMs]
        Agent --> VectorDB[(Vector DB)]
    end

    LLMs --> OpenAI
    LLMs --> DeepSeek
    LLMs --> Qwen
```

## Component Details

### 1. Frontend Architecture

The frontend is built with React 18, utilizing a feature-based folder structure.

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI[UI Components]
        Store[Zustand Store]
        Service[API Services]
        Router[React Router]
    end

    Page[Pages] --> UI
    UI --> Store
    Store --> Service
    Service --> Network[Network Layer]
```

### 2. Backend Module Architecture

The backend uses NestJS modules to encapsulate business logic.

```mermaid
graph TB
    Gateway[API Gateway] --> AuthMod[Auth Module]
    Gateway --> ResumeMod[Resume Module]
    Gateway --> InterviewMod[Interview Module]
    Gateway --> AgentMod[Agent Module]

    subgraph "Core Modules"
        ResumeMod --> Parser[Parser Service]
        InterviewMod --> Session[Session Manager]
        AgentMod --> Orchestrator[Orchestrator]
    end

    subgraph "Infrastructure"
        Orchestrator --> AI[AI Factory]
        Parser --> Queue[BullMQ]
    end
```

### 3. Data Flow - Resume Upload & Optimization

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Queue
    participant AI
    participant DB

    User->>API: Upload Resume
    API->>DB: Create Record
    API->>Queue: Add Parse Job
    API-->>User: 202 Accepted

    Queue->>AI: Parse Content
    AI-->>Queue: Structured Data
    Queue->>DB: Update Record
    
    User->>API: Request Optimize
    API->>AI: Generate Suggestions
    AI-->>API: Suggestions
    API-->>User: Result
```

### 4. Data Flow - Mock Interview

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant AI
    participant DB

    User->>Agent: Start Session
    Agent->>AI: Generate Question
    AI-->>Agent: Question
    Agent->>DB: Save State
    Agent-->>User: Send Question

    User->>Agent: Submit Answer
    Agent->>AI: Evaluate Answer
    AI-->>Agent: Feedback
    Agent->>DB: Save Interaction
    Agent-->>User: Feedback + Next Q
```

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State**: Zustand
- **UI**: Tailwind CSS + Ant Design

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Queue**: BullMQ (Redis)
- **Validation**: Zod / Class-validator

### Infrastructure
- **Database**: PostgreSQL (Primary Data)
- **Vector DB**: pgvector (Embeddings)
- **Cache**: Redis
- **Storage**: MinIO / S3

## Security Architecture

1. **Authentication**: JWT-based stateless auth.
2. **Authorization**: RBAC (Role-Based Access Control).
3. **Data Protection**: Encrypted secrets, sanitized inputs.
4. **Network**: HTTPS everywhere, CORS whitelisting.

## Deployment Architecture

```mermaid
graph TB
    Internet --> Nginx
    Nginx --> App1[NestJS Node 1]
    Nginx --> App2[NestJS Node 2]
    
    App1 --> Redis
    App2 --> Redis
    
    App1 --> Postgres
    App2 --> Postgres
    
    App1 --> S3
    App2 --> S3
```
