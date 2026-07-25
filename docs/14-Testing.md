# Testing

**Last Updated:** July 25, 2026
**Related Docs:** [Contributing](./15-Contributing.md), [Workers Documentation](../server/workers/WORKERS_DOC.md)

---

## Test Runner

Jest (configured at root `package.json`).

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch
```

## Test Suites

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| Application Controller | `server/__tests__/applicationController.test.js` | — | Active |
| Email Service | `server/__tests__/emailService.test.js` | 1 | Active |
| isMatch | `server/__tests__/isMatch.test.js` | — | Active |
| Job Alert Controller | `server/__tests__/jobAlertController.test.js` | — | Active |
| Profile Engine | `server/__tests__/profileEngine.test.js` | — | Active |
| Search Engine | `server/__tests__/searchEngine.test.js` | — | Active |

## Client-Side Tests

```bash
cd client && npm test
```

- Uses `react-scripts test` (Jest + React Testing Library)
- MobileNav test located at `client/src/layout/MobileNav.test.jsx`

## Manual Testing

### Backend

```bash
# Pipeline ingestion
npm run pipeline:yc           # YCombinator
npm run pipeline:peerlist     # Peerlist
npm run pipeline:run          # Full pipeline

# Workers
node server/workers/dedupWorker.js
node server/workers/qualityWorker.js
node server/workers/recommendationWorker.js

# Legacy scrapers
node server/runAggregator.js

# Individual scraper test
node testScrapers.js
```

### API Endpoints

```bash
# Health
curl http://localhost:5000/api/health

# Auth (rate-limited)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Protected route (requires token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Jobs (public reads)
curl http://localhost:5000/api/jobs
```

## Test Coverage Areas

| Area | Coverage | Notes |
|------|----------|-------|
| Auth | Manual | No auth-specific test suite |
| Routes | Partial | applicationController + jobAlertController |
| Engine | Partial | isMatch, searchEngine, profileEngine |
| Services | Minimal | emailService only |
| Scrapers | None | Tested via manual runs |
| Pipeline | None | Tested via npm run pipeline:* |
| Workers | None | Tested via node commands |
| Frontend | Minimal | MobileNav.test.jsx |

## Writing Tests

- Place server tests in `server/__tests__/`
- Place client tests next to components (`Component.test.jsx`)
- Use `describe`/`test` blocks following existing patterns
- Mock external services (email, Redis, external APIs)
