# Jobs Adapter Layer — Documentation

## Overview

The `server/src/jobs/` directory is an **adapter/facade layer** designed to sit between the application's higher-level logic and the underlying pipeline/job processing infrastructure. Its stated goals are:

1. Unify legacy scrapers (`server/scrapers/`) with the newer pipeline system (`server/pipeline/`).
2. Provide a single importable module (`index.js`) that exposes all job-related services, adapters, and configuration.
3. Abstract away scraper-specific details behind a `BaseAdapter` interface.
4. Offer a `LegacyWrapperAdapter` to wrap old scraper classes as adapters.

**However, as of the current codebase audit, this layer is entirely dead code.** No file in `server/` (including `server/index.js`, the server entry point) imports from `server/src/jobs/` at runtime. The only reference to this directory in the entire project is a documentation correction file (`server/pipeline/PIPELINE_DOC_CORRECTIONS.md`, line 362) that *suggests* the pipeline scheduler should import `config` from here.

The pipeline and legacy systems are activated directly from `server/index.js` without going through this facade layer.

---

## Architecture Diagram (Text/ASCII)

```
  server/index.js
       |
       +--- require('./scheduler')           [Legacy scraper scheduler]
       |         |
       |         +--- runAllScrapers()  ───►  server/scrapers/
       |         +--- runScraper('JSearch')
       |         +--- checkAlerts()
       |         +--- cleanupService.runDailyCleanup()
       |
       +--- require('./pipeline/scheduler')  [Pipeline scheduler]
                 |
                 +--- orchestrator.runFullPipeline()
                            |
                            +--- pipeline/sources/  [Adapters: ycombinator, peerlist, cutshort, instahyre, hirect]
                            +--- pipeline/processors/  [normalizer, deduplicator, validator, storage]
                            +--- pipeline/queue/
                            +--- pipeline/models/
                                      |
                                      +--- mongoose.model('PipelineJob', ..., 'jobs')
                                      +--- mongoose.model('CompanyRegistry', ...)
                                      +--- mongoose.model('PipelineRun', ...)


  server/src/jobs/  (THIS LAYER — NOT CONNECTED)
       |
       +--- index.js  (re-exports everything below)
       +--- config/
       +--- adapters/
       |     +--- base/BaseAdapter.js
       |     +--- base/LegacyWrapperAdapter.js
       |     +--- yc/YCAdapter.js
       |     +--- peerlist/PeerlistAdapter.js
       |     +--- lever/LeverAdapter.js
       |     +--- greenhouse/GreenhouseAdapter.js
       |     +--- ashby/AshbyAdapter.js
       +--- services/
       |     +--- JobNormalizer.js           ──► wraps pipeline/processors/normalizer
       |     +--- ValidationService.js       ──► wraps pipeline/processors/validator
       |     +--- DeduplicationService.js    ──► wraps pipeline/processors/deduplicator + scrapers/dedup
       |     +--- SearchIndexService.js      ──► builds search text from job fields
       |     +--- CompanyDiscoveryService.js ──► wraps pipeline YC company registry
       |     +--- CareerPageCrawler.js       ──► wraps pipeline extractors
       |     +--- SchedulerService.js        ──► wraps legacy scraper + pipeline scheduler
       +--- queue/JobQueue.js                ──► wraps pipeline/queue
       +--- workers/JobWorker.js             ──► orchestrates fetch → normalize → validate → dedup → save
       +--- models/                          (empty directory)
       +--- logs/                            (empty directory)
```

---

## File-by-File Documentation

### 1. `server/src/jobs/index.js`

**Purpose:** Barrel file that imports and re-exports every module in the `jobs` layer. Also provides a `getAdapter(sourceName)` factory function.

**Dependencies:**
- `./adapters/yc/YCAdapter`
- `./adapters/peerlist/PeerlistAdapter`
- `./adapters/greenhouse/GreenhouseAdapter`
- `./adapters/lever/LeverAdapter`
- `./adapters/ashby/AshbyAdapter`
- `./adapters/base/LegacyWrapperAdapter`
- All 7 service files
- `./queue/JobQueue`
- `./workers/JobWorker`
- `./config`

**Exports:** All classes/instances and the `getAdapter` function.

