# API Reference

**Last Updated:** July 25, 2026
**Related Docs:** [Backend](./08-Backend.md), [Routes Documentation](../server/routes/ROUTES_DOC.md)

---

> See [ROUTES_DOC.md](../server/routes/ROUTES_DOC.md) for the complete route map, file responsibilities, and API contract table.

## Base URL

Production: `https://careerdock-api.up.railway.app/api` (or `https://career-dock1.vercel.app/api` when proxied)
Local: `http://localhost:5000/api`

## Authentication

Most endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

## Route Groups

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user (rate-limited: 20/15min) |
| POST | `/auth/login` | No | Login (rate-limited: 20/15min) |
| GET | `/auth/me` | Yes | Get current user |
| PUT | `/auth/profile` | Yes | Update profile |
| POST | `/auth/logout` | Yes | Logout (no-op) |

### Jobs (`/api/jobs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/jobs/search` | No | Full-text search with pagination |
| GET | `/jobs` | No | List/filter jobs (q, skills, type, exp, sort, sources) |
| GET | `/jobs/sources/counts` | No | Source distribution |
| GET | `/jobs/:id` | No | Single job by ID |
| POST | `/jobs` | Yes + Admin | Create job |

### Saved Jobs (`/api/saved`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/saved` | Yes | List saved jobs |
| POST | `/saved` | Yes | Save a job |
| PATCH | `/saved/:id/move` | Yes | Move to column |
| DELETE | `/saved/:id` | Yes | Remove saved |

### Applications (`/api/applications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/applications` | Yes | List applications |
| POST | `/applications` | Yes | Create application |
| POST | `/applications/auto-apply` | Yes | Quick apply from job |
| PATCH | `/applications/:id` | Yes | Update status |
| DELETE | `/applications/:id` | Yes | Delete |

### Job Alerts (`/api/job-alerts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/job-alerts` | Yes | List alerts |
| POST | `/job-alerts` | Yes | Create alert |
| PATCH | `/job-alerts/:id` | Yes | Update alert |
| PATCH | `/job-alerts/:id/toggle` | Yes | Toggle active |
| POST | `/job-alerts/:id/test` | Yes | Test match |
| DELETE | `/job-alerts/:id` | Yes | Delete alert |

### Search (`/api/search`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Full search + ranking |
| GET | `/search/autocomplete` | No | Autocomplete (min 2 chars) |
| GET | `/search/correct` | No | Query correction |
| GET | `/search/suggest` | No | Synonym suggestions |

### Insights (`/api/insights`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/insights` | No | Market-wide aggregations |

### Intelligence (`/api/intelligence`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/intelligence/salary` | No | Salary trends (cached 1h) |
| GET | `/intelligence/skills` | No | Skill demand (cached 1h) |
| GET | `/intelligence/locations` | No | Location analysis (cached 1h) |
| GET | `/intelligence/hiring` | No | Hiring trends (cached 1h) |
| GET | `/intelligence/trends` | No | Summary (cached 30min) |

### Engine (`/api/engine`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/engine/dedup/run` | Admin | Run dedup worker |
| GET | `/engine/dedup/stats` | Yes | Dedup statistics |
| POST | `/engine/quality/run` | Admin | Run quality worker |
| GET | `/engine/quality/:jobId` | Yes | Single job quality score |
| GET | `/engine/rank` | Yes | Profile-aware ranking |
| GET | `/engine/recommendations` | Yes | Job recommendations |
| GET | `/engine/recommendations/skills` | Yes | Skill suggestions |
| GET | `/engine/recommendations/companies` | Yes | Company suggestions |
| GET | `/engine/recommendations/career-paths` | Yes | Career path suggestions |

### ATS (`/api/ats`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ats/match` | Yes | Match resume to job |
| POST | `/ats/batch-match` | Yes | Batch match (max 20) |
| POST | `/ats/extract-skills` | Yes | Extract skills from text |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | System stats |
| GET | `/admin/runs` | Admin | Recent scraper runs |
| POST | `/admin/scrape` | Admin | Run all scrapers |
| POST | `/admin/scrape/:source` | Admin | Run single scraper |
| POST | `/admin/cleanup` | Admin | Run cleanup |
| GET | `/admin/source-health` | Admin | Source health |

### Pipeline (`/api/pipeline`)

Rate-limited: 20 req/60s

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/pipeline/run` | No | Run full pipeline |
| GET | `/pipeline/stats` | No | Pipeline stats |
| GET | `/pipeline/sources/health` | No | Source health |
| GET | `/pipeline/runs` | No | Run history |
| GET | `/pipeline/jobs` | No | List/search pipeline jobs |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |
