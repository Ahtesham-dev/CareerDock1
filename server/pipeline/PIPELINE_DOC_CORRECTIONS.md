# PIPELINE SUBSYSTEM DOCUMENTATION — ADDENDUM & CORRECTIONS

## C1. MongoDB Replica Set Requirement

**Applies to:** Section 7.2, Section 8 (text search index)

MongoDB `$text` aggregation with `{ $meta: 'textScore' }` requires a **replica set**. Standalone MongoDB instances can create text indexes but cannot use `$meta: 'textScore'` in aggregation pipelines.

**Fallback behavior:** Both `/api/pipeline/jobs/search` (`pipeline/routes/jobs.js:78-104`) and `/api/jobs/search` (`routes/jobs.js:14-27`) wrap the `$text` query in try-catch. On failure (e.g., standalone MongoDB, missing text index), they fall back to `$regex` search with the following behavior:
- Query string is escaped with `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Regex is constructed with `new RegExp(escaped, 'i')`
- Applied as `$or` on `title`, `company`, `description`, `skills`, `location`, `tags`
- Sorted by `{ postedAt: -1 }` instead of textScore
- No relevance ranking in fallback mode

## C2. Dual Route Hierarchy

**Applies to:** Section 7

Two independent sets of job routes exist, both registered in `server/index.js`:

| Prefix | File | Model | Aggregation Target | Rate Limit |
|--------|------|-------|-------------------|------------|
| `/api/jobs` | `server/routes/jobs.js` | `Job` (`models/Job.js`) | `jobs` collection | None |
| `/api/pipeline/jobs` | `server/pipeline/routes/jobs.js` | `PipelineJob` (`pipeline/models/Job.js`) | `jobs` collection | 20 req/60s |

Both query the same MongoDB `jobs` collection via different Mongoose schemas. This is a **transitional architecture** — the legacy routes at `/api/jobs` are being replaced by pipeline routes at `/api/pipeline/jobs`. Both are active and functionally similar. The pipeline routes offer additional filtering (`remote`, `salaryMin`, `salaryMax`, `tags`) and a dedicated `/company/:company` and `/source/:source` endpoint.

## C3. Dual Scheduler Concurrency

**Applies to:** Section 17 (Deployment), Section 6.3

Two schedulers start automatically after `server/index.js` initializes:

```
server/index.js
├── server/scheduler.js (legacy)
│   ├── Start: 10s after boot → runAllScrapers()
│   ├── Cron: 0 * * * * (hourly) → runAllScrapers()
│   ├── Cron: */30 * * * * → runScraper('JSearch')
│   ├── Cron: */30 * * * * → checkAlerts()
│   ├── Cron: 0 2 * * * → cleanupService.runDailyCleanup()
│   └── Cron: 0 */6 * * * → cleanupService.recalculateSourceHealth()
└── server/pipeline/scheduler/index.js (pipeline)
    ├── Start: 15s after boot → runFullPipeline()
    ├── Cron: 0 */2 * * * → full pipeline
    ├── Cron: 30 */6 * * * → YC refresh
    ├── Cron: 0 */4 * * * → Peerlist refresh
    ├── Cron: 0 */6 * * * → Cutshort refresh
    ├── Cron: 0 */6 * * * → Instahyre refresh
    ├── Cron: 0 */6 * * * → Hirect refresh
    └── Cron: 0 3 * * * → daily maintenance
```

**Total: 11 concurrent cron schedules.**

**Locking behavior:**
- Legacy: `isRunning` flag (module-level) — prevents legacy-internal overlaps only
- Pipeline: `_runWithLock` flag (instance-level) — prevents pipeline-internal overlaps only
- **No cross-scheduler locking exists**
- Both may simultaneously write to the `jobs` collection
- MongoDB atomic upserts prevent data corruption; duplicate work is possible

**Loop 1–4 verification (2026-07-01):** Confirmed that the two schedulers have **disjoint source ownership** — no source is scraped by both paths:

| Scheduler | Owned Sources |
|-----------|---------------|
| Legacy (`server/scheduler.js`) | `JSearch`, `GitHub`, `HackerNews`, `Dev.to`, `LinkedIn`, `Internshala`, `Wellfound`, `Naukri`, `Career Pages` |
| Pipeline (`server/pipeline/scheduler/index.js`) | `YCombinator`, `Peerlist`, `Cutshort`, `Instahyre`, `Hirect` (returns 0 — mobile-only) |

**Overlap: NO.** Sources are completely disjoint. The `hash` algorithm is structurally the same in both paths (`sha256` of `title|||company|||location`) but inputs differ because they target different job boards. Concurrency is safe for correctness.

**Resolution:** Deferred to backlog as architectural maintainability concern. No production bug exists. See `TWO_SCHEDULER_VERIFICATION.md`.

## C4. Hash Format Conflict

**Applies to:** Section 11.6, Section 12.2

The pipeline normalizer and legacy baseScraper produce **different hashes** for identical jobs:

**Pipeline** (`pipeline/processors/normalizer.js:188-194`):
```
components = [title, company, location]  // always 3 parts
hash = sha256(components.join('|||'))
```

**Legacy** (`scrapers/baseScraper.js:34-42`):
```
components = [title]
if title !== 'Unknown Position':
    components.push(company)