**Important details:**
- `getAdapter()` maps lowercase source names to adapter instances. Only supports: `ycombinator`, `peerlist`, `greenhouse`, `lever`, `ashby`.
- `SchedulerService` is exported but never imported by any caller.
- `JobWorker` is exported as a singleton (`module.exports = new JobWorker()` in its own file), then re-exported here.

**Known issues:**
- `getAdapter` creates new instances on each call (no caching).
- Does not include `cutshort`, `instahyre`, `hirect` — sources that the pipeline's orchestrator actually runs.

---

### 2. `server/src/jobs/config/index.js`

**Purpose:** Central configuration for the jobs layer, with environment variable overrides.

**Configuration (with defaults):**

| Key | Env Variable | Default | Description |
|-----|-------------|---------|-------------|
| `concurrency` | `PIPELINE_CONCURRENCY` | `3` | Max concurrent pipeline tasks |
| `retryMax` | `PIPELINE_RETRY_MAX` | `3` | Max retries per task |
| `baseDelay` | `PIPELINE_BASE_DELAY` | `2000` | Base delay in ms for retry backoff |
| `schedules.full` | `PIPELINE_SCHEDULE_FULL` | `'0 */2 * * *'` | Full pipeline cron (every 2h) |
| `schedules.yc` | `PIPELINE_SCHEDULE_YC` | `'30 */6 * * *'` | YC-specific cron (2x/day) |
| `schedules.peerlist` | `PIPELINE_SCHEDULE_PEERLIST` | `'0 */4 * * *'` | Peerlist cron (4x/day) |
| `schedules.maintenance` | `PIPELINE_SCHEDULE_MAINTENANCE` | `'0 3 * * *'` | Daily maintenance (3am) |
| `dedup.lookbackDays` | — | `30` | Days to look back for duplicate detection |
| `dedup.fuzzyThreshold` | — | `0.9` | Fuzzy match confidence threshold |
| `expiry.markInactiveDays` | — | `7` | Days after which jobs are marked inactive |
| `expiry.archiveDays` | — | `60` | Days after which jobs are archived |

**Mongoose models used:** None.

**Important details:**
- The default schedule values mirror those hardcoded in `server/pipeline/scheduler/index.js`, but the pipeline scheduler does **not** import this config. Changing env vars will update this config object but have no effect on actual scheduling.
- The `concurrency`/`retryMax`/`baseDelay` defaults (3/3/2000) differ slightly from the pipeline queue's own defaults (5/3/1000).

---

### 3. `server/src/jobs/queue/JobQueue.js`

**Purpose:** Thin wrapper around the pipeline's queue (`server/pipeline/queue/`). Provides the same API: `enqueue`, `enqueueBatch`, `size`, `getStats`, `on`.

**Dependencies:** `../../../pipeline/queue` (the `JobQueue` class)

**Mongoose models used:** None.

**Important details:**
- The constructor creates a new pipeline `JobQueue` instance with `new (require(...))(options)`.
- This wrapper adds no additional behavior — it is a pure delegation layer.
- **Not used anywhere** in the running application.

---

### 4. `server/src/jobs/workers/JobWorker.js`

**Purpose:** Orchestrates the full "fetch → normalize → validate → deduplicate → save" pipeline for a given adapter. This is the central execution unit.

**Dependencies (internal to this layer):**
- `../services/JobNormalizer`
- `../services/ValidationService`
- `../services/DeduplicationService`

**Dependencies (external):**
- `../../../pipeline/models` → `PipelineJob` (Mongoose model)

**Mongoose models used:**
- `PipelineJob` (from `pipeline/models/Job.js`, collection `jobs`)

**Does it write to the `jobs` collection?**
- Yes. Line 26: `PipelineJob.findOneAndUpdate(...)` with `upsert: true` saves jobs to the `jobs` collection via the `PipelineJob` model.

**Important details:**
- `process(adapter, context)` is the main method.
- Data flow within `process`:
  1. `adapter.fetchJobs(context)` → raw jobs
  2. `JobNormalizer.normalizeBatch(rawJobs)` → normalized
  3. `ValidationService.filterValid(normalized)` → valid only
  4. `DeduplicationService.deduplicate(valid)` → keep (non-duplicates)
  5. For each kept job: `PipelineJob.findOneAndUpdate` with upsert
