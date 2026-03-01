# Automated Job Search Module

## Overview

The Automated Job Search Module is a comprehensive AI-powered solution for automating the job hunting process. Built on a multi-agent architecture, this system handles the complete job search lifecycle from aggregation to application submission and tracking.

## 🎯 Features

- **Job Position Aggregation**: Collect job postings from 25+ recruitment platforms
- **AI-Powered Matching**: Intelligent job-candidate matching using semantic analysis
- **Automated Applications**: Auto-fill and submit job applications
- **Application Tracking**: Monitor application status and manage follow-ups
- **Multi-Agent System**: Coordinated agents for scraping, parsing, matching, and communication

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Agent Documentation](#agent-documentation)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  Search  │  Applications  │  Analytics  │  Settings  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
├─────────────────────────────────────────────────────────────┤
│              REST API │ WebSocket │ GraphQL (optional)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Agent System                          │
├─────────────────────────────────────────────────────────────┤
│  Orchestrator  │  MCP Message Bus  │  Agent Coordinator     │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Scraper  │ │ Parser   │ │ Matcher  │ │ Apply    │       │
│  │ Agent    │ │ Agent    │ │ Agent    │ │ Agent    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ┌──────────┐ ┌──────────┐                                  │
│  │ Track    │ │ Communic-│                                  │
│  │ Agent    │ │ ator     │                                  │
│  │          │ │ Agent    │                                  │
│  └──────────┘ └──────────┘                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  Vector DB  │  Message Queue       │
└─────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

| Agent            | Responsibility         | Key Features                                 |
| ---------------- | ---------------------- | -------------------------------------------- |
| **Scraper**      | Job data collection    | Rate limiting, proxy rotation, anti-blocking |
| **Parser**       | Data extraction        | NLP, skill identification, quality scoring   |
| **Matcher**      | Job-candidate matching | Semantic similarity, skill matching, scoring |
| **Apply**        | Application submission | Resume customization, form filling           |
| **Track**        | Status monitoring      | Application tracking, analytics              |
| **Communicator** | Employer communication | Email handling, response generation          |

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm or npm

### Step 1: Install Dependencies

```bash
cd packages/backend
pnpm install
```

### Step 2: Configure Environment

Create `.env` file in `packages/backend`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/intervai"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Job Search Configuration
JOB_SEARCH_ENABLED=true
PROXY_SERVICE_URL="https://proxy-service.com"
PROXY_PROVIDER="brightdata"

# AI/ML Services
EMBEDDING_MODEL="text-embedding-3-small"
MATCHING_ALGORITHM_VERSION="v1"

# Rate Limiting
SCRAPER_RATE_LIMIT_PER_SECOND=0.33
SCRAPER_RATE_LIMIT_PER_MINUTE=10
```

### Step 3: Database Migration

```bash
pnpm prisma:migrate
```

## Quick Start

### Basic Job Search

```typescript
import { JobSearchService } from './job-search/services/job-search.service';

const jobSearchService = new JobSearchService();

// Search for jobs
const results = await jobSearchService.searchJobs({
  keywords: ['Software Engineer', 'Full Stack'],
  location: 'San Francisco, CA',
  remotePolicy: RemotePolicy.HYBRID,
  salaryMin: 150000,
  experienceLevel: [ExperienceLevel.MID, ExperienceLevel.SENIOR],
});

console.log(`Found ${results.jobs.length} matching jobs`);
console.log(`Average match score: ${results.avgMatchScore}`);
```

### Configure User Preferences

```typescript
import { UserProfileService } from './job-search/services/user-profile.service';

const userProfileService = new UserProfileService();

// Update user preferences
await userProfileService.updatePreferences(userId, {
  preferredRoles: ['Senior Software Engineer', 'Tech Lead'],
  preferredIndustries: ['Technology', 'Fintech'],
  minSalary: 180000,
  remotePreference: RemotePolicy.REMOTE,
  preferredLocations: ['San Francisco', 'New York'],
  companySizePrefs: [CompanySize.MEDIUM, CompanySize.LARGE],
});
```

### Enable Auto-Apply

```typescript
import { ApplicationAutomationService } from './job-search/services/application-automation.service';

const automationService = new ApplicationAutomationService();

// Enable automated applications
await automationService.enableAutoApply(userId, {
  dailyLimit: 10,
  minMatchScore: 0.75,
  requireUserReview: false,
  customizeResume: true,
  generateCoverLetter: true,
});
```

## Agent Documentation

### Scraper Agent

The Scraper Agent collects job postings from multiple platforms.

**Usage**:

```typescript
import { ScraperAgent } from './job-search/agents/scraper.agent';

const scraperAgent = new ScraperAgent();

// Configure for specific platform
scraperAgent.configure('linkedin', {
  platform: 'linkedin',
  enabled: true,
  rateLimit: {
    requestsPerSecond: 0.33,
    requestsPerMinute: 10,
    requestsPerHour: 100,
  },
  proxyConfig: {
    enabled: true,
    provider: 'brightdata',
    rotationStrategy: 'per_request',
  },
});

// Collect jobs
const result = await scraperAgent.collectJobs({
  keywords: ['Software Engineer'],
  location: 'San Francisco',
});

console.log(`Collected ${result.jobs.length} jobs`);
console.log(`Success rate: ${result.metrics.successRate}`);
```

**Supported Platforms**:

- LinkedIn Jobs
- Indeed
- Glassdoor
- ZipRecruiter
- CareerBuilder
- Monster
- And 20+ more

### Parser Agent

The Parser Agent extracts structured data from raw job postings.

**Usage**:

```typescript
import { ParserAgent } from './job-search/agents/parser.agent';

const parserAgent = new ParserAgent();

// Parse a raw job
const result = await parserAgent.parseJob(rawJob);

if (result.success) {
  console.log(`Parsed job: ${result.job.title}`);
  console.log(`Company: ${result.job.company}`);
  console.log(`Skills identified: ${result.job.preferredSkills.length}`);
  console.log(`Quality score: ${result.qualityScore}`);
} else {
  console.error('Parsing failed:', result.errors);
}
```

**Extracted Fields**:

- Job title and company
- Location and remote policy
- Salary range
- Required and preferred skills
- Experience level
- Employment type

### Matcher Agent

The Matcher Agent calculates job-candidate compatibility.

**Usage**:

```typescript
import { MatcherAgent } from './job-search/agents/matcher.agent';

const matcherAgent = new MatcherAgent();

// Match jobs with user profile
const matches = await matcherAgent.matchJobs(jobs, userId, userProfile);

// Display top matches
matches.slice(0, 5).forEach((match) => {
  console.log(`Job: ${match.job.title}`);
  console.log(`Match Score: ${(match.matchScore * 100).toFixed(1)}%`);
  console.log(`Matched Skills: ${match.matchedSkills.join(', ')}`);
  console.log(`Explanation: ${match.explanation}`);
  console.log('---');
});
```

**Matching Components**:

- Semantic similarity (40%)
- Skill match (30%)
- Preference alignment (20%)
- Temporal factors (10%)

## API Reference

### REST API Endpoints

#### Search Jobs

```http
POST /api/v1/job-search/search
Content-Type: application/json
Authorization: Bearer {token}

{
  "keywords": ["Software Engineer"],
  "location": "San Francisco, CA",
  "remotePolicy": "HYBRID",
  "salaryMin": 150000,
  "experienceLevel": ["MID", "SENIOR"]
}
```

**Response**:

```json
{
  "jobs": [
    {
      "jobId": "uuid",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "matchScore": 0.87,
      "matchedSkills": ["JavaScript", "React", "Node.js"],
      "missingSkills": ["Kubernetes"],
      "explanation": "Excellent match! Your skills align well..."
    }
  ],
  "total": 150,
  "avgMatchScore": 0.72
}
```

#### Get Application Status

```http
GET /api/v1/job-search/applications/{applicationId}/status
Authorization: Bearer {token}
```

#### Update Preferences

```http
PUT /api/v1/job-search/preferences
Content-Type: application/json
Authorization: Bearer {token}

{
  "preferredRoles": ["Senior Software Engineer"],
  "remotePreference": "REMOTE",
  "minSalary": 180000
}
```

#### Get Analytics

```http
GET /api/v1/job-search/analytics
Authorization: Bearer {token}
```

## Configuration

### Scraper Configuration

```yaml
scraper:
  enabled: true
  platforms:
    - name: linkedin
      enabled: true
      rateLimit:
        requestsPerSecond: 0.33
        requestsPerMinute: 10
      proxy:
        enabled: true
        provider: brightdata
        rotation: per_request
    - name: indeed
      enabled: true
      rateLimit:
        requestsPerSecond: 0.5
        requestsPerMinute: 20
      proxy:
        enabled: true
        provider: oxylabs
        rotation: per_session
```

### Matching Configuration

```yaml
matching:
  weights:
    semantic: 0.4
    skillMatch: 0.3
    preference: 0.2
    temporal: 0.1

  thresholds:
    minimumMatchScore: 0.5
    autoApplyThreshold: 0.75

  features:
    enableSemanticMatching: true
    enableSkillInference: true
    enableExperienceMatching: true
```

### Application Automation Configuration

```yaml
automation:
  enabled: true
  dailyLimit: 10
  requireUserReview: false

  resume:
    customizePerJob: true
    highlightRelevantSkills: true

  coverLetter:
    generate: true
    useAITemplates: true

  formFilling:
    autoFill: true
    saveCredentials: true
```

## Development

### Project Structure

```
src/job-search/
├── agents/
│   ├── scraper.agent.ts
│   ├── parser.agent.ts
│   ├── matcher.agent.ts
│   ├── apply.agent.ts
│   ├── track.agent.ts
│   └── communicator.agent.ts
├── services/
│   ├── job-aggregation.service.ts
│   ├── job-matching.service.ts
│   ├── application-automation.service.ts
│   └── user-profile.service.ts
├── interfaces/
│   └── job-search.interface.ts
├── dto/
│   └── job-search.dto.ts
├── controllers/
│   └── job-search.controller.ts
└── job-search.module.ts
```

### Running in Development

```bash
# Start backend with job search module
pnpm dev

# Run specific agent
pnpm dev --filter @interview-ai/backend -- job-search:dev
```

### Adding New Platforms

1. Create platform-specific scraper:

```typescript
// src/job-search/agents/scrapers/platform-name.scraper.ts
export class PlatformNameScraper {
  async scrape(criteria: SearchCriteria): Promise<RawJob[]> {
    // Implementation
  }
}
```

2. Register in ScraperAgent:

```typescript
// In scraper.agent.ts
case 'platform-name':
  return await this.scrapePlatformName(criteria, proxy);
```

3. Update configuration:

```yaml
scraper:
  platforms:
    - name: platform-name
      enabled: true
```

## Testing

### Unit Tests

```bash
pnpm test job-search
```

### Integration Tests

```bash
pnpm test:integration job-search
```

### E2E Tests

```bash
pnpm test:e2e job-search
```

### Example Test

```typescript
describe('MatcherAgent', () => {
  it('should calculate correct match score', async () => {
    const job = createMockJob({
      skills: ['React', 'TypeScript', 'Node.js'],
    });
    const user = createMockUser({
      skills: ['React', 'TypeScript', 'JavaScript'],
    });

    const match = await matcherAgent.calculateMatch(job, user);

    expect(match.matchScore).toBeGreaterThan(0.7);
    expect(match.matchedSkills).toContain('React');
    expect(match.matchedSkills).toContain('TypeScript');
  });
});
```

## Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t job-search-service .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_HOST=redis \
  job-search-service
```

### Kubernetes Deployment

See `deployment/job-search/` for Kubernetes manifests.

```bash
kubectl apply -f deployment/job-search/
```

### Environment Variables

```bash
# Production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_HOST=redis-cluster
LOG_LEVEL=info
```

## Monitoring

### Metrics

Key metrics exposed via Prometheus:

- `job_search_jobs_collected_total`: Total jobs collected
- `job_search_parse_errors_total`: Parsing errors
- `job_search_match_scores`: Match score distribution
- `job_search_application_success_rate`: Application success rate
- `job_search_agent_latency_seconds`: Agent response latency

### Dashboards

Grafana dashboards available at `/grafana`:

- Job Collection Overview
- Agent Performance
- Application Tracking
- System Health

### Alerts

Configured alerts:

- High scraping failure rate (> 10%)
- Low match accuracy (< 70%)
- Application submission failures
- Agent health degradation

## Troubleshooting

### Common Issues

#### Issue: Jobs not being collected

**Solution**:

1. Check scraper logs for errors
2. Verify proxy connectivity
3. Check rate limit configuration
4. Review platform ToS changes

#### Issue: Poor match accuracy

**Solution**:

1. Review user profile completeness
2. Check skill extraction accuracy
3. Adjust matching weights
4. Collect user feedback

#### Issue: Application submissions failing

**Solution**:

1. Verify credentials are saved
2. Check form-filling logs
3. Review platform-specific handlers
4. Test with manual application

### Logs

```bash
# View recent logs
pnpm logs job-search

# Filter by agent
pnpm logs job-search --grep "ScraperAgent"

# Follow logs
pnpm logs job-search -f
```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug pnpm dev
```

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../../LICENSE) for details.

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@intervai.com

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-27