components.push(location)
hash = sha256(components.join('|||'))
```

**Impact:** The pipeline's unique-sparse `{ hash: 1 }` index will NOT catch duplicates created by the legacy system and vice versa. Cross-system dedup relies on the `{ source, sourceJobId }` unique index (pipeline-only) or the fallback `{ title, company, location, source }` upsert query.

## C5. Dual Health Tracking Systems

**Applies to:** Section 11.8

| System | File | Storage | Persistence | Used By |
|--------|------|---------|-------------|---------|
| Pipeline `HealthMonitor` | `pipeline/monitoring/health.js` | In-memory `Map` | Lost on restart | `GET /api/pipeline/sources/health` |
| Legacy `SourceHealth` | `models/SourceHealth.js` | MongoDB `sourcehealths` collection | Persistent | `GET /api/admin/source-health` |

Both are updated independently:
- Pipeline orchestrator calls `healthMonitor.recordRun(source, result)` after each source completes
- Legacy aggregator calls `SourceHealth.recordRun()` (inline within `recordSourceHealth()`)

**Note:** The pipeline does NOT update the MongoDB `SourceHealth` collection. The in-memory `HealthMonitor` is reset on every server restart and only reflects runs since the current process started.

## C6. Normalizer Key Typo

**Applies to:** Section 12.2

In `pipeline/processors/normalizer.js:142`:
```js
'golang ': 'Go',
```
The key `'golang '` has a trailing space. The input to `_normalizeSkills()` is trimmed (`s.trim().toLowerCase()`) before lookup, so `'golang'` (without space) will never match this key. This is a **non-functional mapping** — no observable behavior change since Go/golang is also listed under `'golang'` in the tech keywords list used by extractors.

## C7. Unused PipelineRun Status

**Applies to:** Section 8.3

`PipelineRun.status` enum allows `['running', 'success', 'failed', 'partial']` but the orchestrator only sets `'running'`, `'success'`, or `'failed'`. The `'partial'` status is defined in the schema but never used by any code.

## C8. Redis Optionality

**Applies to:** Section 18

`server/services/cache.js` attempts to connect to Redis. If `REDIS_URL` is not set in environment or the connection fails, **all caching falls back to an in-memory `Map`** with auto-expiry (60s cleanup interval). The `.env.example` intentionally omits `REDIS_URL` — in-memory mode is the default. Redis is purely optional for performance scaling.

## C9. Duplicated Browser Launch Code

**Applies to:** Section 4.2

`_launchBrowser()` logic exists in two locations with identical behavior:
1. `server/pipeline/sources/peerlist/index.js` (private function, lines 16-30)
2. `server/scrapers/launchBrowser.js` (exported module)

Both:
1. Try `puppeteer.launch()` with bundled Chromium
2. Fall back to `puppeteer-core.launch()` searching `CHROME_PATH`, `PUPPETEER_EXECUTABLE_PATH`, then hardcoded Windows/Linux paths
3. Return `null` if no browser found

The pipeline Peerlist adapter uses its own private copy (1). The legacy Naukri scraper imports from (2).

## C10. Missing Environment Variables

**Applies to:** Section 10

The following environment variables are used by the browser launchers but are NOT listed in `.env.example`:

| Variable | Default Search Paths | Used By |
|----------|---------------------|---------|
| `CHROME_PATH` | N/A (explicit path) | Peerlist adapter, Naukri scraper |
| `PUPPETEER_EXECUTABLE_PATH` | N/A (explicit path) | Peerlist adapter, Naukri scraper |

Without these in Docker/Railway deployments, Puppeteer-dependent sources (Peerlist, Naukri) return 0 jobs because Chromium is not bundled in `node:20-alpine` or Railway's Nixpacks build.

## C11. Complete API Example

**Applies to:** Section 7.2

```json
GET /api/pipeline/jobs?q=react&limit=2&sort=quality

