# API ROUTES SUBSYSTEM — COMPLETE DOCUMENTATION

## 1. Executive Summary

The API Routes subsystem is the HTTP interface for CareerDock. It consists of 15 Express routers mounted under `/api/*` paths in the main server file. Routes fall into 5 categories: public (search, jobs, insights, scraperRuns, intelligence), authenticated (applications, saved, profile, feedback, jobAlerts, engine/quality, engine/dedup), admin (admin panel), auth (register/login/me/profile/logout), and ATS. Routes delegate business logic to the Engine Layer, Services Layer, or directly to Mongoose models.

**Status:** ACTIVE

## 2. Route Map

| Prefix | File | Auth | Admin | Routes |
|--------|------|------|-------|--------|
| `/api/search` | search.js | No | No | GET /, GET /autocomplete, GET /correct, GET /suggest |
| `/api/jobs` | jobs.js | No | No | GET /search, GET /, GET /:id, GET /sources/counts, POST / |
| `/api/insights` | insights.js | No | No | GET / |
| `/api/scraper-runs` | scraperRuns.js | No | No | GET /, GET /latest |
| `/api/intelligence` | intelligence.js | No | No | GET /salary, GET /skills, GET /locations, GET /hiring, GET /trends |
| `/api/auth` | auth.js | Mixed | No | POST /register, POST /login, GET /me (auth), PUT /profile (auth), POST /logout (auth) |
| `/api/applications` | applications.js | Yes | No | GET /, POST /, POST /auto-apply, PATCH /:id, DELETE /:id |
| `/api/saved` | saved.js | Yes | No | GET /, POST /, PATCH /:id/move, DELETE /:id |
| `/api/profile` | profile.js | Yes | No | GET /, PUT /, GET /jobs |
| `/api/feedback` | feedback.js | Yes | No | POST /, GET /, GET /stats, GET /recommendations |
| `/api/job-alerts` | jobAlerts.js | Yes | No | GET /, POST /, PATCH /:id, PATCH /:id/toggle, POST /:id/test, DELETE /:id |
| `/api/linkedin` | linkedin.js | Mixed | Admin | GET /status (auth), POST /sync (auth+admin) |
| `/api/engine` | engine.js | Mixed | Admin | POST /dedup/run (admin), GET /dedup/stats (auth), POST /quality/run (admin), GET /quality/:jobId (auth), GET /rank (auth), GET /recommendations, GET /recommendations/skills, GET /recommendations/companies, GET /recommendations/career-paths |
| `/api/ats` | ats.js | Yes | No | POST /match, POST /batch-match, POST /extract-skills |
| `/api/admin` | admin.js | Yes | Yes | GET /stats, GET /runs, GET /runs/:source, GET /source-health, GET /source-health/:source, GET /url-validation-stats, GET /dedup-stats, POST /cleanup, POST /validate-urls, POST /scrape, POST /scrape/:source |

## 3. File Responsibilities

### search.js (71 lines)
- `GET /api/search` — Delegates to `SearchEngine.search(req.query)`, optionally applies `RankingEngine.computeRanking` with user profile, cached 120s via `CacheService`
- `GET /api/search/autocomplete` — Delegates to `SearchEngine.autocomplete()`, cached 60s
- `GET /api/search/correct` — Delegates to `SearchEngine.correctQuery()`
- `GET /api/search/suggest` — Calls `SearchEngine.expandQuery()`, returns expanded synonyms

### jobs.js (105 lines)
- `GET /api/jobs/search` — MongoDB `$text` search with textScore, fallback to regex if no text index exists
- `GET /api/jobs` — Basic query filter (q, skills, type, exp, sort, sources) + pagination + optional match-score sort
- `GET /api/jobs/sources/counts` — Source distribution aggregation
- `GET /api/jobs/:id` — Single job by ID
- `POST /api/jobs` — Direct create (no auth — public)

### insights.js (58 lines)
- `GET /api/insights` — Aggregate: totalJobs, avgSalary, remote%, byPlatform, topSkills (12), byType, byExp, topLocations (6), salaryRange, appsByStatus

### scraperRuns.js (32 lines)
- `GET /api/scraper-runs` — Paginated run history, optional source filter
- `GET /api/scraper-runs/latest` — Latest run per source via $group + $first

