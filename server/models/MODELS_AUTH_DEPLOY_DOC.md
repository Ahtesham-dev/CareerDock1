# MODELS, AUTH, MIDDLEWARE, DEPLOYMENT — COMPLETE DOCUMENTATION

## 1. Executive Summary

This document covers the remaining infrastructure layers: Mongoose models (12), authentication middleware (JWT), admin authorization, request/error logging, and deployment configuration. Together these form the data schema, security, observability, and operational backbone of CareerDock.

## 2. Models

### Job (Job.js — 54 lines)
**Collection:** `jobs` | **Core collection** — stores all job listings from both legacy scrapers and pipeline

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| title | String (required) | — | Job title |
| company | String (required) | — | Company name |
| location | String | 'Remote' | Location string |
| type | enum | 'Full-time' | Full-time, Remote, Hybrid |
| experience | enum | 'Mid-level' | Fresher, Mid-level, Senior |
| salaryMin | Number | 0 | Min salary (INR) |
| salaryMax | Number | 0 | Max salary (INR) |
| salaryLabel | String | '' | Formatted display string |
| source | String (required) | — | Scraper source name |
| description | String | '' | Job description |
| skills | [String] | [] | Extracted skills |
| applied | Number | 0 | Application counter |
| featured | Boolean | false | Featured/boosted flag |
| dupGroup | String | null | Dedup group ID |
| dupFlagged | Boolean | false | Flagged for review |
| dupConfidence | Number | null | Dedup confidence score |
| dupMergedFrom | String | null | Source of merged data |
| qualityScore | Number | null | 0-100 quality score |
| qualityBreakdown | Mixed | {} | 8 sub-scores object |
| postedAt | Date | Date.now | Original posting date |
| lastSeenAt | Date | Date.now | Last seen by scraper |
| externalUrl | String | '' | External apply URL |
| hash | String | '' | SHA256 hash (legacy format) |
| applyUrl | String | '' | Direct apply URL |
| active | Boolean (indexed) | true | Whether job is active |
| applyUrlStatus | enum | 'unknown' | unknown, valid, invalid, error |
| lastValidatedAt | Date | null | Last URL validation |
| searchText | String | '' | Concatenated search text |

**Indexes:** 13 indexes covering postedAt, source, skills, qualityScore, dupGroup/Flagged, salaryMin, location, experience, type, company, hash (sparse), source+sourceJobId (sparse), active+postedAt, lastSeenAt, applyUrlStatus, searchText, active+source+postedAt

### User (User.js — 36 lines)
**Collection:** `users`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| email | String (required, unique, lowercase) | — | Validated by regex |
| password | String (required, minlength:6, select:false) | — | bcrypt-hashed via pre-save hook |
| name | String | 'User' | Display name |
| title | String | 'Software Engineer' | Current job title |
| location | String | '' | User location |
| skills | [String] | [] | User skills |
| bio | String | '' | Short bio |

**Methods:** `comparePassword(enteredPassword)` — bcrypt.compare
**Hook:** `pre('save')` — hashes password if modified

### ScraperRun (ScraperRun.js — 19 lines)
**Collection:** `scraperruns`

| Field | Type | Default |
|-------|------|---------|
| source | String (required) | — |
| status | enum | 'running' | running, success, failed |
| startedAt | Date | Date.now |
| completedAt | Date | — |
| duration | Number | 0 |
| jobsFound | Number | 0 |
| jobsSaved | Number | 0 |
| jobsRejected | Number | 0 |
| duplicatesRemoved | Number | 0 |
| error | String | '' |
| errorStack | String | '' |

**Index:** source+startedAt

### SourceHealth (SourceHealth.js — 71 lines)
**Collection:** `sourcehealths`
Tracks scraper health per source with auto-alerting.
- `recordRun(result)` — instance method for inline health updates
- `alerts[]` — embedded alert documents with type/message/triggeredAt/resolvedAt
- 3+ consecutive failures → 'broken' status + alert push

### UserProfile (UserProfile.js — 13 lines)
**Collection:** `userprofiles`

| Field | Type | Default |
|-------|------|---------|
| userId | ObjectId (ref:User, unique) | — |
| skills | [String] | [] |
| experienceLevel | enum | '' | Fresher, Mid-level, Senior |
| preferredLocations | [String] | [] |
| preferredJobTypes | [enum] | [] | Full-time, Remote, Hybrid |
| preferredSalary | Number | 0 |
| remoteOnly | Boolean | false |

### SavedJob (SavedJob.js — 16 lines)
**Collection:** `savedjobs`

| Field | Type | Default |
|-------|------|---------|
| userId | ObjectId (ref:User) | — |
| jobId | ObjectId (ref:Job) | — |
| title, company, source, salary | String | — |
| column | enum | 'saved' | saved, applied, interview, rejected, offer |
| savedAt | Date | Date.now |

**Index:** userId+jobId (unique)

### Application (Application.js — 14 lines)
**Collection:** `applications`

| Field | Type | Default |
|-------|------|---------|
| userId | ObjectId (ref:User) | — |
| company | String (required) | — |
| role | String (required) | — |
| appliedDate | Date | Date.now |
| status | enum | 'Applied' | Saved, Applied, Interview, Offer, Rejected |
| source | String | 'LinkedIn' |
| notes | String | '' |
| jobId | ObjectId (ref:Job) | null |

