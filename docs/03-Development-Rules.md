# Development Rules

**Last Updated:** July 25, 2026
**Related Docs:** [Contributing](./15-Contributing.md), [Testing](./14-Testing.md)

---

## Folder Conventions

```
server/
  routes/    — Express routers only (thin, delegate to services/engines)
  models/    — Mongoose schemas only (no business logic)
  engine/    — Stateless business logic (pure functions where possible)
  services/  — Shared infrastructure (cache, email, NLP)
  middleware/ — Express middleware (auth, admin, logger)
  scrapers/  — Legacy ingestion (one file per source)
  pipeline/  — Modular ingestion (sub-directory per source)
  workers/   — CLI entry points for batch operations

client/src/
  pages/     — Top-level route components
  components/ — Reusable UI components
  layout/   — App shell (sidebar, nav, drawer)
  context/  — React context providers
  hooks/    — Custom React hooks
```

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Route files | `kebab-case.js` | `jobAlerts.js`, `scraperRuns.js` |
| Model files | `PascalCase.js` | `Job.js`, `User.js` |
| Engine files | `camelCase.js` | `searchEngine.js`, `qualityScore.js` |
| React components | `PascalCase.jsx` | `Button.jsx`, `LoadingScreen.jsx` |
| React pages | `PascalCase.jsx` | `Dashboard.jsx`, `Login.jsx` |
| Context files | `PascalCase.jsx` | `AuthContext.jsx` |
| Hook files | `camelCase.js` | `useDebounce.js` |
| Service files | `camelCase.js` | `email.js`, `cache.js` |
| Environment variables | `UPPER_SNAKE_CASE` | `MONGO_URI`, `JWT_SECRET` |

## React Best Practices

- **Page components** — One file per page, keep under 300 lines
- **Shared components** — Place in `components/ui/`, one component per file
- **State management** — Use React Context for global state (auth, toast, drawer), local state for everything else
- **No prop drilling beyond 2 levels** — Use Context or component composition
- **Custom hooks** — Extract reusable logic into `hooks/`
- **API calls** — Always go through `api.js` modules, never raw axios
- **Animations** — Use Framer Motion with `AnimatePresence` for page transitions
- **Tailwind CSS** — Use custom theme classes (`card-premium`, `btn-primary`, `input-field`)

## Error Handling

- **Server routes** — All async handlers wrapped in try-catch, return 500 JSON
- **Services** — Throw errors for callers to handle (email, matching)
- **Scrapers** — Per-scraper try-catch, failures logged but don't block others
- **Workers** — Exit with code 1 on failure, log error
- **Frontend** — API interceptor removes token on 401, toast notifications for errors

## Security Rules

- **Never commit** `.env` files or secrets
- **Always validate** required env vars at startup (`JWT_SECRET`, `MONGO_URI`)
- **All POST/PUT/PATCH/DELETE** routes require authentication (except auth routes)
- **Admin-only** routes check `ADMIN_USER_ID`
- **Rate limit** all routes (global: 100/min)
- **Helmet** enabled on all responses

## Git Conventions

```
feat: Add email alert matching engine
fix: Prevent duplicate job alert creation
security: Add rate limiting to auth routes
docs: Update API route documentation
refactor: Extract matching logic to service
chore: Update dependencies
```

## PR Checklist

- [ ] No `.env` or secrets committed
- [ ] All new routes have auth middleware (if mutating)
- [ ] Rate limiting considered for new endpoints
- [ ] Error messages are user-friendly (no stack traces to client)
- [ ] Frontend API calls use the `api.js` modules
- [ ] Tests pass (`npm test`)
- [ ] Existing docs updated (ROUTES_DOC.md, FRONTEND_DOC.md, etc.)