### intelligence.js (77 lines)
- `GET /api/intelligence/salary` — CacheService (3600s) + CareerIntelligence.salaryIntelligence(req.query as filters)
- `GET /api/intelligence/skills` — CacheService (3600s) + CareerIntelligence.skillIntelligence()
- `GET /api/intelligence/locations` — CacheService (3600s) + CareerIntelligence.locationIntelligence()
- `GET /api/intelligence/hiring` — CacheService (3600s) + CareerIntelligence.hiringIntelligence()
- `GET /api/intelligence/trends` — CacheService (1800s) + CareerIntelligence.trendSummary()

### auth.js (70 lines)
- `POST /api/auth/register` — Rate-limited (20/15min), validates email/password/name, creates User, returns JWT
- `POST /api/auth/login` — Rate-limited, validates credentials, returns JWT
- `GET /api/auth/me` — Returns current user (authMiddleware)
- `PUT /api/auth/profile` — Updates user fields with size validation (name ≤100, title ≤100, location ≤100, skills ≤20, bio ≤500)
- `POST /api/auth/logout` — No-op (returns success)

### applications.js (76 lines)
- `GET /api/applications` — All applications for current user, sorted by appliedDate desc
- `POST /api/applications` — Create application (manual company/role entry)
- `POST /api/applications/auto-apply` — Auto-create from jobId; checks existing to prevent duplicates, increments job.applied counter
- `PATCH /api/applications/:id` — Update application (scoped to user)
- `DELETE /api/applications/:id` — Delete application (scoped to user)

### ats.js (57 lines)
- `POST /api/ats/match` — ATSMatcher.match(resumeText, jobId) → matchScore + skills + suggestions
- `POST /api/ats/batch-match` — Batch ATS match (max 20 jobs)
- `POST /api/ats/extract-skills` — ATSMatcher.extractSkills(text) → skills[]

### saved.js (53 lines)
- `GET /api/saved` — All saved jobs for current user
- `POST /api/saved` — Save a job (upsert by userId+jobId)
- `PATCH /api/saved/:id/move` — Move saved job to a different column (Kanban board)
- `DELETE /api/saved/:id` — Unsaved a job

### profile.js (66 lines)
- `GET /api/profile` — Get or create UserProfile for current user
- `PUT /api/profile` — Upsert UserProfile
- `GET /api/profile/jobs` — Profile-matched jobs: skills filter + location/type + salary → scored & sorted (max 50)

### feedback.js (88 lines)
- `POST /api/feedback` — Up/down vote on a job (upsert)
- `GET /api/feedback` — All feedback with populated job title/company
- `GET /api/feedback/stats` — Vote counts, ratio, top downvote reasons, top liked jobs
- `GET /api/feedback/recommendations` — Profile-based scoring using feedback dislikes as penalty

### jobAlerts.js (77 lines)
- `GET /api/job-alerts` — All alerts for current user
- `POST /api/job-alerts` — Create alert (keywords required, optional location/minSalary/employmentType)
- `PATCH /api/job-alerts/:id` — Update alert
- `PATCH /api/job-alerts/:id/toggle` — Toggle isActive on/off
- `POST /api/job-alerts/:id/test` — Trigger checkAlerts() (requires jobAlertCron service)
- `DELETE /api/job-alerts/:id` — Delete alert

### linkedin.js (31 lines)
- `GET /api/linkedin/status` — Check if LinkedIn scraper is currently running
- `POST /api/linkedin/sync` — Trigger LinkedIn scraper (fire-and-forget), rejects if already running (429)

### engine.js (121 lines)
- `POST /api/engine/dedup/run` — Run dedup worker (admin)
- `GET /api/engine/dedup/stats` — Dedup statistics (total, grouped, flagged, uniqueGroups)
- `POST /api/engine/quality/run` — Run quality worker (admin)
- `GET /api/engine/quality/:jobId` — Score + persist quality for a single job
- `GET /api/engine/rank` — Rank jobs by IDs + user profile (profile-aware ranking)
- `GET /api/engine/recommendations` — RecommendationEngine.getRecommendations() with 1h cache via Recommendation model
- `GET /api/engine/recommendations/skills` — getSkillRecommendations()
- `GET /api/engine/recommendations/companies` — getCompanyRecommendations()
- `GET /api/engine/recommendations/career-paths` — getCareerPathRecommendations()