- Uses `$or` matching on `hash` OR `{ source, sourceJobId }` to find existing records.
- Sets `lastSeenAt`, `updatedAt` on update; `createdAt` on insert.
- Exported as a singleton (`module.exports = new JobWorker()`).

**Known issues:**
- `$or` with `.filter(Boolean)` on each condition means if both `hash` and `sourceJobId` are empty, the filter produces an empty array `[]` which would cause the `$or` to match **all documents** — a potentially catastrophic bug. However, in practice `normalize()` in `BaseAdapter` always sets a hash, so this path is unlikely to trigger.
- The `LegacyWrapperAdapter` generates `sourceJobId` from a base64-encoded title+company, so it will always be present.
- Does not use the `searchText` or full-text indexing on save (unlike `pipeline/processors/storage` which does).

---

### 5. `server/src/jobs/services/JobNormalizer.js`

**Purpose:** Delegates job normalization to the pipeline's normalizer.

**Dependencies:** `../../../pipeline/processors/normalizer`

**Mongoose models used:** None.

**Important details:**
- Thin delegation: `normalize(job)` → `pipelineNormalizer.normalize(job)`
- `normalizeBatch(jobs)` maps `normalize` over the array.
- Exported as a singleton.

---

### 6. `server/src/jobs/services/ValidationService.js`

**Purpose:** Delegates job validation to the pipeline's validator.

**Dependencies:** `../../../pipeline/processors/validator`

**Mongoose models used:** None.

**Important details:**
- `validate(job)` → `pipelineValidator.validate(job)` which returns `{ valid: boolean, errors: string[] }`.
- `filterValid(jobs)` splits jobs into `{ valid: [], rejected: [] }` arrays.
- Exported as a singleton.

---

### 7. `server/src/jobs/services/DeduplicationService.js`

**Purpose:** Provides both pipeline-based deduplication and legacy deduplication.

**Dependencies:**
- `../../../pipeline/processors/deduplicator`
- `../../../scrapers/dedup`

