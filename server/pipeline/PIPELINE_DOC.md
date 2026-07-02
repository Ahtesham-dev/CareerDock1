# Pipeline Ingestion Subsystem — Documentation

## 1. Overview

The pipeline ingestion subsystem (`server/pipeline/`) is a modular, multi-stage job ingestion system that fetches jobs from various sources, normalizes, validates, deduplicates, and persists them to MongoDB. It coexists with the legacy scraper system (`server/scrapers/`) but is designed to eventually replace it.

**Total: 36 source files, ~3,300 lines of JavaScript.**

---

## 2. Architecture

```
Scheduler (cron) ──→ Orchestrator ──→ JobQueue ──→ SourceAdapter (fetch)
                                                      │
                                                      ▼
                                                  Normalizer
                                                      │
                                                      ▼
                                                  Validator
                                                      │
                                                      ▼
                                                  Deduplicator
                                                      │
                                                      ▼
                                                  Storage (MongoDB)
                                                      │
                                                      ▼
                                                  markExpired / archiveOldJobs
```

**Two activation paths:**
- Scheduled: `server/pipeline/scheduler/index.js` (cron)
- Manual: `POST /api/pipeline/run` or `node runPipeline.js`

---

## 3. Directory Structure

```
server/pipeline/
├── index.js                    # Module entry point / public API
├── orchestrator.js             # Central orchestration engine
├── runPipeline.js              # CLI runner
├── setupIndexes.js             # MongoDB index creation script
├── models/
│   ├── index.js                # Barrel
│   ├── Job.js                  # PipelineJob schema (same `jobs` collection as legacy)
│   ├── PipelineRun.js          # PipelineRun schema (tracks each run)
│   └── CompanyRegistry.js      # YC company registry schema
├── processors/
│   ├── index.js                # Barrel
│   ├── normalizer.js           # JobNormalizer — title/location/skill normalization, hash gen
│   ├── validator.js            # JobValidator — quality checks, spam detection
│   ├── deduplicator.js         # DeduplicationEngine — hash/URL/exact/fuzzy dedup
│   └── storage.js              # StorageLayer — upsert, expiry, archival
├── sources/
│   ├── index.js                # Barrel — creates 5 source adapters
│   ├── baseAdapter.js          # SourceAdapter base class
│   ├── ycombinator/
│   │   ├── index.js            # YCombinatorAdapter — company registry + ATS extractors
│   │   ├── directExtractor.js  # YCDirectExtractor — generic HTML/JSON-LD scraping
│   │   └── companyRegistry.js  # YCCompanyRegistry — syncs from yc-oss API
│   ├── peerlist/index.js       # PeerlistAdapter — Puppeteer-based scraping
│   ├── cutshort/index.js       # CutshortAdapter — 33 skill-specific pages
│   ├── instahyre/index.js      # InstahyreAdapter — REST API paginated
│   └── hirect/index.js         # HirectAdapter — stub (mobile-only, 0 jobs)
├── extractors/
│   ├── index.js                # Barrel — routes to correct ATS extractor
│   ├── greenhouse.js           # GreenhouseExtractor — boards API
│   ├── lever.js                # LeverExtractor — postings API
│   ├── ashby.js                # AshbyExtractor — posting API
│   ├── workable.js             # WorkableExtractor — JSON-LD + API fallback
│   └── teamtailor.js           # TeamtailorExtractor — REST API
├── queue/
│   ├── index.js                # JobQueue — in-process task queue with concurrency/retry
│   └── rateLimiter.js          # RateLimiter — token-bucket rate limiting
├── scheduler/index.js          # PipelineScheduler — cron-based automated runs
├── routes/
│   ├── pipeline.js             # Pipeline admin endpoints
│   └── jobs.js                 # Public job query endpoints
├── monitoring/
│   ├── index.js                # Barrel
│   ├── logger.js               # PipelineLogger — in-memory structured logging
│   └── health.js               # HealthMonitor — in-memory source health tracking
```

---

## 4. Configuration

### Environment Variables

