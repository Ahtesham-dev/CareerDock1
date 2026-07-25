# AI Session Memory

**Last Updated:** July 25, 2026
**Purpose:** Allow AI coding assistants to continue development without rereading the entire codebase.

---

## Recent Session (July 25, 2026)

### Completed Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Secure POST /api/jobs — authMiddleware + adminMiddleware | ✅ Done |
| 2 | Add Helmet.js security headers | ✅ Done |
| 3 | Add global rate limiting (100 req/min) | ✅ Done |
| 4 | Validate JWT_SECRET + MONGO_URI at startup | ✅ Done |
| 5 | Prevent duplicate job alerts (409 on identical) | ✅ Done |
| 6 | Guest mode route protection (RequireAuth component) | ✅ Done |
| 7 | Email failure propagation (sendJobAlert throws on error) | ✅ Done |
| 8 | Remove dead server/src/jobs/ (18 unreferenced files) | ✅ Done |
| 9 | Update SCRAPER_AUDIT_CHECKPOINT.md date | ✅ Done |
| 10 | Documentation restructure into docs/ (18 files) | ✅ Done |

### Files Changed

```
Modified:
  server/index.js                       — helmet, rate limiter, startup validation
  server/routes/jobs.js                 — auth + admin on POST /
  server/routes/jobAlerts.js            — duplicate alert check
  server/services/email.js              — throw on SMTP failure
  client/src/App.jsx                    — RequireAuth wrapper on 4 routes
  SCRAPER_AUDIT_CHECKPOINT.md           — date update
  server/routes/ROUTES_DOC.md           — outdated sections updated
  server/services/SERVICES_DOC.md       — outdated sections updated
  server/models/MODELS_AUTH_DEPLOY_DOC.md — outdated sections updated

Created:
  client/src/components/RequireAuth.jsx  — guest route guard
  docs/README.md
  docs/01-PRD.md through docs/18-TODO.md  — 18 documentation files
  docs/assets/diagrams/                  — placeholder
  docs/assets/screenshots/               — placeholder

Deleted:
  server/src/jobs/ (18 files)
```

### Architecture Changes

- **Security Layer:** helmet → CORS → global rate limiter (previously: CORS → JSON parser)
- **Auth Layer:** POST /api/jobs now requires admin (previously: public)
- **Email Service:** `sendJobAlert` now throws on SMTP failure instead of logging silently
- **Frontend Routing:** 4 routes wrapped in `<RequireAuth>` (saved, applications, alerts, settings)

### Bug Fixes

- Email service was marking `MatchLog.emailStatus` as `'sent'` even when SMTP failed (service swallowed errors)
- POST /api/jobs had zero authentication — anyone could inject jobs

### Known Issues

1. **Admin middleware uses string comparison** — `ADMIN_USER_ID` is single-user, no RBAC
2. **No MongoDB replica set** — No transaction support, `$text + $meta:'textScore'` falls back to `$regex`
3. **Logger creates `logs/` dir but no log rotation** — `error.log` grows unbounded
4. **MatchLog compound index requires all 3 fields** — Missing fields cause index key errors
5. **Dedup O(n²)** — Full pairwise comparison within each batch
6. **Quality model weights hardcoded** — Cannot tune without code changes
7. **Pipeline `_drainQueue()` has no timeout** — Hangs if task never completes
8. **Recommendation worker sequential** — No `Promise.all`, no checkpoint/restart
9. **CareerIntelligence median/p25/p75 calculated as $avg** — Incorrect aggregation

### Remaining Tasks

- See [TODO.md](./18-TODO.md) for the full backlog

### Current Branch

`master` (no branches created — working directly on main)

### Next Recommended Task

Pick from the [TODO.md](./18-TODO.md) backlog. Highest impact per effort:
1. Fix CareerIntelligence median/p25/p75 → use proper percentile
2. Add timeout to pipeline `_drainQueue()`
3. Add log rotation to logger middleware

### Context Required for Next Session

- All documentation is in `docs/`
- Detailed subsystem docs in respective `server/` directories
- The codebase has no CI/CD pipeline yet
- Tests are minimal (6 test files in `server/__tests__/`)
- Frontend uses Create React App
- Backend uses Express + Mongoose
- No TypeScript — all JavaScript
