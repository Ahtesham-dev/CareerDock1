# Backlog

**Last Updated:** July 25, 2026
**Related Docs:** [Roadmap](./04-Roadmap.md), [Changelog](./16-Changelog.md)

---

## Critical 🔴

| # | Task | Est. | Dependencies | Notes |
|---|------|------|--------------|-------|
| 1 | Fix CareerIntelligence median/p25/p75 — currently calculated as `$avg` instead of proper percentile | 1h | — | `careerIntelligence.js:20-25` |
| 2 | Add timeout to pipeline `_drainQueue()` — currently hangs if task never completes | 30min | — | `pipeline/orchestrator.js:251-258` |

## High 🟡

| # | Task | Est. | Dependencies | Notes |
|---|------|------|--------------|-------|
| 3 | Add log rotation to logger middleware | 1h | — | Current `error.log` grows unbounded |
| 4 | Add unit tests for pipeline processors (normalizer, validator, deduplicator, storage) | 4h | — | Pipeline has zero test coverage |
| 5 | Fix Cutshort `__NEXT_DATA__` extraction path (8 levels deep, fragile) | 2h | — | `sources/cutshort/index.js:88` |
| 6 | Add pagination cap to Greenhouse extractor (no max page limit) | 30min | — | `extractors/greenhouse.js` |
| 7 | Fix Peerlist NEXT_DATA fallthrough logic (empty array short-circuits) | 1h | — | `sources/peerlist/index.js:108-110` |
| 8 | Migrate remaining legacy scraper sources to pipeline | 8h | — | Consolidate dual ingestion paths |

## Medium 🟡

| # | Task | Est. | Dependencies | Notes |
|---|------|------|--------------|-------|
| 9 | Persist pipeline health monitoring to MongoDB | 3h | — | Currently in-memory (lost on restart) |
| 10 | Consolidate scheduler configuration to respect env vars | 1h | — | Scheduler ignores `PIPELINE_SCHEDULE_FULL` |
| 11 | Fix route default source list consistency (2 vs 5) | 30min | — | Route defaults to 2 sources, scheduler uses 5 |
| 12 | Add Swagger/OpenAPI documentation | 4h | — | Install swagger-jsdoc + swagger-ui-express |
| 13 | Fix recommendation worker — add checkpoint/restart | 2h | — | Crashes mid-batch lose all progress |
| 14 | Add cross-source dedup in aggregator | 2h | — | Current dedup is per-batch only |
| 15 | Fix upsertJobs third fallback query never used | 30min | — | `aggregator.js:59` — `.slice(0,2)` discards fallback |

## Low 🟢

| # | Task | Est. | Dependencies | Notes |
|---|------|------|--------------|-------|
| 16 | Add CI/CD pipeline (GitHub Actions) | 3h | — | Currently manual deploy |
| 17 | Add Redis service to docker-compose | 30min | — | Currently not defined |
| 18 | Fix normalizer skill key `'golang '` trailing space | 5min | — | `normalizer.js:142` |
| 19 | Remove unused `'partial'` PipelineRun status | 5min | — | Never set by any code |
| 20 | Add startup source overlap warning (between legacy + pipeline) | 30min | — | Prevent future scheduler conflicts |

## Ideas 💡

| # | Idea | Notes |
|---|------|-------|
| 21 | Browser extension for one-click job save | Phase 5 |
| 22 | AI resume analyzer with rewrite suggestions | Phase 5 |
| 23 | Company reputation scoring | Phase 5 |
| 24 | Mobile app (React Native) | Phase 6 |
| 25 | Interview preparation assistant | Phase 6 |
| 26 | Recruiter outreach tracker | Phase 6 |
| 27 | Multi-language support | Phase 6 |

## Blocked 🚫

| # | Task | Blocker |
|---|------|---------|
| 28 | Wellfound scraper | DataDome anti-bot — no bypass known |
| 29 | Hirect adapter | Mobile-only, no public API |
| 30 | GitHub scraper returns real jobs | GitHub has no public jobs API |