Response 200:
{
  "jobs": [
    {
      "_id": "665a1b2c3d4e5f6a7b8c9d0e",
      "title": "Senior React Developer",
      "company": "TechCorp",
      "companySlug": "techcorp",
      "location": "Bangalore",
      "remote": false,
      "salaryMin": 1800000,
      "salaryMax": 2500000,
      "currency": "INR",
      "experience": "Senior",
      "skills": ["React", "TypeScript", "Node.js"],
      "description": "We are looking for a highly skilled Senior React Developer...",
      "applyUrl": "https://jobs.techcorp.com/apply/react-senior",
      "applyUrlStatus": "unknown",
      "source": "YCombinator",
      "sourceJobId": "gh-67890",
      "postedAt": "2025-12-15T10:30:00.000Z",
      "lastSeenAt": "2025-12-18T14:22:00.000Z",
      "active": true,
      "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "qualityScore": 88,
      "tags": ["frontend", "react", "senior", "typescript"],
      "metadata": {
        "ycBatch": "W23",
        "extraction": "jsonld"
      },
      "createdAt": "2025-12-15T10:30:00.000Z",
      "updatedAt": "2025-12-18T14:22:00.000Z"
    }
  ],
  "total": 47,
  "page": 1,
  "pages": 24
}
```

## C12. Docker/Railway Chrome Dependency

**Applies to:** Section 17.4, Section 17.5

The `Dockerfile` uses `node:20-alpine` which does NOT include Chromium. The `railway.json` uses Nixpacks builder which also does not include Chromium by default.

**Strategy for Peerlist/Naukri to work in Docker:**
1. Install Chromium in the Dockerfile:
```dockerfile
RUN apk add --no-cache chromium
ENV CHROME_PATH=/usr/bin/chromium-browser
```

2. Or use puppeteer with bundled Chromium (requires `puppeteer` not `puppeteer-core`):
```dockerfile
ENV PUPPETEER_SKIP_DOWNLOAD=false
RUN npm install puppeteer
```

Without Chrome, Peerlist and Naukri scrapers produce 0 jobs. All other pipeline sources (YC, Instahyre, Cutshort, Hirect) work without a browser.

---

## C13 (Gap A): YC OSS API Response Shape

**Applies to:** Section 4.2 — `companyRegistry.js`

The YC OSS API at `https://yc-oss.github.io/api/companies/all.json` returns an **array** of objects with this exact shape:

```typescript
interface YCCompanyAPIResponse {
  name: string;          // Company name, e.g. "Stripe"
  slug: string;          // URL slug, e.g. "stripe"
  website: string;       // Company website URL, e.g. "https://stripe.com"
  batch: string;         // YC batch, e.g. "S09", "W22"
  tags: string[];        // Technology/industry tags, e.g. ["fintech", "payments"]
  logo?: string;         // Logo URL (may be empty string)
  thumbnail?: string;    // Thumbnail URL (may be empty string)
  one_liner?: string;    // Short description, e.g. "Online payment processing"
  description?: string;  // Longer description (may be absent)
  careers_url?: string;  // Direct careers page URL (may be absent)
  careersUrl?: string;   // Alternative field name for careers URL
}
```

The hiring subset at `https://yc-oss.github.io/api/companies/hiring.json` returns an **array** of objects with the same shape (subset of companies currently hiring).

**Hiring set matching:** The adapter builds a `Set` of hiring company identifiers using `c.name`, `c.slug`, AND `c.id` (all three, in case of null values). A company is considered "hiring" if ANY of its identifiers match.

**Sync behavior:**
1. `discoverAll()` fetches both endpoints
2. Maps each company to the `CompanyRegistry` schema
3. `_detectPlatform()` checks the careers URL for known ATS substrings in order: greenhouse > lever > ashby > workable > teamtailor > breezy > recruitee > smartrecruiters > bamboohr > pinpoint > direct
4. `_buildCareersUrl()`: if no explicit `careers_url`/`careersUrl`, constructs `https://{domain}/careers` from website hostname
5. `syncToDatabase()` uses `findOneAndUpdate` with `{ name: c.name }` as the query and `$set` for all fields, `$setOnInsert` for `createdAt`
6. Companies are NOT deleted if they disappear from the API — they remain in the database with their last known state

---

## C14 (Gap B): DirectExtractor HTML Selector Strategy

**Applies to:** Section 4.2 — `directExtractor.js`

