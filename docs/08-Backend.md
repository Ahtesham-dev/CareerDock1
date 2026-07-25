# Backend

**Last Updated:** July 25, 2026
**Related Docs:** [API](./11-API.md), [Database](./10-Database.md), [Architecture](./02-Architecture.md)

---

## Overview

The backend is a Node.js/Express server with Mongoose ODM for MongoDB. It serves as both the API layer and the job ingestion engine.

## Directory Structure

```
server/
├── index.js              # Entry point: middleware, routes, MongoDB connect, scheduler start
├── scheduler.js          # Legacy cron scheduler (hourly scrapers, 30min alerts)
├── runAggregator.js      # CLI entry for manual scraper run
├── routes/               # 15 Express routers
├── models/               # 12 Mongoose models
├── middleware/            # Auth, admin, logger
├── engine/               # 7 stateless engines
├── services/             # Cache, email, matching, NLP, URL validation
├── scrapers/             # 9 legacy scrapers
├── pipeline/             # Modular pipeline ingestion (5 sources)
├── workers/              # Batch scripts
└── lib/                  # Shared utilities (browser launcher)
```

## Entry Point (`server/index.js`)

Load order:
1. Environment variables (dotenv)
2. **Startup validation** — JWT_SECRET, MONGO_URI required
3. Express app setup — helmet → CORS → global rate limiter (100/min) → JSON parser → request logger
4. Route mounting (15 route files under `/api/*`)
5. Pipeline rate limiter (20/min for `/api/pipeline/*`)
6. Error logger
7. Graceful shutdown handlers (SIGINT, SIGTERM, uncaughtException)
8. MongoDB connection → server start → scheduler initialization

## Routes

See [API Documentation](./11-API.md) for full endpoint reference.

## Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| Helmet | inline | Security headers |
| CORS | inline | Cross-origin, allow-listed origins |
| Rate Limiter | inline | 100 req/min global |
| Auth | `middleware/auth.js` | JWT Bearer token verification, sets req.userId |
| Admin | `middleware/admin.js` | Checks req.userId against ADMIN_USER_ID |
| Request Logger | `middleware/logger.js` | Logs METHOD URL (non-production only) |
| Error Logger | `middleware/logger.js` | Appends to `logs/error.log` |

## Engines

See [Engine Documentation](../server/engine/ENGINE_DOC.md) for detailed information on all 7 engines.

| Engine | File | Purpose |
|--------|------|---------|
| SearchEngine | `engine/searchEngine.js` | Full-text search with synonyms, faceted filters |
| RankingEngine | `engine/ranking.js` | 6-factor job ranking (0-1000) |
| RecommendationEngine | `engine/recommendation.js` | Personalized recommendations (4 types) |
| QualityEngine | `engine/qualityScore.js` | 8-factor quality scoring (0-100) |
| DedupEngine | `engine/deduplication.js` | 10-factor pairwise dedup with merge/flag |
| ATSMatcher | `engine/atsMatcher.js` | Resume vs. job matching |
| CareerIntelligence | `engine/careerIntelligence.js` | Market analytics |

## Services

See [Services Documentation](../server/services/SERVICES_DOC.md) for details.

| Service | File | Purpose |
|---------|------|---------|
| Cache | `services/cache.js` | Redis with in-memory fallback |
| Email | `services/email.js` | SMTP email sending |
| Matching | `services/matching/` | Job alert matching engine |
| NLP | `services/embeddings.js` | Tokenization, TF-IDF, similarity |
| Cleanup | `services/cleanupService.js` | Expiry, archival, health recalculation |

## Scrapers & Pipeline

See [Scrapers Documentation](./12-Scrapers.md) and detailed subsystem docs:
- [Legacy Scrapers](../server/scrapers/SCRAPERS_DOC.md) — 9 sources
- [Pipeline Ingestion](../server/pipeline/PIPELINE_DOC.md) — 5 sources
- [Two-Scheduler Verification](../server/TWO_SCHEDULER_VERIFICATION.md)

## Workers

See [Workers Documentation](../server/workers/WORKERS_DOC.md).

| Worker | File | Purpose |
|--------|------|---------|
| Dedup | `workers/dedupWorker.js` | Batch deduplication |
| Quality | `workers/qualityWorker.js` | Batch quality scoring |
| Recommendations | `workers/recommendationWorker.js` | Generate per-user recommendations |