| Variable | Default | Used In | Purpose |
|----------|---------|---------|---------|
| `MONGO_URI` | *(required)* | `runPipeline.js:11`, `setupIndexes.js:5` | MongoDB connection string |
| `CHROME_PATH` | *(not set)* | Peerlist via `lib/browser/launcher` | Explicit Chrome/Chromium path |
| `PUPPETEER_EXECUTABLE_PATH` | *(not set)* | Peerlist via `lib/browser/launcher` | Alternate Chrome/Chromium path |
| `PIPELINE_SCHEDULE_FULL` | `'0 */2 * * *'` | `server/src/jobs/config/index.js` (read but IGNORED by scheduler — see C17) | Full pipeline cron schedule |

### Pipeline-Specific Config (hardcoded in code)

| Setting | Value | Location |
|---------|-------|----------|
| Queue concurrency | 3 | `orchestrator.js:10` |
| Queue retryMax | 2 | `orchestrator.js:10` |
| Queue baseDelay | 2000ms | `orchestrator.js:10` |
| Full pipeline cron | `0 */2 * * *` | `scheduler/index.js:16` |
| YC refresh cron | `30 */6 * * *` | `scheduler/index.js:22` |
| Peerlist refresh cron | `0 */4 * * *` | `scheduler/index.js:27` |
| Cutshort refresh cron | `0 */6 * * *` | `scheduler/index.js:33` |
| Instahyre refresh cron | `0 */6 * * *` | `scheduler/index.js:39` |
| Hirect refresh cron | `0 */6 * * *` | `scheduler/index.js:45` |
| Daily maintenance cron | `0 3 * * *` | `scheduler/index.js:51` |
| Mark expired after | 7 days | `orchestrator.js:112`, `storage.js:71` |
| Archive after | 60 days | `storage.js:87` |
| Dedup lookback | 30 days | `deduplicator.js:46` |
| Dedup fuzzy threshold | 0.9 | `deduplicator.js:86` |
| Dedup max loaded jobs | 50,000 | `deduplicator.js:47` |

---

## 5. Models

### PipelineJob (`models/Job.js`)
- **Collection:** `jobs` (explicit 3rd arg to `mongoose.model`)
- **Fields:** title, company, companySlug, location, remote, salaryMin, salaryMax, currency, experience, skills, description, applyUrl, source, sourceJobId, postedAt, lastSeenAt, expiresAt, logo, tags, hash, active, dupGroup, dupConfidence, qualityScore, qualityBreakdown, validated, applyUrlStatus, lastValidatedAt, searchText, metadata
- **14 indexes** including text index `pipeline_job_fulltext` on title/company/description/skills/location/tags
- `timestamps: true` — auto createdAt/updatedAt

### PipelineRun (`models/PipelineRun.js`)
- **Collection:** `pipelineruns`
- **Fields:** pipeline, source, status (enum: running/success/failed/partial), startedAt, completedAt, duration, jobsFound, jobsNew, jobsUpdated, jobsDeduped, jobsExpired, jobsRejected, errorMessages, warnings, metadata, trigger (enum: scheduled/manual/startup)

### CompanyRegistry (`models/CompanyRegistry.js`)
- **Collection:** `companyregistries`
- **Fields:** name, normalizedName, website, careersUrl, careersPlatform, industry, batch, description, logo, ycUrl, tags, jobsLastFetched, active, source

---

## 6. Sources

### YCombinatorAdapter (`sources/ycombinator/index.js`)
- Fetches jobs from all YC companies via company registry + ATS extractors
- Discovers companies from yc-oss API (`https://yc-oss.github.io/api/companies/`)
- For each company, tries ATS-specific extractor (Greenhouse/Lever/Ashby/Workable/Teamtailor), falls back to directExtractor
- Rate-limited with 500-2000ms delay between companies

### YCCompanyRegistry (`sources/ycombinator/companyRegistry.js`)
- Syncs YC company data from yc-oss API into MongoDB
- Falls back to HTML scraping of `https://www.ycombinator.com/companies` if API fails
- Detects careers platform from URL (greenhouse > lever > ashby > workable > teamtailor > ... > direct)

### YCDirectExtractor (`sources/ycombinator/directExtractor.js`)
- Generic HTML scraper for YC companies without known ATS
- Tries JSON-LD extraction first, then HTML parsing
- Searches 17 known career page URL patterns (/careers, /jobs, /join-us, etc.)
- Two-phase HTML extraction: anchor links → CSS card selectors (results concatenated, no dedup)

