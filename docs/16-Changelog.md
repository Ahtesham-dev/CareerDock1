# Changelog

**Last Updated:** July 25, 2026

---

## v1.2 — Security Hardening (July 25, 2026)

### Added
- Helmet security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- Global rate limiter (100 req/min per IP)
- JWT_SECRET + MONGO_URI validation at server startup (fail-fast)
- RequireAuth component — blocks guest users from mutating routes
- Duplicate alert detection (POST /api/job-alerts returns 409 if identical alert exists)

### Changed
- POST /api/jobs now requires auth + admin middleware
- Email sendJobAlert now throws on failure instead of silent logging
- runMatching emails now correctly mark MatchLog as 'failed' on SMTP errors
- Documentation restructured into docs/ with 18 files

### Removed
- Dead server/src/jobs/ directory (18 files, unreferenced)

### Fixed
- Email service silently marking emails as 'sent' when SMTP fails

## v1.1 — Alerts & Statistics (June 28, 2026)

### Added
- Job alert creation + email notifications
- Matching engine (isMatch, runMatching, pollNewJobs)
- Statistics dashboard (MissionControlDashboard)
- Pipeline ingestion system (YC, Peerlist, Cutshort, Instahyre)
- Worker system (dedup, quality, recommendation batch scripts)

### Changed
- Two-scheduler architecture verified (no source overlap)
- Scraper audit with fixes for JSearch, HackerNews, Dev.to, LinkedIn

## v1.0 — Initial Release (June 25, 2026)

### Added
- Landing page with marketing content
- User authentication (register, login, JWT, guest mode)
- Job feed with search, filters, pagination
- Job detail page
- 9 legacy scrapers (JSearch, LinkedIn, GitHub, etc.)
- Saved jobs Kanban board
- Application tracking
- 7 engines (Search, Ranking, Recommendation, Quality, Dedup, ATS, CareerIntelligence)
- Market intelligence endpoints
- Admin panel
- Responsive design with mobile navigation
- Docker support
- Railway deployment config
