# Features

**Last Updated:** July 25, 2026
**Related Docs:** [PRD](./01-PRD.md), [Roadmap](./04-Roadmap.md)

---

## Job Aggregation

Jobs aggregated from 14+ sources into a single MongoDB collection with deduplication.

**Sources:** LinkedIn, Naukri, JSearch, Dev.to, HackerNews, Internshala, GitHub, Wellfound (blocked), Career Pages, YCombinator, Peerlist, Cutshort, Instahyre, Hirect (mobile-only, 0 jobs)

## Search & Filter

- Full-text search via MongoDB `$text` index with `$regex` fallback
- Filters: skills, job type, experience level, salary range, source
- Sort: relevance, newest, salary, quality
- Autocomplete and query correction
- Synonym expansion (38 groups)

## Quality Scoring

8-factor model scoring each job 0–100:
- Salary present (15%), Remote option (10%), Company reputation (10%)
- Freshness (15%), Description detail (15%), Skill richness (15%)
- Verified company (10%), Application simplicity (10%)

## Kanban Pipeline

Drag-and-drop job tracking across 5 columns: Saved → Applied → Interview → Offer → Rejected

## Email Alerts

- Create alerts with keywords, location, min salary, employment type
- Matching engine runs every 30 minutes
- Dedup: unique userId+jobId+alertId prevents duplicate notifications
- Email delivery tracked in MatchLog with status (pending/sent/failed)

## Market Intelligence

| Analysis | What It Shows |
|----------|--------------|
| Salary trends | Avg/median by role, location, skill, experience |
| Skill demand | Monthly/quarterly growth rates, trend labels |
| Location analytics | Top cities by job count, avg salary, remote % |
| Hiring activity | Monthly trends, top companies (30d), role distribution |

## ATS Resume Matching

- Skill extraction against 160+ keywords
- TF-IDF text similarity
- Experience fit detection
- Generates suggestions for skill gaps

## Recommendations

| Type | Logic |
|------|-------|
| Jobs | Skill overlap (40%), location (15%), type (8%), salary (5%), feedback |
| Skills | Trending skills minus user's + saved |
| Companies | Top hiring companies by count + avg quality |
| Career paths | Role transition analysis with skill gap, salary, difficulty |

## Guest Mode

Full browse without registration. Uses `localStorage` flag. Mutating routes (saved, applications, alerts, profile) require registration.

## Security Features

- Helmet HTTP headers (CSP, X-Frame-Options, etc.)
- Global rate limiting (100 req/min per IP)
- JWT authentication with 7-day expiry
- Admin-only job creation
- Startup validation of critical env vars
- Graceful shutdown on SIGINT/SIGTERM