### PeerlistAdapter (`sources/peerlist/index.js`)
- Uses Puppeteer to render Peerlist.io's JavaScript-heavy page
- Navigates to `https://peerlist.io/jobs`, waits for networkidle0 + 5s
- Extracts jobs from `__NEXT_DATA__` JSON (3 fallthrough paths)
- **Requires Chromium** — see Deployment section

### CutshortAdapter (`sources/cutshort/index.js`)
- Scrapes 33 skill-specific pages (reactjs, python, nodejs, etc.)
- Extracts from `__NEXT_DATA__` JSON at 8-level depth
- Stops at 300 jobs total
- **Fragile** — extraction path depends on Cutshort's Next.js data structure

### InstahyreAdapter (`sources/instahyre/index.js`)
- Calls `https://www.instahyre.com/api/v1/job_search` with XMLHttpRequest header
- Paginates with offset (0, 50, 100, ...), max 10 pages
- Deduplicates by `id` in memory

### HirectAdapter (`sources/hirect/index.js`)
- **Stub** — Hirect is mobile-only with no public API
- Always returns `[]`

---

## 7. Extractors

All extractors follow the same interface: `canHandle(url)` → boolean, `extractJobs(companyName, careersUrl)` → job array.

| Extractor | Detection | API | Max Pages |
|-----------|-----------|-----|-----------|
| Greenhouse | "greenhouse" in URL | `boards-api.greenhouse.io/v1/boards/{token}/jobs` | Unlimited (no cap — see C16) |
| Lever | "lever.co" in URL | `api.lever.co/v0/postings/{domain}` | Single request |
| Ashby | "ashby" in URL | `api.ashbyhq.com/posting-api/job-board/{domain}` | Single request |
| Workable | "workable" in URL | HTML JSON-LD → fallback `apply.workable.com/api/v3/accounts/{subdomain}/jobs` | Single request |
| Teamtailor | "teamtailor" in URL | `{domain}.teamtailor.com/api/v1/jobs?include=location` | Single request |

---

## 8. Processors

### Normalizer (`processors/normalizer.js`)
- Expands title abbreviations (SDE→Software Development Engineer, etc.)
- Maps location aliases (Bengaluru→Bangalore, Bombay→Mumbai, 15 total)
- Maps skill aliases (reactjs→React, nodejs→Node.js, 24 total)
- Generates hash: `sha256(title.toLowerCase().trim() + '|||' + company.toLowerCase().trim() + '|||' + location.toLowerCase().trim())`
- Generates tags from title, skills, remote/internship/entry-level flags
- Strips tracking parameters from URLs (utm_*, fbclid, gclid, ref, source)
- Normalizes experience level from title keywords (Senior/Fresher/Mid-level)

### Validator (`processors/validator.js`)
- Title minimum 3 characters
- Company minimum 2 characters
- Apply URL must be present and valid
- Description minimum 50 characters (warning, not error)
- Spam detection: 16 patterns + ALL-CAPS ratio > 0.7 + title length > 5
- Score: starts at 100, subtracts 25 per error, 10 per warning

### Deduplicator (`processors/deduplicator.js`)
- Loads existing jobs from last 30 days (max 50,000)
- Checks in order: hash match → URL match → exact match (source+sourceJobId or title+company+location+source) → fuzzy match (Jaro-Winkler, threshold 0.9, title 60% + company 40%)
- Also deduplicates within incoming batch

### Storage (`processors/storage.js`)
- Upserts via find-before-update pattern (not `findOneAndUpdate`)
- Query priority: `{ source, sourceJobId }` → `{ hash }` → `{ title, company, location, source }`
- `markExpired(source, 7 days)`: sets `active: false` for unseen jobs
- `archiveOldJobs(60 days)`: deletes inactive jobs older than 60 days

---

## 9. Queue

### JobQueue (`queue/index.js`)
- In-process task queue (not Redis-backed)
- Default concurrency: 3 (configured in orchestrator; class default is 5)
- Exponential backoff retry: `baseDelay * 2^(attempt-1) + random(0, 1000)`
- Emits events: `completed`, `failed`, `retry`
- **Known:** `pause()`/`resume()` are non-functional — `_process()` never checks `this.active`