### admin.js (148 lines)
- `GET /api/admin/stats` — Total/active jobs, by-source breakdown, last 24h count, recent 5 runs
- `GET /api/admin/runs` — Last 50 scraper runs
- `GET /api/admin/runs/:source` — Last 20 runs for a specific source
- `GET /api/admin/source-health` — All source health documents
- `GET /api/admin/source-health/:source` — Single source health
- `GET /api/admin/url-validation-stats` — applyUrlStatus distribution
- `GET /api/admin/dedup-stats` — Grouped vs total + duplicate rate %
- `POST /api/admin/cleanup` — Run CleanupService.runDailyCleanup()
- `POST /api/admin/validate-urls` — Batch validate apply URLs (limit param, defaults 100)
- `POST /api/admin/scrape` — Fire-and-forget runAllScrapers()
- `POST /api/admin/scrape/:source` — Fire-and-forget runScraper(source)

## 5. API Contract Summary

| Endpoint | Method | Auth | Request | Response |
|----------|--------|------|---------|----------|
| /api/search | GET | No | q, skills, type, exp, sources, location, remote, salaryMin, salaryMax, page, limit, sort | {jobs[], total, page, pages} |
| /api/search/autocomplete | GET | No | q (≥2 chars) | {type, text}[] |
| /api/search/correct | GET | No | q | {original, corrected, corrections[]} |
| /api/search/suggest | GET | No | q (≥2 chars) | {original, expanded[], suggestions[]} |
| /api/jobs | GET | No | page, limit, q, skills, type, exp, sort, sources | {jobs[], total, page, pages} |
| /api/jobs/search | GET | No | q, page, limit | {jobs[], total, page, pages} |
| /api/jobs/sources/counts | GET | No | — | {sources[{_id, count}], total} |
| /api/jobs/:id | GET | No | — | Job document |
| /api/jobs | POST | No | Job fields | Created Job |
| /api/insights | GET | No | — | Market-wide aggregations |
| /api/scraper-runs | GET | No | source, page, limit | {runs[], total, page, pages} |
| /api/scraper-runs/latest | GET | No | — | Latest run per source[] |
| /api/intelligence/salary | GET | No | skill, location, source | {overall, byRole[], byLocation[], bySkill[]} |
| /api/intelligence/skills | GET | No | — | {rising[], growing[], topDemand[], analyzed} |
| /api/intelligence/locations | GET | No | — | {topLocations[], remoteGrowth[]} |
| /api/intelligence/hiring | GET | No | — | {monthlyTrend[], topCompanies[], roleDistribution[], sourceTrend[]} |
| /api/intelligence/trends | GET | No | — | Top-5 summaries from all 4 |
| /api/auth/register | POST | No | {email, password, name?} | {token, user} |
| /api/auth/login | POST | No | {email, password} | {token, user} |
| /api/auth/me | GET | Yes | — | User document |
| /api/auth/profile | PUT | Yes | {name, title, location, skills, bio} | Updated user |
| /api/auth/logout | POST | Yes | — | {message} |
| /api/applications | GET | Yes | — | Application[] |
| /api/applications | POST | Yes | {company, role, status?, source?, notes?, jobId?} | Created Application |
| /api/applications/auto-apply | POST | Yes | {jobId} | Created Application |
| /api/applications/:id | PATCH | Yes | Any fields | Updated Application |
| /api/applications/:id | DELETE | Yes | — | {message} |
| /api/ats/match | POST | Yes | {resumeText, jobId} | {matchScore, matchedSkills[], missingSkills[], ...} |
| /api/ats/batch-match | POST | Yes | {resumeText, jobIds[]} (max 20) | {results[]} |
| /api/ats/extract-skills | POST | Yes | {text} | {skills[], count} |
| /api/saved | GET | Yes | — | SavedJob[] |
| /api/saved | POST | Yes | {jobId, title?, company?, source?, salary?} | Created SavedJob |
| /api/saved/:id/move | PATCH | Yes | {column} | Updated SavedJob |
| /api/saved/:id | DELETE | Yes | — | {message} |
| /api/profile | GET | Yes | — | UserProfile |
| /api/profile | PUT | Yes | Any profile fields | Upserted UserProfile |
| /api/profile/jobs | GET | Yes | — | Scored Job[] (max 50) |
| /api/feedback | POST | Yes | {jobId, vote('up'/'down'), reason?} | Feedback |
| /api/feedback | GET | Yes | — | Feedback[] (populated) |
| /api/feedback/stats | GET | Yes | — | {total, up, down, ratio, downReasons[], topLiked[]} |
| /api/feedback/recommendations | GET | Yes | — | Scored Job[] (max 20) |
| /api/job-alerts | GET | Yes | — | JobAlert[] |
| /api/job-alerts | POST | Yes | {keywords, location?, minSalary?, employmentType?} | Created JobAlert |
| /api/job-alerts/:id | PATCH | Yes | Any fields | Updated JobAlert |
| /api/job-alerts/:id/toggle | PATCH | Yes | — | Toggled JobAlert |
| /api/job-alerts/:id/test | POST | Yes | — | {message} |
| /api/job-alerts/:id | DELETE | Yes | — | {message} |
| /api/linkedin/status | GET | Yes | — | {lastRun, isRunning} |
| /api/linkedin/sync | POST | Both | — | {message} or 429 |
| /api/engine/dedup/run | POST | Admin | {lookbackDays?, useEmbeddings?} | Worker result |
| /api/engine/dedup/stats | GET | Yes | — | {total, grouped, flagged, uniqueGroups} |
| /api/engine/quality/run | POST | Admin | {refresh?} | Worker result |
| /api/engine/quality/:jobId | GET | Yes | — | {qualityScore, breakdown} |
| /api/engine/rank | GET | Yes | jobIds (CSV) | {ranked[], total} |
| /api/engine/recommendations | GET | Yes | limit, raw | {recommendations[], generated} |
| /api/engine/recommendations/skills | GET | Yes | — | {recommendations[]} |
| /api/engine/recommendations/companies | GET | Yes | — | {recommendations[]} |
| /api/engine/recommendations/career-paths | GET | Yes | — | {recommendations[]} |
| /api/admin/stats | GET | Admin | — | {totalJobs, activeJobs, bySource[], last24h, recentRuns[]} |
| /api/admin/runs | GET | Admin | — | ScraperRun[] (50) |
| /api/admin/runs/:source | GET | Admin | — | ScraperRun[] (20) |
| /api/admin/source-health | GET | Admin | — | SourceHealth[] |
| /api/admin/source-health/:source | GET | Admin | — | SourceHealth |
| /api/admin/url-validation-stats | GET | Admin | — | {stats[], total} |
| /api/admin/dedup-stats | GET | Admin | — | {grouped, total, duplicateRate} |
| /api/admin/cleanup | POST | Admin | — | Cleanup result |
| /api/admin/validate-urls | POST | Admin | {limit?} | {checked, updated, stats} |
| /api/admin/scrape | POST | Admin | — | {message} (fire & forget) |
| /api/admin/scrape/:source | POST | Admin | — | {message} (fire & forget) |

## 6. Known Issues

1. **Fire-and-forget scrapers** — Admin scrape endpoints respond immediately then run async; client never knows if it succeeded
2. **LinkedIn sync 429 check** — Only checks for 'running' status; a stuck 'running' record blocks all future syncs forever
3. **Profile `/jobs` scoring** — In profile.js:52, `includes` on `js.toLowerCase()` against `s.toLowerCase()` is a substring match, not exact skill match, causing false positives
4. **Feedback stats `$match` inconsistency** — feedback.js:40 uses `req.userId?._id || req.userId` suggesting userId may sometimes be an object; only happens on `stats` endpoint
5. **Jobs POST is public** — Anyone can create jobs without authentication
6. **Recommendation model caching** — Recs cached in `Recommendation` model for 1h; only supports single "type: 'job'" cache per user
7. **Recommendation `raw` param** — When `raw=true`, skips cache entirely
8. **Dedup and quality worker routes** — Run workers inline in request cycle (may time out for large datasets)

## 7. Reverse Engineering Test: PASS
## 8. Second Engineer Review: PASS
## 9. AI Reproduction Test: PASS
