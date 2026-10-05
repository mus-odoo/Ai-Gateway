# AI Gateway

> A provider-agnostic abstraction layer for LLM integration across multiple platforms.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

[![Node](https://img.shields.io/badge/Node-%3E%3D18-green)](https://nodejs.org/)

[![License](https://img.shields.io/badge/License-Private-red)]

---

## Overview

**AI Gateway** is a shared abstraction layer that decouples our platforms
(currently: Edrak, Farah, and Alhamd Academy) from any single AI provider.

Instead of hardcoding calls to OpenAI, MiniMax, or any other provider inside
each platform, all AI requests pass through this Gateway. The Gateway:

- **Routes** requests to the most appropriate provider based on task type,
  data sensitivity, and platform policy.
- **Falls back** automatically if the primary provider fails.
- **Enforces** cost limits per platform and globally.
- **Tracks** usage and spending across all platforms.
- **Logs** every request for observability and auditing.

This design lets us **switch providers, negotiate pricing, and add new
providers without touching platform code**.

---

## Why This Exists

Before this Gateway, each platform would have:

- Its own OpenAI API calls
- Its own retry logic
- Its own cost tracking
- Its own provider selection

This created three problems:

1. **Duplication** — every fix had to be applied N times.
2. **Lock-in** — switching providers required rewriting platform code.
3. **Blind spots** — no unified view of AI spending.

The Gateway solves all three by being the **single point of contact** between
our platforms and the AI ecosystem.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Platforms (Edrak, Farah, Alhamd Academy)            │
│                                                      │
│    Every platform calls:                             │
│    aiGateway.generate({ taskType, prompt, ... })     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│                   AI Gateway                         │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Task     │  │ Cost     │  │ Fallback         │    │
│  │ Router   │  │ Guard    │  │ Manager          │    │ 
│  └──────────┘  └──────────┘  └──────────────────┘    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Logger   │  │ Cost     │  │ Response         │    │
│  │          │  │ Tracker  │  │ Validator        │    │
│  └──────────┘  └──────────┘  └──────────────────┘    │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ OpenAI  │  │ MiniMax │  │ Future  │
    │ Adapter │  │ Adapter │  │ Adapter │
    └─────────┘  └─────────┘  └─────────┘
```

---

## Features

| Feature                  | Description                                                                        |
|---                       |---                                                                                 |
| **Provider Abstraction** | Switch between OpenAI, MiniMax, or future providers without changing platform code |
| **Task-Based Routing**   | Route each task type to the best-suited provider                                   |
| **Sensitivity Rules**    | Enforce which providers can handle which data sensitivity levels                   |
| **Platform Policies**    | Per-platform budgets, preferred providers, and fallbacks                           |
| **Automatic Fallback**   | If primary provider fails, fall back to secondary                                  |
| **Cost Guard**           | Prevent spending beyond monthly limits                                             |
| **Cost Tracking**        | Track spending by platform, provider, and task type                                |
| **Structured Logging**   | JSON logs for every request                                                        |
| **Type-Safe API**        | Full TypeScript types for all inputs and outputs                                   |

---

## Installation

### From GitHub Packages

First, create a `.npmrc` file in your project root:

```
@mus-odoo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @mus-odoo/ai-gateway
```

You need a GitHub personal access token with `read:packages` scope,
set as `GITHUB_TOKEN` in your environment.

### From GitHub Directly (Alternative)

```bash
npm install github:mus-odoo/Ai-Gateway#v0.1.0
```

---

## Quick Start

### 1. Set up environment variables

Create a `.env` file in your project root:

```bash
# OpenAI Provider
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ENABLED=true

# MiniMax Provider
MINIMAX_API_KEY=xxxxxxxxxxxxxxxx
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_ENABLED=true

# Cost Limits (USD)
AI_GATEWAY_MONTHLY_LIMIT_GLOBAL=1000
AI_GATEWAY_MONTHLY_LIMIT_EDRAK=500
AI_GATEWAY_MONTHLY_LIMIT_FARAH=250
AI_GATEWAY_MONTHLY_LIMIT_ALHAMD=250
```

### 2. Initialize the Gateway

```typescript
import {
  AIGateway,
  createProvidersFromEnv,
  defaultRoutingRules,
} from '@mus-odoo/ai-gateway';

const gateway = new AIGateway({
  providers: createProvidersFromEnv(),
  routingRules: defaultRoutingRules,
  costLimits: {
    globalMonthlyLimitUsd: 1000,
    platformLimits: {
      edrak: 500,
      farah: 250,
      'alhamd-academy': 250,
    },
  },
});
```

### 3. Make a request

```typescript
const response = await gateway.generate({
  taskType: 'risk_analysis',
  prompt: 'Analyze the no-show risk for patient Ahmed tomorrow.',
  systemPrompt: 'You are an operational risk analyst in a healthcare platform.',
  dataSensitivity: 'confidential',
  maxTokens: 1024,
  context: { platform: 'edrak' },
});

console.log(response.content);
console.log('Provider:', response.provider);
console.log('Cost (USD):', response.estimatedCost);
```

---

## Core Concepts

### Task Types

Each request declares its `taskType`. The Gateway uses this to select the
best provider.

| Task Type            | Typical Use                     | Default Provider |
|---                   |---                              |---               |
| `risk_analysis`      | Operational risk assessment     | OpenAI           |
| `content_generation` | Marketing / course descriptions | MiniMax          |
| `summarization`      | Condensing long text            | MiniMax          |
| `classification`     | Categorizing inputs             | MiniMax          |
| `code_generation`    | Writing or fixing code          | OpenAI           |
| `translation`        | Language translation            | MiniMax          |
| `recommendation`     | Personalized suggestions        | OpenAI           |
| `data_extraction`    | Structured data from text       | MiniMax          |
| `content_moderation` | Checking content safety         | OpenAI           |
| `student_qa`         | Q&A for learners                | MiniMax          |

### Data Sensitivity Levels

Each request declares its data sensitivity. This restricts which providers
are allowed to handle it.

| Level          | Description           | Allowed Providers               |
|---             |---                    |---                              |
| `public`       | Public information    | OpenAI, MiniMax                 |
| `internal`     | Internal use only     | OpenAI, MiniMax                 |
| `confidential` | Business-sensitive    | OpenAI, MiniMax                 |
| `sensitive`    | Highly sensitive      | OpenAI only                     |
| `sovereign`    | Regulatory / national | OpenAI only (or local provider) |

### Platform Rules

Each platform has its own preferred provider, fallback provider, and monthly
budget. These are defined in `defaultRoutingRules`.

---

## API Reference

### `AIGateway`

#### `constructor(config: AIGatewayConfig)`

```typescript
interface AIGatewayConfig {
  providers: AIProvider[];
  routingRules: RoutingRules;
  costLimits: CostLimits;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

#### `generate(request: GenerateRequest): Promise<GenerateResponse>`

Generates a response from the most appropriate provider.

```typescript
interface GenerateRequest {
  taskType: TaskType;
  prompt: string;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  thinkingDepth?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  dataSensitivity: DataSensitivity;
  requiresZeroRetention?: boolean;
}
```

```typescript
interface GenerateResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  estimatedCost: number;
  latencyMs: number;
  confidence?: number;
}
```

#### `getCostReports()`

Returns a breakdown of spending by platform, provider, and task type.

```typescript
const reports = gateway.getCostReports();
// {
//   total: 12.45,
//   byPlatform: { edrak: 8.20, farah: 2.15, 'alhamd-academy': 2.10 },
//   byProvider: { openai: 9.50, minimax: 2.95 },
//   byTaskType: { risk_analysis: 6.10, content_generation: 3.20, ... }
// }
```

#### `getRemainingBudget(platform?: string): number`

Returns the remaining budget for a platform (or globally).

---

## Adding a New Provider

To add a new provider (e.g., Anthropic, Google Gemini):

### 1. Create the adapter

Create `src/providers/anthropic.provider.ts`:

```typescript
import { BaseProvider, ProviderError } from './base.provider';
import { GenerateRequest, GenerateResponse, CostEstimate } from '../types';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';

  constructor(config: { apiKey: string }) {
    super();
    // ...
  }

  async isAvailable(): Promise<boolean> {
    // ...
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    // ...
  }

  async estimateCost(request: GenerateRequest): Promise<CostEstimate> {
    // ...
  }
}
```

### 2. Register it in the factory

Update `src/providers/provider.factory.ts` to include the new provider.

### 3. Add routing rules

Update `src/routing/routing-rules.ts` to include the new provider in
sensitivity rules and platform rules.

### 4. Done

No platform code needs to change. The Gateway will start routing
appropriate requests to the new provider.

---

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
git clone https://github.com/mus-odoo/Ai-Gateway.git
cd Ai-Gateway
npm install
```

### Build

```bash
npm run build
```

Output goes to `dist/`.

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

---

## Publishing a New Version

The package is published to GitHub Packages automatically when a new
GitHub Release is created.

### Steps

1. Update `version` in `package.json` (e.g., `0.1.0` → `0.2.0`).
2. Commit and push to `main`.
3. Create a Git tag:

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

4. Create a GitHub Release from that tag.
5. GitHub Actions will build, test, and publish automatically.

---

## Project Structure

```
Ai-Gateway/
├── src/
│   ├── index.ts                    # Public API
│   ├── gateway.ts                  # Main orchestrator
│   ├── providers/                  # Provider adapters
│   │   ├── base.provider.ts        # Base interface
│   │   ├── openai.provider.ts
│   │   ├── minimax.provider.ts
│   │   └── provider.factory.ts
│   ├── routing/                    # Request routing
│   │   ├── task-router.ts
│   │   └── routing-rules.ts
│   ├── governance/                 # Cost and policy
│   │   └── cost-guard.ts
│   ├── resilience/                 # Fallback and retry
│   │   └── fallback.ts
│   ├── observability/              # Logging and metrics
│   │   ├── logger.ts
│   │   └── cost-tracker.ts
│   └── types/                      # Shared types
│       └── index.ts
├── tests/                          # Test suites
├── examples/                       # Usage examples
├── dist/                           # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── .npmrc
└── README.md
```

---

## Roadmap

- [x] Core Gateway implementation
- [x] OpenAI and MiniMax adapters
- [x] Task-based routing
- [x] Cost guard and tracking
- [x] Automatic fallback
- [ ] Circuit breaker for failing providers
- [ ] Response caching layer
- [ ] Metrics export (Prometheus)
- [ ] Anthropic adapter
- [ ] Google Gemini adapter
- [ ] Local model support (Ollama, vLLM)
- [ ] Admin dashboard for cost monitoring

---

## Contributing

This is a private package. For internal contributions:

1. Create a feature branch from `main`.
2. Follow the existing code style (TypeScript strict, ESLint).
3. Add tests for new functionality.
4. Open a Pull Request with a clear description.

---

## License

Private and proprietary. All rights reserved.

Not for public distribution.

---

## Contact

For questions or issues, contact the maintainer:

- **Maintainer**: mus-odoo
- **Repository**: https://github.com/mus-odoo/Ai-Gateway


---

## ملاحظات على هذا الـ README

### لماذا هذه البنية؟

1. **يبدأ بـ Overview** — يفهم القارئ فوراً ما هي الحزمة ولماذا وُجدت.
2. **يشرح "لماذا" قبل "كيف"** — لأن هذا يساعد على فهم قرارات التصميم.
3. **يحتوي مخططاً بصرياً** — يساعد على الفهم السريع.
4. **يوفر Quick Start** — يمكن لأي مطور جديد أن يبدأ في دقائق.
5. **يوثق المفاهيم الأساسية** — task types، sensitivity levels، platform rules.
6. **يشرح كيف يُضاف مزود جديد** — نقطة قوة الحزمة.
7. **يوفر Roadmap** — يظهر أن المشروع حي ومتطور.
8. **يحتوي على قسم Publishing** — لأن الحزمة ستُنشر بشكل دوري.

### ما الذي قد تريد تعديله لاحقاً؟

| القسم                  | متى تعدّله                 |
|---                     |---                         |
| **Roadmap**            | عند إنجاز ميزة جديدة     |
| **Task Types**         | عند إضافة مهمة جديدة     |
| **Sensitivity Levels** | عند تغيير السياسات        |
| **Contact**            | عند تغيير المسؤول         |
| **License**            | عند تغيير نموذج الترخيص  |

---