The `_extractFromHtml($, company, baseUrl)` method applies ALL selectors independently and **merges** their results:

```javascript
// Phase 1: Anchor href scanning — finds ALL links containing "job", "career", "position", "opening"
$('a[href*="job"], a[href*="career"], a[href*="position"], a[href*="opening"]').each(...)

// Phase 2: CSS class scanning — finds ALL job cards by common class names
$('.job-listing, .job-card, .job-post, .position, .opening').each(...)
```

**Behavior:**
- Both phases run on the SAME page — they are NOT mutual alternatives
- Results are concatenated into a single array
- Duplicate detection: if the same URL is found by both phases, it appears twice (no dedup at this stage — dedup happens later in the processor chain)
- No recursion depth limit — cheerio's `$` operates on the full document
- Relative URLs are resolved via `new URL(href, baseUrl).href`
- Jobs with `title.length > 100` or `title.length < 3` are filtered out
- Jobs with text containing "all" or "view" (lowercase) are filtered out (e.g., "View all jobs")
- The `baseUrl` parameter is the careers page URL being scraped

**Call chain for `extractJobs()`:**
1. `_fetchPage(careersUrl)` → null on failure
2. `_extractJsonLd(html)` — regex-based, no cheerio
3. If JSON-LD jobs found → return them immediately (skip HTML phase)
4. `cheerio.load(html)` → `_extractFromHtml($, company, careersUrl)`
5. If HTML jobs found → return them
6. If careersUrl === company.website → return [] (no more alternatives to try)
7. `_tryAlternativeUrls(company)` → iterates KNOWN_CAREERS paths in order, returns first non-empty result
8. If no alternatives work → return []

---

## C15 (Gap C): Peerlist NEXT_DATA Extraction Path

**Applies to:** Section 4.2 — `peerlist/index.js`

The `_extractJobsFromHtml()` method uses JavaScript **logical OR chaining** (`||`) to try multiple extraction paths:

```javascript
const data = parsed?.props?.pageProps?.jobs          // Path 1: standard jobs key
            || parsed?.props?.pageProps?.listings    // Path 2: listings key (alternative API version)
            || parsed?.props?.pageProps?.jobsData?.jobs  // Path 3: nested jobsData
            || [];                                   // Fallback: empty array
```

**Behavior:**
- Each path is tried left-to-right
- The FIRST truthy value is returned
- An empty array `[]` is truthy, so if Path 1 returns `[]`, Path 2 is NEVER tried
- A missing field (`undefined`) causes the chain to continue to the next `||`
- If all paths fail, returns `[]`

**WARNING:** If the Peerlist page's `__NEXT_DATA__` contains an empty `jobs: []` array under Path 1, the adapter will return 0 jobs even if Path 2 or Path 3 would have returned valid data. This is a known limitation.

---

## C16 (Gap D): Greenhouse API Pagination

**Applies to:** Section 4.3 — `greenhouse.js`

The Greenhouse extractor paginates using `data.meta?.next`:

```javascript
hasMore = !!(data.meta?.next);
```

**Behavior:**
- If `data.meta` is `undefined` or `null`: `hasMore = false` → loop stops after current page
- If `data.meta.next` is `undefined`, `null`, `false`, or `0`: `hasMore = false` → loop stops
- If `data.meta.next` is a truthy value (string/number): `hasMore = true` → continues
- No maximum page cap — infinite loop if API returns infinite pages
- Delay between pages: `200 + Math.random() * 300` ms
- Only jobs with `j.status === 'published'` or `j.status === 'active'` are included
- The board token is extracted from the careers URL: `url.match(/greenhouse\.io\/([^/?#]+)/)` — falls back to `companyName.toLowerCase().replace(/[^a-z0-9-]/g, '')`

---

## C17 (Cross-Reference Disc. 1): Scheduler Ignores PIPELINE_SCHEDULE_FULL

**Applies to:** Section 6.3, Section 9.1

The pipeline scheduler (`server/pipeline/scheduler/index.js:16`) hardcodes the full pipeline cron expression as `'0 */2 * * *'`.

The config module (`server/src/jobs/config/index.js:6`) reads `process.env.PIPELINE_SCHEDULE_FULL` with fallback `'0 */2 * * *'`.

**Problem:** The scheduler does NOT import or use the config module. If an operator sets `PIPELINE_SCHEDULE_FULL=0 */4 * * *` in the environment, the config module will reflect the change but the scheduler will ignore it and continue running every 2 hours.