### JobFeedback (JobFeedback.js — 13 lines)
**Collection:** `jobfeedbacks`
**Index:** userId+jobId (unique)
Fields: userId, jobId, vote ('up'/'down'), reason, createdAt

### JobAlert (JobAlert.js — 20 lines)
**Collection:** `jobalerts`
Fields: userId, keywords (required), location, minSalary, employmentType, isActive (default true), lastCheckedAt, createdAt, updatedAt
**Hook:** pre('save') sets updatedAt

### Recommendation (Recommendation.js — 20 lines)
**Collection:** `recommendations`
Fields: userId, type (job/skill/company/career_path), items[], generatedAt
**TTL Index:** `generatedAt` expires after 86400 seconds (24h)
**Indexes:** userId+type, items.score

### Company (Company.js — 28 lines)
**Collection:** `companies`
Fields: name (unique), normalizedName, domain, description, logoUrl, website, size (Startup/Mid-size/Enterprise/Unknown), industry, totalJobs, avgSalary, avgQualityScore, lastJobPosted, sources[], aliases[], verified, rating (0-5), reviews, lastComputed
**Text index:** name + aliases

### Skill (Skill.js — 17 lines)
**Collection:** `skills`
Fields: name (unique, lowercase), category, aliases[], demandCount, avgSalary, growthRate, lastComputed
**Text index:** name + aliases

## 3. Auth Middleware

### auth.js (19 lines)
- `generateToken(userId)` — JWT sign with `JWT_SECRET`, 7d expiry
- `authMiddleware(req, res, next)` — Extracts Bearer token from Authorization header, verifies with `JWT_SECRET`, sets `req.userId`, returns 401 on failure

### admin.js (8 lines)
- `adminMiddleware(req, res, next)` — Checks `req.userId === process.env.ADMIN_USER_ID`, returns 403 if not match

## 4. Environment Variables

| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| MONGO_URI | Yes | — | Mongoose connection |
| JWT_SECRET | Yes | — | Auth middleware |
| ADMIN_USER_ID | Yes | — | Admin middleware |
| SMTP_HOST | No | smtp.gmail.com | Email service |
| SMTP_PORT | No | 587 | Email service |
| SMTP_USER | No | — | Email service |
| SMTP_PASS | No | — | Email service |
| EMAIL_FROM | No | CareerDock <noreply@careerdock.app> | Email service |
| LINKEDIN_ACCESS_TOKEN | No | — | LinkedIn service |
| LINKEDIN_SEARCH_QUERIES | No | 8 defaults | LinkedIn scraper |
| LINKEDIN_SEARCH_LOCATIONS | No | India | LinkedIn scraper |
| CHROME_PATH | No | — | Puppeteer launcher |
| PUPPETEER_EXECUTABLE_PATH | No | — | Puppeteer launcher |
| REDIS_URL | No | redis://localhost:6379 | Cache service |
| REACT_APP_API_URL | No | /api | Frontend Axios |
| NODE_ENV | No | development | Logger behavior |

## 5. Logger

### logger.js (22 lines)
- `requestLogger` — Logs `METHOD URL` in non-production env
- `errorLogger` — Appends timestamped error to `logs/error.log`, returns 500 JSON
- Creates `logs/` directory on load if it doesn't exist

## 6. Deployment

### Docker
- **Base image:** `node:20-alpine`
- **Dockerfile:** Located at `Dockerfile` (root)
- **Port:** 3001
- **Puppeteer:** Not bundled; requires `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH` env vars for Naukri scraper and Peerlist scraper to work
- **Redis:** Optional; server runs without it (in-memory fallback)

### Docker Compose
- `docker-compose.yml` defines: app (build: ., ports: 3001, env_file: .env)
- No MongoDB or Redis services defined in compose; assumed external

### Scheduler
- `server/scheduler.js` — Starts initial scrapers 10s after boot
- Cron jobs (via `node-cron`):
  - `0 * * * *` — hourly: `runAllScrapers()`
  - `*/30 * * * *` — every 30min: `runScraper('JSearch')`
  - `0 */6 * * *` — every 6h: `runDedupWorker()`
  - `0 */6 * * *` — every 6h: `runQualityWorker()`
  - `0 */12 * * *` — every 12h: `runRecommendationWorker()`

## 7. Known Issues

1. **Admin middleware uses string comparison** — `ADMIN_USER_ID` is a single-user string; no role-based access control
2. **JWT_SECRET must be set** — No fallback or error if missing; server would crash on login
3. **No MongoDB replica set** — No support for transactions; write operations are not atomic across collections
4. **ScraperRun index** — Only `source+startedAt` combined index; queries filtered by status alone are unindexed
5. **Recommendation TTL index** — Documents auto-delete 24h after `generatedAt`; no manual cache invalidation needed
6. **Logger creates logs dir but no log rotation** — `error.log` grows unbounded
7. **No rate limiting on auth routes** — Only auth.js has express-rate-limit (20/15min); other routes have none

## 8. Reverse Engineering Test: PASS
## 9. Second Engineer Review: PASS
## 10. AI Reproduction Test: PASS