### RateLimiter (`queue/rateLimiter.js`)
- Token-bucket algorithm
- Default: 2 requests/second, burst 5
- Used by YCombinator source adapter between company requests

---

## 10. Orchestrator

`orchestrator.js` is the central coordination engine.

### `runFullPipeline(options)`
- Default sources: `['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect']`
- Enqueues each source as a separate queue task
- Each task: fetch → normalize → validate (default: on) → dedup (default: on) → save → markExpired (default: on)
- Drains queue, updates PipelineRun record
- Optional: archive (default: off)

### `runSource(sourceKey, options)`
- Single-source run with same processing pipeline
- Creates PipelineRun record, handles errors with `'failed'` status
- Returns per-source stats

### `_drainQueue()`
- Polls every 500ms via `setTimeout` until queue is empty
- **No timeout safeguard** — will hang if a task never completes

---

## 11. Scheduler

`PipelineScheduler` (`scheduler/index.js`) runs on a cron schedule after `server/index.js` starts the pipeline subsystem.

**Startup delay:** 15 seconds before initial `runFullPipeline()`.

**Schedules:**

| Cron | Action | Sources |
|------|--------|---------|
| `0 */2 * * *` | Full pipeline | All 5 |
| `30 */6 * * *` | YC registry refresh | ycombinator |
| `0 */4 * * *` | Peerlist refresh | peerlist |
| `0 */6 * * *` | Cutshort refresh | cutshort |
| `0 */6 * * *` | Instahyre refresh | instahyre |
| `0 */6 * * *` | Hirect refresh | hirect |
| `0 3 * * *` | Daily maintenance | (markExpired + archiveOldJobs) |

**Locking:** Single `isRunning` flag prevents pipeline-internal overlaps. No cross-scheduler locking with the legacy scheduler (`server/scheduler.js`). See `server/TWO_SCHEDULER_VERIFICATION.md` for the verification that source sets are disjoint (no data corruption risk).

---

## 12. Routes

### Pipeline Admin (`routes/pipeline.js`)
- `POST /run` — run full pipeline (defaults: `['ycombinator', 'peerlist']` — only 2, not all 5)
- `POST /run/:source` — run single source
- `POST /refresh-companies` — refresh YC company registry
- `GET /stats` — aggregated pipeline stats (DB + in-memory health)
- `GET /sources/health` — in-memory source health (resets on restart)
- `GET /sources` — list all available sources
- `GET /runs` — query PipelineRun records
- `GET /runs/:id` — single run detail
- `GET /companies` — list CompanyRegistry entries
- `GET /companies/:id` — single company detail
- `DELETE /expired` — trigger expiry + archival

### Public Jobs (`routes/jobs.js`)
- `GET /` — list/search with filters (q, skills, source, location, remote, exp, salary, active, sort)
- `GET /search` — text search via `$text`/`$meta:'textScore'` with `$regex` fallback
- `GET /company/:company` — jobs by company name
- `GET /source/:source` — jobs by source
- `GET /:id` — single job by _id
- `GET /sources/counts` — per-source aggregation

---

## 13. Monitoring

### PipelineLogger (`monitoring/logger.js`)
- Structured logging with levels: DEBUG(0), INFO(1), WARN(2), ERROR(3)
- Circular buffer (max 10,000 entries by default)
- Methods: `debug()`, `info()`, `warn()`, `error()`
- Query: `getRecent(100)`, `getErrors(50)`, `getStats()`
- Creates child loggers via `child(source)` — each processor/source gets its own instance

### HealthMonitor (`monitoring/health.js`)
- **In-memory only** — resets on server restart
- Per-source stats: total/success/failed runs, last run/success timestamps, last error, jobs found/saved, avg duration, consecutive failures, uptime %
- Does NOT persist to MongoDB's `SourceHealth` collection (used by legacy system)
- Available via `GET /api/pipeline/sources/health`

---

## 14. CLI & Scripts

| Command | File | Purpose |
|---------|------|---------|
| `npm run pipeline:run` | `runPipeline.js` | Run full pipeline |
| `npm run pipeline:yc` | `runPipeline.js --source ycombinator` | Run YC only |
| `npm run pipeline:peerlist` | `runPipeline.js --source peerlist` | Run Peerlist only |
| `npm run pipeline:refresh-companies` | `runPipeline.js --refresh-only` | Refresh YC registry only |
| `npm run pipeline:setup-indexes` | `setupIndexes.js` | Create all MongoDB indexes |

