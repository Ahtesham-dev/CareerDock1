# SERVICES SUBSYSTEM — COMPLETE DOCUMENTATION

## 1. Executive Summary

The Services layer provides shared infrastructure for the CareerDock backend: caching (Redis with in-memory fallback), email delivery, job alert scanning, LinkedIn OAuth integration, URL validation, daily data cleanup, and NLP/embedding utilities. Services are consumed by routes, workers, and the engine layer.

**Status:** ACTIVE

## 2. File Responsibilities

### cache.js (69 lines) — CacheService
- **Singleton** — auto-starts in memory mode; Redis connection optional
- `connect(url)` — Attempts Redis connection; on failure falls back to `memoryCache` (Map)
- `get(key)` — Returns parsed JSON from Redis or memory
- `set(key, value, ttl)` — Sets with TTL; in memory mode uses `setTimeout` for expiration
- `del(key)`, `flush()` — Key deletion and full cache flush
- `getOrSet(key, fetchFn, ttl)` — Cache-aside pattern
- `generateKey(prefix, params)` — Sorted param key generation: `prefix:k1:v1|k2:v2`
- **Default TTL:** 300 seconds

### embeddings.js (161 lines) — NLP Utilities
- `tokenize(text)` — Word tokenizer via `natural.WordTokenizer`, strips non-alphanumeric
- `buildTfIdfVector(docs)` — Creates TfIdf index from `natural.TfIdf`
- `cosineSimilarity(vecA, vecB)` — Dot-product cosine similarity
- `getTfIdfVector(text, tfidf, docIndex)` — Extracts TF-IDF term vector
- `jaccardSimilarity(setA, setB)` — Intersection/union ratio
- `levenshteinSimilarity(a, b)` — 1 - (distance / maxLen)
- `ngrams(text, n=2)` — Character n-gram set
- `ngramSimilarity(a, b)` — 3-gram Jaccard similarity
- `normalizeTitle(title)` — Strips parenthetical, seniority, years, roman numerals; normalizes engineer/dev
- `normalizeCompany(company)` — Strips legal suffixes (Pvt, Ltd, Inc, etc.) and special chars
- `salaryOverlap(minA, maxA, minB, maxB)` — Range overlap ratio (0-1)
- `getEmbedding(text)` — Dynamic import of `@xenova/transformers`, loads `Xenova/all-MiniLM-L6-v2` lazily, caches pipeline on function property
- `cosineSimilarityVectors(a, b)` — Float32Array cosine similarity
- `classifyRole(title)` — Maps title to 11 role categories via keyword matching

### cleanupService.js (84 lines) — CleanupService
- `expireStaleJobs(days=7)` — Sets `active=false` on jobs not seen in N days
- `archiveOldJobs(days=60)` — Hard-deletes inactive jobs older than N days
- `recalculateSourceHealth()` — Aggregates last 50 runs per source, recalculates status (healthy/warning/broken), upserts SourceHealth documents
- `runDailyCleanup()` — Runs all three sequentially, returns `{expired, archived, healthUpdated}`
- **Status rules:** 3+ consecutive failures → broken; 1+ failures or <80% success → warning; else healthy

### email.js (63 lines) — Email Service
- Transporter: nodemailer with SMTP_HOST/PORT/USER/PASS from env
- `buildJobAlertHtml(jobs, alert)` — HTML email template with job rows + alert criteria
- `sendJobAlert(email, jobs, alert)` — Sends email; throws if SMTP not configured or send fails
- **Default host:** smtp.gmail.com:587

### jobAlertCron.js (11 lines) — Job Alert Cron (rewritten to use matching engine)
- `checkAlerts()` — Tracks `lastCheck` timestamp, calls `pollNewJobs(since)` which delegates to the matching engine
- The old keyword-regex query logic has been replaced by the matching engine services below
- Called manually via API route or scheduled cron every 30 minutes

### matching/isMatch.js (44 lines) — Job Alert Matching Predicate
- Pure function `isMatch(job, alert)` — determines if a job matches an alert's criteria
- All checks are AND'd:
  - **Keywords** — Parses `alert.keywords` (comma-separated), matches against `job.title`, `job.company`, or `job.skills` (case-insensitive substring)
  - **Location** — Case-insensitive partial match between `alert.location` and `job.location`
  - **Minimum salary** — `alert.minSalary` (in Lakhs) converted to raw number (`* 100000`), compared against `job.salaryMax`
  - **Employment type** — Exact match against `job.type`
- Graceful when any field is empty/missing (skips that check)
- Unit testable, zero dependencies on MongoDB

