# Two-Scheduler Architecture — Verification Report

## Original Concern

Two schedulers running simultaneously may cause duplicate ingestion and data corruption.

## Verified Finding

**False.** The scheduler responsibilities are disjoint. They do not ingest the same sources and therefore do not corrupt data.

---

## Which scheduler owns which sources?

### Legacy Scheduler (`server/scheduler.js` → `server/scrapers/aggregator.js`)

| Source | Source string on jobs | Scraper file |
|--------|----------------------|--------------|
| JSearch | `'JSearch'` | `server/scrapers/jsearch.js` |
| GitHub | `'GitHub'` | `server/scrapers/github.js` |
| HackerNews | `'HackerNews'` | `server/scrapers/hackernews.js` |
| Dev.to | `'Dev.to'` | `server/scrapers/devto.js` |
| LinkedIn | `'LinkedIn'` | `server/scrapers/linkedin.js` |
| Internshala | `'Internshala'` | `server/scrapers/internshala.js` |
| Wellfound | `'Wellfound'` | `server/scrapers/wellfound.js` |
| Naukri | `'Naukri'` | `server/scrapers/naukri.js` |
| Career Pages | `'Career Pages'` | `server/scrapers/careerPages.js` |

### Pipeline Scheduler (`server/pipeline/scheduler/index.js` → `server/pipeline/orchestrator.js`)

| Source | Source string on jobs | Adapter file |
|--------|----------------------|-------------|
| ycombinator | `'YCombinator'` | `server/pipeline/sources/ycombinator/index.js` |
| peerlist | `'Peerlist'` | `server/pipeline/sources/peerlist/index.js` |
| cutshort | `'Cutshort'` | `server/pipeline/sources/cutshort/index.js` |
| instahyre | `'Instahyre'` | `server/pipeline/sources/instahyre/index.js` |
| hirect | (returns 0 jobs — mobile-only, no API) | `server/pipeline/sources/hirect/index.js` |

### Source name normalization

The pipeline normalizer (`server/pipeline/processors/normalizer.js:158-170`) maps certain raw source values:

```js
{ 'ycombinator' → 'YCombinator', 'y combinator' → 'YCombinator', 'yc' → 'YCombinator',
  'lever' → 'Lever', 'greenhouse' → 'Greenhouse', 'ashby' → 'Ashby',
  'workable' → 'Workable', 'teamtailor' → 'Teamtailor' }
```

None of these map values overlap with any legacy source name.

---

## Is there any source overlap now?

**No.** The two source sets are completely disjoint:

- Legacy: `JSearch`, `GitHub`, `HackerNews`, `Dev.to`, `LinkedIn`, `Internshala`, `Wellfound`, `Naukri`, `Career Pages`
- Pipeline: `YCombinator`, `Peerlist`, `Cutshort`, `Instahyre` (Hirect returns 0 jobs)

No single job board appears in both lists.

---

## Could future developers accidentally introduce overlap?

**Yes — and nothing enforces disjointness.**

There is no:
- Central registry of claimed source names
- Startup check that warns on overlap
- Monitored list of "which scheduler owns which source"

A developer adding a scraper to the legacy path with source `'Instahyre'` would silently create overlap. The two upsert paths would compete for the same documents via different Mongoose models (`Job` vs `PipelineJob`), and the index race condition (see Issue 3) would become a real problem.

---

## Is there any monitoring or health check that would detect overlap?

**No.** Current monitoring:

| Monitor | Scope |
|---------|-------|
| Legacy `ScraperRun` records | Only tracks legacy scraper runs per source |
| Legacy `SourceHealth` records | Only tracks legacy source health |
| Pipeline `PipelineRun` records | Only tracks pipeline runs per source |
| Pipeline `healthMonitor.getAllHealth()` | In-memory, pipeline-only |
| `GET /api/pipeline/stats` | Pipeline DB stats + active job counts per pipeline source |

None of these compare legacy vs pipeline source names or detect that the same source is being processed by both paths.

---

## Decision

**Defer to backlog.** No production bug exists — this is an architectural maintainability concern.

**Backlog item:** Consider consolidating scheduler orchestration or adding a shared source registry to prevent future overlap. This is a refactor, not a bug fix, and should not block deployment.

### Recommended guardrail (if needed before consolidation)

Add a startup check in `server/index.js` that compares the source lists from both schedulers and logs a warning if any overlap is detected:

```js
const LEGACY_SOURCES = ['JSearch', 'GitHub', 'HackerNews', ...];
const PIPELINE_SOURCES = ['YCombinator', 'Peerlist', ...];
const overlap = LEGACY_SOURCES.filter(s => PIPELINE_SOURCES.includes(s));
if (overlap.length) console.warn(`[WARN] Source overlap: ${overlap.join(', ')}`);
```