---

## 15. Data Flow

```
START (scheduler / API / CLI)
  │
  ├─ Orchestrator creates PipelineRun record
  │
  ├─ For EACH source (concurrent via queue, concurrency=3):
  │   │
  │   ├─ 1. FETCH: SourceAdapter.fetchJobs()
  │   │      (HTTP API / Puppeteer / HTML scrape)
  │   │
  │   ├─ 2. NORMALIZE: normalizer.normalize(rawJob)
  │   │      title expansion, location aliasing, skill mapping, hash, tags
  │   │
  │   ├─ 3. VALIDATE: validator.validate(normalizedJob)  [optional]
  │   │      reject spam, low quality, missing fields
  │   │
  │   ├─ 4. DEDUP: deduplicator.deduplicate(validJobs)   [optional]
  │   │      hash > URL > exact > fuzzy (Jaro-Winkler)
  │   │
  │   ├─ 5. STORE: storage.saveJobs(keepJobs, source)
  │   │      upsert by source+sourceJobId > hash > title+company+location+source
  │   │
  │   └─ 6. EXPIRE: storage.markExpired(source, 7d)      [optional]
  │
  ├─ Orchestrator drains queue (polls every 500ms)
  │
  ├─ ARCHIVE: storage.archiveOldJobs(60d)                 [optional]
  │
  └─ Orchestrator updates PipelineRun record (success/failed)
```

---

## 16. Deployment

### Requirements

| Dependency | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Runtime |
| MongoDB | 4.4+ | Database (replica set recommended for text search scoring) |
| Chromium | (system) | Required for Peerlist scraper only |

### Docker

The `Dockerfile` at project root uses `node:20-bookworm-slim`. If deploying via Docker:

- Peerlist scraper will work if Chromium is installed in the container
- Puppeteer's bundled Chromium works on Debian (glibc) but NOT on Alpine (musl)
- Set `PUPPETEER_SKIP_DOWNLOAD=true` and `PUPPETEER_EXECUTABLE_PATH` if using system Chromium

### Railway

The `railway.json` uses the Nixpacks builder (deprecated; being replaced by Railpack).
- Railway will use the Dockerfile if present
- For Nixpacks/Railpack without Dockerfile, Chromium must be installed via `RAILPACK_DEPLOY_APT_PACKAGES`

### Health Check

`GET /api/health` — returns `{ status: 'ok', uptime, timestamp }`
`GET /api/pipeline/stats` — detailed pipeline stats including DB stats and source health

---

## 17. Dependencies

### npm Packages

| Package | Version | Used By |
|---------|---------|---------|
| `puppeteer` | ^21.6.1 | Peerlist adapter, Naukri scraper |
| `axios` | ^1.6.2 | All HTTP-based sources and extractors |
| `cheerio` | ^1.0.0 | HTML parsing (linkedin, internshala, careerPages, directExtractor, companyRegistry) |
| `node-cron` | ^3.0.3 | Scheduler |

### External APIs

| Service | Endpoint | Used By |
|---------|----------|---------|
| yc-oss API | `https://yc-oss.github.io/api/companies/` | YCCompanyRegistry |
| Peerlist.io | `https://peerlist.io/jobs` | PeerlistAdapter (Puppeteer) |
| Cutshort.io | `https://cutshort.io/{skill}-jobs` | CutshortAdapter |
| Instahyre | `https://www.instahyre.com/api/v1/job_search` | InstahyreAdapter |
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/{token}/jobs` | GreenhouseExtractor |
| Lever | `https://api.lever.co/v0/postings/{domain}` | LeverExtractor |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/{domain}` | AshbyExtractor |
| Workable | `https://apply.workable.com/api/v3/accounts/{subdomain}/jobs` | WorkableExtractor |
| Teamtailor | `https://{domain}.teamtailor.com/api/v1/jobs` | TeamtailorExtractor |

---

## 18. Known Issues