**To fix:** `server/pipeline/scheduler/index.js` should import the config module:
```javascript
const config = require('../../src/jobs/config');
// ... then use config.schedules.full instead of hardcoded string
```

## C18 (Cross-Reference Disc. 2): PipelineRun `'partial'` Status — Dead Code

**Applies to:** Section 8.3

The `PipelineRun.status` schema enum is `['running', 'success', 'failed', 'partial']` but the orchestrator only ever sets `'running'`, `'success'`, or `'failed'`. The value `'partial'` is defined in the Mongoose schema (`server/pipeline/models/PipelineRun.js:6`) but never written by any code path in the entire repository.

**To fix:** Either remove `'partial'` from the enum or add logic in `runFullPipeline()`/`runSource()` to set `'partial'` when at least one source fails while others succeed.

---

## C19 (Change Detection): Undeclared Dependency — `puppeteer-core`

**Applies to:** Section 18

`puppeteer-core` is used at `server/pipeline/sources/peerlist/index.js:32` as a fallback if `puppeteer` (bundled Chromium) fails. However, `puppeteer-core` is **NOT listed in `package.json`**. It would need to be installed separately or be available as a transitive dependency.

**Impact:** On systems where `puppeteer` fails to launch (e.g., missing bundled Chromium in Docker), the fallback to `puppeteer-core` will also fail silently (caught `catch {}` returns `null`). Peerlist adapter returns 0 jobs.

## C20 (Change Detection): Route Query `active=string('true')` Semantics

**Applies to:** Section 7.2 — GET `/api/pipeline/jobs`

The `active` query parameter is treated as a **string comparison**, not a boolean:
```javascript
if (active === 'true') filter.active = true;
```
- `?active=true` → `active: true` in filter
- `?active=false` → `active` field NOT added to filter (returns all jobs)
- `?active=` (empty) → NOT added
- No parameter → NOT added (returns all jobs, same as `false`)

This means **there is no way to filter for ONLY inactive jobs** via the route. Setting `active=false` returns all jobs (both active and inactive).

## C21 (Change Detection): Orchestrator Queue Drain Polling

**Applies to:** Section 5.1, Section 6.1

`PipelineOrchestrator._drainQueue()` polls every **500ms** with `setTimeout` to check if the queue is empty. This is used to synchronize the full pipeline run after all source tasks are enqueued. There is no timeout — if a task hangs indefinitely, `_drainQueue()` polls forever.

```javascript
async _drainQueue() {
  return new Promise((resolve) => {
    const check = () => {
      if (this.queue.size() === 0) return resolve();
      setTimeout(check, 500);
    };
    check();
  });
}
```

## C22 (Change Detection): Queue `pause()/resume()` is Dead Code

**Applies to:** Section 4.5

`JobQueue.pause()` sets `this.active = false`, and `JobQueue.resume()` sets `this.active = true` then calls `_process()`. However, the `_process()` method **never checks `this.active`**. The pause/resume functionality has no effect. This is dead code.

## C23 (Change Detection): Cutshort NEXT_DATA Specific Extraction Path

**Applies to:** Section 4.2 — CutshortAdapter

The Cutshort adapter extracts job listings from the `__NEXT_DATA__` JSON using this specific path:
```javascript
parsed?.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data?.data?.pageData?.jobs
```
This path is 8 levels deep and is highly dependent on Cutshort's Next.js data structure. If any intermediate field is renamed by Cutshort, the extraction silently returns `[]`.

## C24 (Change Detection): Instahyre API Parameters

**Applies to:** Section 4.2 — InstahyreAdapter

The Instahyre adapter sends these fixed API parameters on every request:
```javascript
params: {
  company_size: 0,
  isLandingPage: true,
  job_type: 0,
  offset: page * 50,
  limit: 50,
  source: 'opportunities'
}
```
Additional headers: `Referer: https://www.instahyre.com/search-jobs`, `x-requested-with: XMLHttpRequest`.

## C25 (Change Detection): Pipeline Run Options — Route Default Source List

**Applies to:** Section 7.1 — POST `/api/pipeline/run`

When called via the API route (as opposed to the scheduler), the default source list is `['ycombinator', 'peerlist']` (only 2 sources), NOT the full 5-source list `['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect']` used by the scheduler.

```javascript
// route default (pipeline/routes/pipeline.js:18):
sources: sources || ['ycombinator', 'peerlist']

// scheduler default (pipeline/scheduler/index.js:17):
sources: ['ycombinator', 'peerlist', 'cutshort', 'instahyre', 'hirect']
```