**Mongoose models used:** None directly (delegates to pipeline's deduplicator which uses `PipelineJob`).

**Important details:**
- `deduplicate(jobs, options)` → pipeline's deduplicator.
- `legacyDedup()` → legacy scrapers' deduplicateJobs().
- `getStats()` → pipeline deduplicator stats.
- Exported as a singleton.

**Known issues:**
- The legacy dedup path (`../../../scrapers/dedup`) may operate on different fields/collections than the pipeline dedup, potentially causing inconsistencies if both were used.

---

### 8. `server/src/jobs/services/SearchIndexService.js`

**Purpose:** Builds search text and keyword fields from a job object. Intended for populating the `searchText` field on `PipelineJob` for full-text search.

**Dependencies:** `../../../pipeline/models` → `PipelineJob` (imported but not used in this file — may be leftover from planned functionality).

**Mongoose models used:** None directly (destructured but unused).

**Important details:**
- `buildSearchText(job)` returns `{ searchText, companyKeywords, skillKeywords, locationKeywords }`.
- Concatenates title, company, skills, location, tags into a single lowercase string for `searchText`.
- Exported as a singleton.

**Known issues:**
- The `PipelineJob` import on line 1 is destructured but never referenced in the method — likely dead code or preparation for a future `saveSearchIndex()` method.

---

### 9. `server/src/jobs/services/CompanyDiscoveryService.js`

**Purpose:** Discovers Y Combinator companies using the pipeline's company registry.

**Dependencies:** `../../../pipeline/sources/ycombinator/companyRegistry`

**Mongoose models used:** None directly (delegates to `YCCompanyRegistry` which uses `CompanyRegistry` model).

**Important details:**
- Constructs a new `YCCompanyRegistry` instance each time the class is instantiated.
- `discoverYCBatch(batch)` calls `registry._discoverBatch(batch)` (note: calls a private `_` prefixed method).
- `refreshAll()` calls `registry.refresh()`.
- Exported as a **class** (not a singleton), unlike most other services in this layer.

**Known issues:**
- Calling `_discoverBatch` (a private-convention method) is fragile; the method signature could change without notice.
- No caching; every `new CompanyDiscoveryService()` creates a fresh registry.

---

### 10. `server/src/jobs/services/CareerPageCrawler.js`

**Purpose:** Crawls company career pages by detecting the ATS platform and using the appropriate extractor.

**Dependencies:**
- `../../../pipeline/extractors` → `getExtractor` function
- `../../../pipeline/sources/ycombinator/directExtractor`

**Mongoose models used:** None.

**Important details:**
- `detectPlatform(careersUrl)` calls `getExtractor(careersUrl)` which returns an extractor for Lever, Greenhouse, Ashby, etc., or `null`.
- `crawl(company, careersUrl)`:
  - If an extractor is detected, uses it.
  - Otherwise falls back to a generic YC direct extractor (which does generic HTML scraping).
- Exported as a class.

**Known issues:**
- The fallback to `YCDirectExtractor` is YC-specific despite the generic method name. Calling `crawl()` on a non-YC company with an undetected platform will try to use a YC-specific scraper.
- No rate limiting or concurrency control.

---

### 11. `server/src/jobs/services/SchedulerService.js`

**Purpose:** Provides a unified scheduler that can start either the legacy scraper cron or the pipeline scheduler cron.

**Dependencies:**
- `node-cron`
- `../../../pipeline/scheduler` (the pipeline scheduler singleton)
- `../../../scrapers/aggregator` → `runAllScrapers`

**Mongoose models used:** None.

**Important details:**
- `startLegacy(schedule)` starts a cron job that calls `runAllScrapers()` on the given cron schedule (default: every hour).
- `startPipeline()` delegates to `pipelineScheduler.start()`.
- `stopAll()` stops all registered cron jobs and the pipeline scheduler.
- Exported as a singleton.

**Known issues:**
- This file is **never called** from anywhere in the codebase. `server/index.js` directly starts the legacy scheduler (`require('./scheduler').startScheduler()`) and pipeline scheduler (`require('./pipeline/scheduler').start()`) independently, bypassing this service entirely.
- The `startLegacy` default schedule is `'0 * * * *'` (every hour) which differs from the actual legacy scheduler in `server/scheduler.js` (which also runs an initial scrape at 10s and a JSearch extra scrape every 30 min).

---

### 12. `server/src/jobs/adapters/base/BaseAdapter.js`

**Purpose:** Abstract base class for all job source adapters. Defines the adapter interface and provides a default `normalize()` method and a `run()` convenience method.

**Dependencies:** `crypto` (Node.js built-in)

**Mongoose models used:** None.

**Important details:**
- Constructor takes a `sourceName` string and stores it as `this.source`.
- `discover()`: Returns empty array by default (overridable).
- `fetchJobs(context)`: Throws an error — must be overridden by subclasses.
- **`normalize(raw)`**: The core normalization logic. Creates a SHA-256 hash from `title ||| company ||| location` (lowercased, trimmed). Sets sensible defaults for all fields.
- `run(context)`: Calls `fetchJobs` then `normalize` on each result. Returns `{ success, jobs, found, saved, duration, error? }`.

**Default normalization output fields:**

| Field | Default |
|-------|---------|
| `title` | `raw.title \|\| 'Unknown Position'` |
| `company` | `raw.company \|\| 'Unknown Company'` |
| `location` | `raw.location \|\| 'Remote'` |
| `remote` | `raw.remote \|\| false` |
| `salaryMin` | `raw.salaryMin \|\| 0` |
| `salaryMax` | `raw.salaryMax \|\| 0` |
| `skills` | `raw.skills \|\| []` |
| `description` | `raw.description \|\| ''` |
| `applyUrl` | `raw.applyUrl \|\| raw.externalUrl \|\| ''` |
| `source` | `this.source` |
| `sourceJobId` | `raw.sourceJobId \|\| ''` |
| `postedAt` | `raw.postedAt ? new Date(raw.postedAt) : new Date()` |
| `hash` | SHA-256 of `title \|\|\| company \|\|\| location` |
| `active` | `true` |
| `lastSeenAt` | `new Date()` |

**Known issues:**
- The hash algorithm uses only title + company + location, so the same position at the same company with the same location will produce an identical hash even if descriptions/salaries differ. This means `JobWorker`'s upsert would update (not insert) the record, which may be intentional or may lose distinct listings.
- Default location is `'Remote'`, which may not match actual job data.
- No validation or type coercion beyond falsy checks.

---

### 13. `server/src/jobs/adapters/base/LegacyWrapperAdapter.js`

**Purpose:** Wraps a legacy scraper class (from `server/scrapers/`) as a `BaseAdapter`-compatible adapter.

**Dependencies:** `./BaseAdapter`

**Mongoose models used:** None.

**Important details:**
- Constructor takes `sourceName` (string) and `ScraperClass` (constructor).
- `fetchJobs(context)`:
  1. Instantiates the scraper: `new this.ScraperClass()`
  2. Calls `scraper.run()` to get jobs from the legacy scraper.
  3. Maps results, ensuring `applyUrl` and `sourceJobId` are set.
- The `sourceJobId` fallback is a base64-encoded substring of `title + company`.

**Known issues:**
- The base64 encoding for `sourceJobId` uses `Buffer.from(...).toString('base64').substr(0, 12)` which is **not deterministic** for deduplication purposes — two different formats or whitespace variations on the same title+company would produce different IDs.
- `scraper.run()` is assumed to return an array; no validation that the scraper's output matches the expected shape.
- Legacy scrapers may write to the `jobs` collection themselves, causing double-writes if both the legacy scraper and the adapter's caller save to the DB.

---

### 14. `server/src/jobs/adapters/yc/YCAdapter.js`

**Purpose:** Fetches jobs from Y Combinator companies. Extends `BaseAdapter`.

**Dependencies:**
- `../base/BaseAdapter`
- `../../../../pipeline/sources/ycombinator/companyRegistry`
- `../../../../pipeline/extractors` → `getExtractor`
- `../../../../pipeline/sources/ycombinator/directExtractor`

**Mongoose models used:** `CompanyRegistry` (from `pipeline/models`), loaded inline at line 21 via `require`.

**Does it write to the `jobs` collection?** No — only reads from `CompanyRegistry` to discover companies. Writing is done by the caller (`JobWorker`).

**Important details:**
- Constructor creates a `YCCompanyRegistry` and a `YCDirectExtractor`.
- `discover()` calls `this.registry.refresh()` to update the company list.
- `fetchJobs(context)`:
  1. Optionally refreshes the company registry (default: `true`).
  2. Queries `CompanyRegistry` for active companies with non-empty `careersUrl`, limited to `maxCompanies` (default: 500).
  3. For each company: tries to detect the ATS platform via `getExtractor()`, then extracts jobs. Falls back to `YCDirectExtractor` if no extractor matches.
  4. Enriches each job with `companySlug`, `tags`, `logo`, and `sourceJobId`.
  5. Waits 500–2000ms between companies (rate limiting).
- **This adapter duplicates the logic in `pipeline/sources/ycombinator/index.js`**, although the pipeline's ycombinator adapter is more streamlined.

**Known issues:**
- Sequential processing of up to 500 companies with random delays means this is **slow** (potentially 250–1000 seconds for 500 companies).
- No batch processing or parallelism.
- `require('../../../../pipeline/models')` is called **inside** `fetchJobs`, not at module scope — this is an odd pattern that defers the module load until the first call.
- Source string is `'YCombinator'` (capital C), which differs from the pipeline sources file key `'ycombinator'` (lowercase). This would cause a mismatch in `getAdapter()` lookups: `getAdapter('ycombinator')` returns the adapter, but `adapter.source` is `'YCombinator'`.

---

### 15. `server/src/jobs/adapters/peerlist/PeerlistAdapter.js`

**Purpose:** Fetches jobs from the Peerlist API. Extends `BaseAdapter`.

**Dependencies:**
- `../base/BaseAdapter`
- `../../../../pipeline/queue/rateLimiter`
- `axios` (loaded lazily inside `_fetchRest`)

**Mongoose models used:** None.

**Does it write to the `jobs` collection?** No — only fetches and normalizes. Writing is done by the caller.

**Important details:**
- Constructor sets up a RateLimiter: 3 req/s, burst 5.
- `fetchJobs(context)` accepts `maxPages` (default: 10) and delegates to `_fetchFromApi`.
- `_fetchFromApi(maxPages)` loops through pages:
  1. Acquires rate limiter token.
  2. Calls `_fetchRest(page)` which hits `https://api.peerlist.io/api/v1/jobs` with `limit=50, offset=page*50`.
  3. Breaks on empty response or error.
- `_normalize(raw)` handles both object and string company fields. Maps various field name conventions (`salaryMin`/`minSalary`/`salary.min`, `postedAt`/`createdAt`/`posted_date`, etc.).
- Source string is `'Peerlist'`.

**Known issues:**
- `require('axios')` is called **inside** `_fetchRest` on every API call rather than at the top of the file — poor performance (re-resolves the module cache, but still a code smell).
- Up to 10 pages at 50 results each = 500 jobs max.
- No pagination beyond 10 pages.
- The `/api/v1/jobs` endpoint path suggests an API version dependency.

---

### 16. `server/src/jobs/adapters/lever/LeverAdapter.js`

**Purpose:** Fetches jobs from Lever ATS for a specific company. Extends `BaseAdapter`.

**Dependencies:**
- `../base/BaseAdapter`
- `../../../../pipeline/extractors/lever`

**Mongoose models used:** None.

**Important details:**
- Constructor creates a `LeverExtractor` instance.
- `fetchJobs(context)` requires `companyName` and `careersUrl` in context. Returns `[]` if either is missing.
- Calls `this.extractor.extractJobs(companyName, careersUrl)`.
- Falls back to a base64-derived `sourceJobId` with `lever-` prefix.
- Source string is `'Lever'`.
- **Company-specific**: unlike YC/Peerlist adapters, this adapter cannot discover companies — it must be told which company to process.

**Known issues:**
- Same weak `sourceJobId` generation (base64 of title+company, truncated to 10 chars).
- No rate limiting or timeout handling.

---

### 17. `server/src/jobs/adapters/greenhouse/GreenhouseAdapter.js`

**Purpose:** Fetches jobs from Greenhouse ATS for a specific company. Extends `BaseAdapter`.

**Dependencies:**
- `../base/BaseAdapter`
- `../../../../pipeline/extractors/greenhouse`

**Mongoose models used:** None.

**Important details:**
- Structurally identical to `LeverAdapter.js`, but for Greenhouse.
- Source string is `'Greenhouse'`.
- Falls back to `sourceJobId` with `gh-` prefix.

**Known issues:**
- Same issues as `LeverAdapter.js`.
- The `gh-` prefix could theoretically collide with other sources if someone uses a different adapter that also uses `gh-`.

---

### 18. `server/src/jobs/adapters/ashby/AshbyAdapter.js`

**Purpose:** Fetches jobs from Ashby ATS for a specific company. Extends `BaseAdapter`.

**Dependencies:**
- `../base/BaseAdapter`
- `../../../../pipeline/extractors/ashby`

**Mongoose models used:** None.

**Important details:**
- Structurally identical to `LeverAdapter.js` and `GreenhouseAdapter.js`, but for Ashby.
- Source string is `'Ashby'`.
- Falls back to `sourceJobId` with `ashby-` prefix.

**Known issues:**
- Same issues as `LeverAdapter.js`.

---

## Data Flow

### How a job enters and flows through this layer (as designed):

```
  getAdapter(sourceName)
       │
       ▼
  ┌─ Adapter.fetchJobs(context) ───────── Raw job objects
  │    (each adapter has its own fetch logic:
  │     YC→ registry + extractors, Peerlist→ API, Lever/GH/Ashby→ extractor)
  │
  JobWorker.process(adapter, context)
       │
       ├─ 1. adapter.fetchJobs(context)          → raw jobs
       ├─ 2. JobNormalizer.normalizeBatch()      → normalized
       ├─ 3. ValidationService.filterValid()      → { valid, rejected }
       ├─ 4. DeduplicationService.deduplicate()   → { keep, duplicates }
       └─ 5. PipelineJob.findOneAndUpdate(upsert) → saved to MongoDB 'jobs' collection
```

### How jobs *actually* flow in production (without this layer):

```
  server/scheduler.js (legacy)                     server/pipeline/scheduler (pipeline)
       │                                                    │
       ▼                                                    ▼
  scrapers/aggregator                                 pipeline/orchestrator
       │                                                    │
       ▼                                                    ▼
  Legacy scrapers → legacy DB writes              pipeline/sources/* → pipeline/processors/* → PipelineJob model
```

The jobs adapter layer is completely bypassed in both paths.

---

## Activation Status

**This code is NOT running in production.**

| Check | Result |
|-------|--------|
| Is `server/src/jobs/` imported from `server/index.js`? | **No** |
| Is `server/src/jobs/` imported from any file in `server/` (excluding itself)? | **No** |
| Is `SchedulerService` from this layer ever instantiated or called? | **No** — `server/index.js` calls `require('./scheduler').startScheduler()` (legacy) and `require('./pipeline/scheduler').start()` (pipeline) directly |
| Is `server/src/jobs/config/` used by any running code? | **No** — only referenced in `pipeline/PIPELINE_DOC_CORRECTIONS.md` as a suggestion |
| Does any route handler import from this layer? | **No** |
| Is there a `require` path containing `src/jobs` anywhere in the codebase (excluding this directory and doc files)? | Only `pipeline/PIPELINE_DOC_CORRECTIONS.md` (a documentation file, not executed code) |

---

## Relationship to Legacy and Pipeline Systems

### Legacy Scrapers (`server/scrapers/`)

The legacy system uses individual scraper classes in `server/scrapers/` that directly fetch job boards and write to MongoDB. The `SchedulerService` in this layer wraps it via `runAllScrapers()`, and the `LegacyWrapperAdapter` is designed to reuse scraper classes as adapters.

**In practice:** The legacy scheduler (`server/scheduler.js`) starts independently via `startScheduler()` in `server/index.js:83` and runs scrapers directly. The adapter layer is not involved.

### Pipeline System (`server/pipeline/`)

The pipeline system has its own source adapters (`pipeline/sources/`), its own scheduler (`pipeline/scheduler/`), its own queue (`pipeline/queue/`), its own processors (`pipeline/processors/`), and its own orchestrator (`pipeline/orchestrator.js`).

**In practice:** The pipeline scheduler starts directly from `server/index.js:90-91` as `require('./pipeline/scheduler').start()`. The adapters in `src/jobs/adapters/` duplicate some of the pipeline's adapters (YC, Peerlist) but are not the ones used.

### Key Differences Between `src/jobs/adapters/` and `pipeline/sources/`

| Adapter | `src/jobs/adapters/` | `pipeline/sources/` |
|---------|---------------------|---------------------|
| YC | `YCAdapter.js` — registry + per-company extraction | `sources/ycombinator/index.js` — similar but different impl |
| Peerlist | `PeerlistAdapter.js` — uses axios directly | `sources/peerlist/index.js` — may differ |
| Lever | `LeverAdapter.js` — wraps pipeline extractor | Not a pipeline adapter (Lever is handled via extractors within YC adapter) |
| Greenhouse | `GreenhouseAdapter.js` — wraps pipeline extractor | Not a pipeline adapter |
| Ashby | `AshbyAdapter.js` — wraps pipeline extractor | Not a pipeline adapter |
| Cutshort | **Missing** | `sources/cutshort/index.js` |
| Instahyre | **Missing** | `sources/instahyre/index.js` |
| Hirect | **Missing** | `sources/hirect/index.js` |

---

## Known Issues and Gaps

### Critical

1. **Dead Code**: The entire `server/src/jobs/` directory is unused. 18 files, ~500 lines of code that serve no runtime purpose. The `models/` and `logs/` subdirectories are empty.

2. **No caller imports from this layer**: Zero `require()` statements in running code reference `src/jobs/`.

### Moderate

3. **SchedulerService never activated**: `server/index.js` starts schedulers directly rather than through this unified service.

4. **Config not consumed**: The configuration in `src/jobs/config/index.js` has the same default values as the pipeline scheduler's hardcoded schedules, but changing env vars does nothing because the pipeline scheduler ignores this config.

5. **Missing sources**: `getAdapter()` does not support `cutshort`, `instahyre`, or `hirect` — three of the five sources the pipeline actually runs.

6. **Adapter duplication**: `YCAdapter.js` and `PeerlistAdapter.js` in this layer duplicate functionality already present in `pipeline/sources/`. Two parallel implementations that could drift.

### Minor

7. **Bug in JobWorker `$or` filter**: The `$or` array uses `.filter(Boolean)`, which if both `hash` and `sourceJobId` were falsy, would produce `[]` → match all documents. Not triggered currently because `BaseAdapter.normalize()` always sets a hash.

8. **Weak hash algorithm**: `BaseAdapter.normalize()` uses only title + company + location for the SHA-256 hash. Two different job postings (e.g., different departments) with the same title at the same company in the same location will produce identical hashes.

9. **Lazy requires**: `YCAdapter.js` calls `require('../../../../pipeline/models')` inside `fetchJobs()` (line 21). `PeerlistAdapter.js` calls `require('axios')` inside `_fetchRest()` (line 33). This is a code smell — it works but is unconventional.

10. **Private method access**: `CompanyDiscoveryService.discoverYCBatch()` calls `registry._discoverBatch(batch)` where `_discoverBatch` is conventionally private.

11. **YC-specific fallback in generic service**: `CareerPageCrawler.crawl()` falls back to `YCDirectExtractor` for any company whose platform is not detected, even non-YC companies.

12. **`SearchIndexService` unused import**: `PipelineJob` is destructured from `pipeline/models` but never used in the method body.

13. **Singleton inconsistency**: Most services export singletons (`module.exports = new ClassName()`), but `CompanyDiscoveryService` and `CareerPageCrawler` export the class itself. `getAdapter()` creates new instances on each call with no caching.

14. **sourceJobId collisions**: Multiple adapters use `Buffer.from(title+company).toString('base64').substr(0, 10-12)` for fallback IDs, which is non-deterministic for whitespace variations and could produce collisions across sources.

---

## Complete File List

| # | Path | Lines | Type | Purpose |
|---|------|-------|------|---------|
| 1 | `server/src/jobs/index.js` | 48 | Barrel | Re-exports all modules, provides `getAdapter()` |
| 2 | `server/src/jobs/config/index.js` | 19 | Config | Environment-driven configuration with defaults |
| 3 | `server/src/jobs/queue/JobQueue.js` | 15 | Queue | Wrapper around pipeline queue |
| 4 | `server/src/jobs/workers/JobWorker.js` | 49 | Worker | Orchestrates fetch→normalize→validate→dedup→save |
| 5 | `server/src/jobs/services/JobNormalizer.js` | 13 | Service | Delegates to pipeline normalizer |
| 6 | `server/src/jobs/services/ValidationService.js` | 20 | Service | Delegates to pipeline validator, provides filter |
| 7 | `server/src/jobs/services/DeduplicationService.js` | 18 | Service | Pipeline + legacy dedup |
| 8 | `server/src/jobs/services/SearchIndexService.js` | 22 | Service | Builds search text from job fields |
| 9 | `server/src/jobs/services/CompanyDiscoveryService.js` | 17 | Service | Wraps YC company registry |
| 10 | `server/src/jobs/services/CareerPageCrawler.js` | 22 | Service | Crawls career pages via ATS detection |
| 11 | `server/src/jobs/services/SchedulerService.js` | 32 | Service | Unified cron scheduler (never started) |
| 12 | `server/src/jobs/adapters/base/BaseAdapter.js` | 53 | Base | Abstract adapter class with normalize() |
| 13 | `server/src/jobs/adapters/base/LegacyWrapperAdapter.js` | 20 | Adapter | Wraps legacy scrapers as adapters |
| 14 | `server/src/jobs/adapters/yc/YCAdapter.js` | 49 | Adapter | Fetches YC jobs via registry + extractors |
| 15 | `server/src/jobs/adapters/peerlist/PeerlistAdapter.js` | 65 | Adapter | Fetches Peerlist jobs via REST API |
| 16 | `server/src/jobs/adapters/lever/LeverAdapter.js` | 21 | Adapter | Fetches Lever jobs via extractor |
| 17 | `server/src/jobs/adapters/greenhouse/GreenhouseAdapter.js` | 21 | Adapter | Fetches Greenhouse jobs via extractor |
| 18 | `server/src/jobs/adapters/ashby/AshbyAdapter.js` | 21 | Adapter | Fetches Ashby jobs via extractor |
| — | `server/src/jobs/models/` | 0 | (empty) | No files |
| — | `server/src/jobs/logs/` | 0 | (empty) | No files |

**Total: 18 JavaScript files, 2 empty directories.**