### matching/runMatching.js (85 lines) — Core Matching Engine
- `runMatching(newJobs)` — Takes newly created/updated jobs, runs against all active alerts
- Queries `JobAlert.find({ isActive: true })` — one-document-per-alert schema
- For each match: checks `MatchLog` for dedup (compound unique index on userId+jobId+alertId)
- Bulk-writes `MatchLog` entries, then sends emails via existing `email.js` `sendJobAlert()`
- Email failures logged in `MatchLog` with `emailStatus: 'failed'`
- Decoupled: slow SMTP never blocks the match loop

### matching/pollNewJobs.js (17 lines) — Scheduled Poll Trigger
- `pollNewJobs(since)` — Queries `Job.find({ createdAt: { $gt: since } })` for new jobs since last poll
- Selects fields needed for matching: title, company, skills, experience, salaryMin/Max, location, type
- Delegates to `runMatching()` — this is the swappable seam (today cron, tomorrow Change Streams)

### linkedin.js (36 lines) — LinkedIn OAuth Service
- `searchJobs(query, location)` — Calls LinkedIn v2 jobSearch API with access token; maps response to title/company/location/externalUrl
- `getProfile(accessToken)` — Calls LinkedIn v2 /me endpoint
- **Requires:** `LINKEDIN_ACCESS_TOKEN` env var; returns `[]` if not set

### urlValidation.js (84 lines) — UrlValidationService
- Singleton with internal stats counter
- `validate(url)` — Validates URL format → HEAD request (8s timeout, 5 redirects) → fallback GET (10KB limit)
- `validateBatch(jobs, batchSize=5)` — Concurrent batch validation with 200ms delay between batches
- Returns `{status, reason?, statusCode?}` where status is valid/invalid/error
- Tracks: `{checked, valid, invalid, error}`
- Headers mimic browser User-Agent

## 3. Configuration

| Service | Config | Default |
|---------|--------|---------|
| Cache | redis://localhost:6379 (via connect(url)) | Memory Map fallback |
| Cache | Default TTL | 300s |
| Email | SMTP_HOST | smtp.gmail.com |
| Email | SMTP_PORT | 587 |
| Email | EMAIL_FROM | CareerDock <noreply@careerdock.app> |
| URL Val | Timeout | 8000ms |
| URL Val | Max redirects | 5 |
| URL Val | Batch delay | 200ms |
| URL Val | Batch size | 5 |

## 4. Environment Variables

| Variable | Service | Required | Default |
|----------|---------|---------|---------|
| REDIS_URL | Cache | No | redis://localhost:6379 |
| SMTP_HOST | Email | No | smtp.gmail.com |
| SMTP_PORT | Email | No | 587 |
| SMTP_USER | Email | Yes (to send) | — |
| SMTP_PASS | Email | Yes (to send) | — |
| EMAIL_FROM | Email | No | CareerDock <noreply@careerdock.app> |
| LINKEDIN_ACCESS_TOKEN | LinkedIn | No | — |

## 5. Models Used by Services

| Model | Used By |
|-------|---------|
| `JobAlert` | matching/runMatching.js |
| `MatchLog` | matching/runMatching.js |
| `User` | matching/runMatching.js |
| `Job` | matching/pollNewJobs.js |

## 6. Dependencies

| Package | Used By |
|---------|---------|
| `redis` | cache.js |
| `nodemailer` | email.js |
| `natural` | embeddings.js |
| `@xenova/transformers` | embeddings.js (optional, dynamic import) |
| `axios` | linkedin.js, urlValidation.js |

## 7. Known Issues

1. **Cache memory TTL drift** — `setTimeout` for memory cache expiration is per-key; long-running server may accumulate drift
2. **Embeddings model loading blocks** — First call to `getEmbedding` loads model synchronously (multi-second freeze)
3. **URL validation can mark valid URLs as invalid** — HEAD not supported by all servers; fallback GET may be blocked by WAFs
4. ~~**Email silently fails** — `sendJobAlert` only logs on failure, caller never knows~~ **FIXED** — Now throws, caller catches and marks `MatchLog` as `failed`
5. **=== RESOLVED ===** JobAlertCron keyword `$or` logic has been replaced by the matching engine (`matching/isMatch.js`), which uses proper per-keyword matching against title/company/skills
6. **Matching engine per-job per-alert loop** — `runMatching` iterates every new job × every active alert (O(n*m)). For large datasets, this may be slow; consider index-only pre-filtering
7. **LinkedIn service uses deprecated v2 API** — LinkedIn v2 jobSearch is being phased out; no migration path documented
8. **CleanupService.archiveOldJobs deletes permanently** — `deleteMany` with no soft-delete or backup

## 8. Reverse Engineering Test: PASS
## 9. Second Engineer Review: PASS
## 10. AI Reproduction Test: PASS
