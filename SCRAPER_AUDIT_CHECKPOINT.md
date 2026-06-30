# Scraper Audit Checkpoint — June 30, 2026

## Final Results

### Legacy Scrapers (server/scrapers/)

| Scraper | Status | Jobs/run | Notes |
|---------|--------|----------|-------|
| JSearch | **PASS** | ~200 | Fixed: skip metadata element, null salary→0, explicit applyUrl |
| HackerNews | **PASS** | ~24 | Fixed: search_by_date + author_whoishiring tag for current month |
| Dev.to | **PASS** | ~20 | Fixed: filter for "is hiring" pattern with company extraction |
| LinkedIn | **PASS** | ~50+ | Rewritten: guest API endpoint instead of deprecated v2 API |
| Internshala | **PASS** | ~22 | As-is: 22 tech jobs via HTML parsing |
| GitHub | **FAIL** | — | Searches repos not jobs; generates fake titles. No public jobs API. |
| Wellfound | **FAIL** | — | DataDome anti-bot blocks GraphQL requests even with puppeteer |
| Naukri | **FAIL** | — | Akamai CDN blocks headless puppeteer; API requires reCAPTCHA |
| Career Pages | **FAIL** | — | All 6 companies use JS SPAs; redundant with YC pipeline |

### Pipeline Sources (server/pipeline/sources/)

| Source | Status | Notes |
|--------|--------|-------|
| YCombinator | **PASS** | 5996 companies; platform detection + direct extractors work |
| Cutshort | **PASS** | Pipeline adapter (tested separately) |
| Peerlist | **PASS** | Pipeline adapter (tested separately) |
| Instahyre | **PASS** | Pipeline adapter (tested separately) |

### DB Snapshot
- **Total jobs**: 1,552
- **Top sources**: Instahyre 443, Cutshort 310, JSearch 226, Dev.to 191, LinkedIn 152
- **Pipeline runs**: Dev.to (success, 21 jobs), HackerNews (success, 24 jobs)

## Deployment Gate
- ✅ All scraper files exist
- ✅ All JS files pass syntax check
- ✅ Aggregator loads without errors
- ✅ YCombinator pipeline adapter loads
- ✅ All pipeline extractors load (Greenhouse, Lever, Ashby, Workable, Teamtailor)
- ✅ MongoDB running
- ✅ 9 scrapers registered in aggregator
- ⚠️ 4 scrapers marked FAIL — they return 0 jobs but don't crash the pipeline

## Key Fixes Applied
1. **JSearch**: `applyUrl` from link not metadata; null salary→0; proper source field
2. **HackerNews**: Search API → `search_by_date` with `author_whoishiring` tag
3. **Dev.to**: Article filter → match "is hiring" + clean title/article prefix removal
4. **LinkedIn**: Full rewrite using public guest HTML endpoint

## Failed Scrapers (intentional)
- Wellfound, GitHub, Naukri, Career Pages — all produce 0 jobs without crashing
- These consume scheduler time but don't affect pipeline health
- Consider removing from SCRAPERS array in aggregator.js if performance is a concern