| ID | Issue | Location | Severity |
|----|-------|----------|----------|
| I1 | MongoDB `$text` with `$meta:'textScore'` requires replica set | `routes/jobs.js:78-104` | Medium — falls back to `$regex` silently |
| I2 | Dual route hierarchy: `/api/jobs` (legacy) + `/api/pipeline/jobs` (pipeline) both query same `jobs` collection | `server/index.js:28,54` | Low — transitional |
| I3 | Pipeline scheduler hardcodes cron schedule — ignores `PIPELINE_SCHEDULE_FULL` env var | `scheduler/index.js:16` | Medium |
| I4 | POST /run defaults to only `['ycombinator', 'peerlist']` (not all 5 sources) | `routes/pipeline.js:17` | Medium |
| I5 | `_drainQueue()` has no timeout — hangs if a task never completes | `orchestrator.js:251-258` | Medium |
| I6 | Queue `pause()`/`resume()` are non-functional | `queue/index.js:78-85` | Low |
| I7 | Cutshort `__NEXT_DATA__` path is 8 levels deep — fragile to site changes | `sources/cutshort/index.js:88` | High |
| I8 | Peerlist `__NEXT_DATA__` extraction: empty array `[]` at path 1 short-circuits paths 2/3 | `sources/peerlist/index.js:108-110` | Medium |
| I9 | Greenhouse pagination has no maximum page cap | `extractors/greenhouse.js` | Medium |
| I10 | HealthMonitor is in-memory only — resets on restart | `monitoring/health.js` | Medium |
| I11 | Normalizer skill key `'golang '` has trailing space — never matches | `processors/normalizer.js` | Negligible |
| I12 | `PipelineRun.status` field includes `'partial'` in enum but never set | `models/PipelineRun.js` | Negligible |
| I13 | DirectExtractor two-phase HTML extraction concatenates results without dedup | `sources/ycombinator/directExtractor.js` | Low |
| I14 | Route `active=string('true')` — no way to filter inactive-only | `routes/jobs.js` | Low |
| I15 | Dual scheduler architecture — no cross-locking (source sets are disjoint, verified safe) | `scheduler/index.js` + `server/scheduler.js` | Low (see `server/TWO_SCHEDULER_VERIFICATION.md`) |

---

## 19. Corrections Reference

The file `PIPELINE_DOC_CORRECTIONS.md` contains 25 corrections (C1-C25) that document specific issues, gaps, and discrepancies found during documentation review. Each correction cross-references the relevant section of this document. Key corrections:

- **C1 (Text search replica set):** See I1 above
- **C3 (Dual scheduler concurrency):** Verified disjoint sources — see `server/TWO_SCHEDULER_VERIFICATION.md`
- **C4 (Hash format):** Pipeline uses 3-part hash, legacy uses variable — affects cross-system dedup
- **C5 (In-memory health):** See I10 above
- **C10 (Missing env vars):** CHROME_PATH and PUPPETEER_EXECUTABLE_PATH added to `.env.example`
- **C12 (Docker Chromium):** Docker base image switched to `node:20-bookworm-slim`
- **C17 (Scheduler ignores env var):** See I3 above
- **C19 (puppeteer-core undeclared):** Peerlist now uses shared launcher from `server/lib/browser/`
- **C23 (Cutshort fragility):** See I7 above
- **C25 (Route defaults differ):** See I4 above

---

## 20. Testing

The pipeline subsystem has no dedicated unit tests. The 5 existing Jest test suites at `server/__tests__/` cover application controllers and services only. Pipeline modules are exercised only during manual runs or integration testing.

**Relevant test commands:**
- `npm test` — runs all Jest suites (none cover pipeline)
- `npm run pipeline:run` — full manual pipeline run (requires MongoDB)

---

## 21. Future Development

### Short-term improvements
- Add unit tests for processors (normalizer, validator, deduplicator, storage)
- Add timeout to `_drainQueue()`
- Fix Cutshort extraction path to be more resilient
- Add pagination cap to Greenhouse extractor
- Fix Peerlist NEXT_DATA fallthrough logic

### Medium-term consolidation
- Eliminate dual route hierarchy (migrate `/api/jobs` to pipeline routes)
- Persist pipeline health monitoring to MongoDB
- Consolidate scheduler configuration to respect environment variables

### Source adapter expansion
- The `server/src/jobs/` adapter layer (documented separately in `JOBS_ADAPTER_DOC.md`) is a more recent facade that mirrors this pipeline with additional unified scheduling. It is currently inactive (not connected to server startup).
