# WORKERS SUBSYSTEM — COMPLETE DOCUMENTATION

## 1. Executive Summary

The Workers subsystem provides standalone executable scripts and programmatic entry points for running batch operations: deduplication, quality scoring, and recommendation generation. Each worker wraps an Engine component, can be run via `node` directly or imported programmatically. Workers are invoked by scheduler cron jobs or admin API routes.

**Status:** ACTIVE

## 2. File Responsibilities

### dedupWorker.js (34 lines)
- `runDedupWorker(options)` — Calls `DedupEngine.deduplicate({ lookbackDays, batchSize, useEmbeddings })`
- Options: `lookbackDays` (default 7), `batchSize` (default 200), `useEmbeddings` (default false), `schedule`
- CLI: `node dedupWorker.js [lookbackDays]` — exits with code 0 on success, 1 on error
- Logs: processed/merged/flagged counts

### qualityWorker.js (30 lines)
- `runQualityWorker(options)` — Calls `QualityEngine.scoreAllJobs()` or `QualityEngine.refreshQualityScores()` based on `refresh` flag
- Options: `batchSize` (default 200), `refresh` (default false)
- CLI: `node qualityWorker.js [--refresh]` — `--refresh` flag enables full re-scoring
- Logs: count of jobs scored/refreshed

### recommendationWorker.js (106 lines)
- `runRecommendationWorker(options)` — Iterates users (capped at batchSize), generates 4 recommendation types per user:
  1. **Job recs** — `getRecommendations(userId, { limit: 10 })`
  2. **Skill recs** — `getSkillRecommendations(userId)`
  3. **Company recs** — `getCompanyRecommendations(userId)`
  4. **Career path recs** — `getCareerPathRecommendations(userId)`
- Stores results in Recommendation model: clears old recommendations first (`deleteMany`), then inserts per-type documents
- Options: `batchSize` (default 50 — max users per run)
- CLI: `node recommendationWorker.js [batchSize]`
- Warning: sequential per-user processing — no parallelization

## 3. Data Flow

```
Scheduler / Admin Route
  │
  ├─ runDedupWorker()
  │   └─ DedupEngine.deduplicate() → batch cursor → bulkWrite updates on Job collection
  │
  ├─ runQualityWorker()
  │   └─ QualityEngine.scoreAllJobs() / refreshQualityScores() → bulkWrite updates on Job collection
  │
  └─ runRecommendationWorker()
      └─ User.find().limit(batchSize) → for each user:
           RecommendationEngine.getRecommendations()
           + getSkillRecommendations()
           + getCompanyRecommendations()
           + getCareerPathRecommendations()
           → Recommendation.deleteMany + insertMany
```

## 4. CLI Usage

```bash
# Dedup: last 7 days
node server/workers/dedupWorker.js

# Dedup: last 14 days
node server/workers/dedupWorker.js 14

# Quality: score unscored jobs
node server/workers/qualityWorker.js

# Quality: refresh all scores
node server/workers/qualityWorker.js --refresh

# Recommendations: process first 100 users
node server/workers/recommendationWorker.js 100
```

## 5. Known Issues

1. **Recommendation worker sequential** — Processes users one at a time with no parallelization via Promise.all
2. **No checkpoint/restart** — If worker crashes mid-batch, no progress is saved; all users in current batch must be re-processed
3. **Recommendation delete-then-insert** — `deleteMany` then `insertMany` per type is not atomic; partial failures leave gaps
4. **Thundering herd** — Workers are invoked directly from API admin routes; multiple rapid requests trigger parallel worker runs on the same data
5. **No dedup memory optimization** — `useEmbeddings` default is `false` for performance; enabling it on large datasets may cause OOM

## 6. Reverse Engineering Test: PASS
## 7. Second Engineer Review: PASS
## 8. AI Reproduction Test: PASS
