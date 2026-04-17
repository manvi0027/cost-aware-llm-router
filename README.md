# Cost-Aware LLM Model Router

A production-ready LLMOps routing system that intelligently selects between multiple language models based on query complexity and budget constraints to optimize both cost and response quality.

## Problem Statement

Large Language Models (LLMs) with higher capabilities incur significantly higher inference costs. This project provides:

**Cost Optimization**: Route simple queries to cheap models  
 **Quality Assurance**: Escalate complex queries to expert models  
 **Budget Enforcement**: Real-time cost tracking and limits  
 **Analytics**: Comprehensive usage and cost metrics

## Architecture

```
User Query
    ↓
API Gateway (Next.js)
    ↓
Difficulty Estimator → Cost Calculator
    ↓
Model Selector (with Budget Check)
    ↓
├─ Cheap Model (GPT-3.5) → $0.0005/1K tokens
├─ Mid-Tier (GPT-4 Turbo) → $0.01/1K tokens
└─ Expert (GPT-4) → $0.03/1K tokens
    ↓
Analytics Logger → Budget Tracker
```

## Features

- Intelligent query routing based on difficulty
- Real-time budget monitoring & enforcement
- Cascading fallback for budget constraints
- Comprehensive analytics and logging
- Docker containerization
- GitHub Actions CI/CD
- Mock LLM support (no API keys needed)

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# Clone repository
git clone https://github.com/manvi0027/cost-aware-llm-router.git
cd cost-aware-llm-router

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

Server runs at `http://localhost:3000`

### Using Docker

```bash
# Build image
npm run docker:build

# Run with Docker Compose
npm run docker:up
```

## API Usage

### Route Query

```bash
curl -X POST http://localhost:3000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "user_id": "user123",
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

### Check Budget

```bash
curl http://localhost:3000/api/budget
```

### Get Analytics (last 7 days)

```bash
curl "http://localhost:3000/api/metrics?days=7"
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

## Testing

```bash
npm test
npm run type-check
npm run lint
```

## Model Tiers

| Tier     | Model         | Cost       | Use Case            |
| -------- | ------------- | ---------- | ------------------- |
| Cheap    | GPT-3.5 Turbo | $0.0005/1K | Simple queries      |
| Mid-Tier | GPT-4 Turbo   | $0.01/1K   | Moderate complexity |
| Expert   | GPT-4         | $0.03/1K   | Complex reasoning   |

## Configuration

Edit `.env.local`:

```bash
MONTHLY_BUDGET=500
DAILY_BUDGET=20
ENABLE_MOCK_MODE=true
ENABLE_BUDGET_ENFORCEMENT=true
ENABLE_CASCADING=true
```

## Expected Results

- 60% cost savings by routing to cheaper models
- Query distribution: 75% cheap, 20% mid-tier, 5% expert
- Average latency: 250-500ms
- Budget accuracy: ±0.1%

## Author

**Manvi** - GitHub: @manvi0027

## License

MIT License
