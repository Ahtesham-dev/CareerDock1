# Scrapers & Job Ingestion

**Last Updated:** July 25, 2026
**Related Docs:** [SCRAPERS_DOC.md](../server/scrapers/SCRAPERS_DOC.md), [PIPELINE_DOC.md](../server/pipeline/PIPELINE_DOC.md),
[TWO_SCHEDULER_VERIFICATION.md](../server/TWO_SCHEDULER_VERIFICATION.md)

---

## Overview

CareerDock has two parallel job ingestion systems that together pull from 14 sources. Source sets are completely disjoint — no job board appears in both.

| System | Sources | Runs |
|--------|---------|------|
| Legacy Scrapers | 9 sources | Hourly cron |
| Pipeline Adapters | 5 sources | Every 2h + staggered refreshes |

## Legacy Scrapers

See [SCRAPERS_DOC.md](../server/scrapers/SCRAPERS_DOC.md) for complete details.

**Sources:** JSearch, GitHub, HackerNews, Dev.to, LinkedIn, Internshala, Wellfound (blocked), Naukri, Career Pages

**Architecture:**
```
Scheduler → aggregator.js → per-scraper fetchJobs() → normalise() → upsertJobs() → dedup → markExpired
```

| Scraper | Source | Method | Status |
|---------|--------|--------|--------|
| JSearch | remoteok.io API | Axios | ✅ Active |
| LinkedIn | LinkedIn guest API | Cheerio HTML | ✅ Active |
| HackerNews | HN Algolia API | Axios | ✅ Active |
| Dev.to | dev.to API | Axios | ✅ Active |
| Internshala | internshala.com | Cheerio HTML | ✅ Active |
| Naukri | naukri.com | Puppeteer | ✅ Active |
| Career Pages | 6 companies | Cheerio HTML | ✅ Active |
| GitHub | GitHub API | Axios | ⚠️ Not real jobs |
| Wellfound | wellfound.com | Axios | ❌ Blocked by DataDome |

## Pipeline Adapters

See [PIPELINE_DOC.md](../server/pipeline/PIPELINE_DOC.md) for the complete reference (36 source files, ~3,300 lines).

**Sources:** YCombinator, Peerlist, Cutshort, Instahyre, Hirect (stub)

**Architecture:**
```
Scheduler → Orchestrator → JobQueue → SourceAdapter → Normalizer → Validator → Deduplicator → Storage → MongoDB
```

| Adapter | Method | Status |
|---------|--------|--------|
| YCombinator | Company registry + ATS extractors (Greenhouse, Lever, Ashby, Workable, Teamtailor) | ✅ Active |
| Cutshort | `__NEXT_DATA__` extraction (33 skill pages) | ✅ Active |
| Instahyre | REST API paginated | ✅ Active |
| Peerlist | Puppeteer + `__NEXT_DATA__` | ✅ Active |
| Hirect | Stub (mobile-only, returns 0) | ❌ No API |

## Two-Scheduler Architecture

Both schedulers start automatically after `server/index.js` initializes:

- **Legacy Scheduler** (`server/scheduler.js`): 10s after boot, hourly scraper runs, 30min alert matching
- **Pipeline Scheduler** (`pipeline/scheduler/`): 15s after boot, staggered cron per source

**Verified:** Source ownership is disjoint — no data corruption risk. See [TWO_SCHEDULER_VERIFICATION.md](../server/TWO_SCHEDULER_VERIFICATION.md).

## Deduplication

| Layer | Method | Scope |
|-------|--------|-------|
| Pipeline | Hash → URL → exact → fuzzy (Jaro-Winkler 0.9) | Per source run |
| Scrapers | Phase 1: hash index, Phase 2: fuzzy Levenshtein O(n²) | After all scrapers |
| Engine | 10-factor pairwise with merge/flag | Batch worker |

## Quality Scoring

8-factor model (0-100) applied to every job. See `engine/qualityScore.js`.

## Data Flow

```
External Source
  → Scraper/Adapter (fetch + normalize)
  → Validator (spam detection + quality checks)
  → Deduplicator (hash/exact/fuzzy)
  → Storage (upsert to MongoDB)
  → Mark Expired (7d unseen → inactive)
  → Archive (60d inactive → delete)
```

## Running Manually

```bash
# Legacy scrapers
node server/runAggregator.js

# Pipeline
npm run pipeline:run          # All sources
npm run pipeline:yc           # YC only
npm run pipeline:peerlist     # Peerlist only

# Workers
node server/workers/dedupWorker.js
node server/workers/qualityWorker.js
```
