# Database

**Last Updated:** July 25, 2026
**Related Docs:** [Backend](./08-Backend.md), [Models Documentation](../server/models/MODELS_AUTH_DEPLOY_DOC.md)

---

## Overview

MongoDB database with Mongoose ODM. All collections are accessed through 12 Mongoose models in `server/models/`.

## Collections

### `jobs` — Core Collection

Stores all job listings from both legacy scrapers and pipeline.

**Model:** `Job` (`models/Job.js`) — 54 lines
**Pipeline Model:** `PipelineJob` (`pipeline/models/Job.js`) — both write to `jobs` collection

**Key Fields:** title, company, location, type, experience, salaryMin/Max, source, description, skills, qualityScore, qualityBreakdown, dupGroup, dupFlagged, dupConfidence, postedAt, lastSeenAt, externalUrl, applyUrl, active, hash

**Indexes:** 13 indexes (postedAt, source, skills, qualityScore, dupGroup/Flagged, salaryMin, location, experience, type, company, hash-sparse, source+sourceJobId-sparse, active+postedAt, lastSeenAt, applyUrlStatus, searchText, active+source+postedAt)

### `users` — User Accounts

**Model:** `User` (`models/User.js`) — 36 lines

**Key Fields:** email (unique, lowercase), password (bcrypt hashed, select: false), name, title, location, skills, bio

**Methods:** `comparePassword(enteredPassword)`

**Hooks:** `pre('save')` — auto-hashes password on modification

### `userprofiles` — Extended Profiles

**Model:** `UserProfile` (`models/UserProfile.js`) — 13 lines

**Key Fields:** userId (unique ref to User), skills, experienceLevel, preferredLocations, preferredJobTypes, preferredSalary, remoteOnly

### `savedjobs` — Kanban Saved Jobs

**Model:** `SavedJob` (`models/SavedJob.js`) — 16 lines

**Key Fields:** userId, jobId, title, company, source, salary, column (enum: saved/applied/interview/rejected/offer)

**Index:** `{ userId: 1, jobId: 1 }` (unique)

### `applications` — Application Tracking

**Model:** `Application` (`models/Application.js`) — 14 lines

**Key Fields:** userId, company, role, appliedDate, status (Saved/Applied/Interview/Offer/Rejected), source, notes, jobId

### `jobalerts` — Job Alert Preferences

**Model:** `JobAlert` (`models/JobAlert.js`) — 20 lines

**Key Fields:** userId, keywords (required), location, minSalary, employmentType, isActive (default: true)

**Used by:** Matching engine — queries `{ isActive: true }`

### `matchlogs` — Alert Match History

**Model:** `MatchLog` (`models/MatchLog.js`) — 12 lines

**Key Fields:** userId, jobId, alertId, matchedAt, emailSentAt, emailStatus (pending/sent/failed)

**Index:** `{ userId: 1, jobId: 1, alertId: 1 }` (unique) — prevents duplicate notifications

### `scraperruns` — Scraper Execution Logs

**Model:** `ScraperRun` (`models/ScraperRun.js`) — 19 lines

**Key Fields:** source, status (running/success/failed), startedAt, completedAt, duration, jobsFound, jobsSaved, jobsRejected, duplicatesRemoved, error

**Index:** `{ source: 1, startedAt: -1 }`

### `sourcehealths` — Source Health Monitoring

**Model:** `SourceHealth` (`models/SourceHealth.js`) — 71 lines

**Key Fields:** source, status (healthy/warning/broken), consecutiveFailures, lastRunAt, lastSuccessAt, lastError, alerts[]

**Methods:** `recordRun(result)` — updates health metrics, auto-alerts on 3+ consecutive failures

### `jobfeedbacks` — User Job Feedback

**Model:** `JobFeedback` (`models/JobFeedback.js`) — 13 lines

**Key Fields:** userId, jobId, vote (up/down), reason, createdAt

**Index:** `{ userId: 1, jobId: 1 }` (unique)

### `recommendations` — Cached Recommendations

**Model:** `Recommendation` (`models/Recommendation.js`) — 20 lines

**Key Fields:** userId, type (job/skill/company/career_path), items[], generatedAt

**TTL Index:** `generatedAt` — expires after 86400s (24h)

### `companies` — Company Registry

**Model:** `Company` (`models/Company.js`) — 28 lines

**Key Fields:** name (unique), normalizedName, domain, description, logoUrl, website, size, industry, totalJobs, avgSalary, avgQualityScore, sources[], verified, rating

**Text Index:** name + aliases

### `skills` — Skill Registry

**Model:** `Skill` (`models/Skill.js`) — 17 lines

**Key Fields:** name (unique, lowercase), category, aliases[], demandCount, avgSalary, growthRate

**Text Index:** name + aliases

### Pipeline-Specific Collections

**PipelineRun** (`pipeline/models/PipelineRun.js`) — tracks each pipeline run with status, duration, counts
**CompanyRegistry** (`pipeline/models/CompanyRegistry.js`) — YC company data synced from yc-oss API

## Relationships

```
User (1) ──── (N) Application
User (1) ──── (N) SavedJob
User (1) ──── (N) JobAlert
User (1) ──── (N) JobFeedback
User (1) ──── (1) UserProfile
Job (1) ───── (N) MatchLog
Job (1) ───── (N) SavedJob
JobAlert (1) ─ (N) MatchLog
```
