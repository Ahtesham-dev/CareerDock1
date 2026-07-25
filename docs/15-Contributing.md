# Contributing

**Last Updated:** July 25, 2026
**Related Docs:** [Development Rules](./03-Development-Rules.md), [Testing](./14-Testing.md)

---

## Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/CareerDock1.git
cd CareerDock1

# Install dependencies
npm install
cd client && npm install && cd ..

# Create environment file
cp .env.example .env
# Edit .env — set MONGO_URI to your local MongoDB instance

# Start development
npm run dev
```

## Branching

```
main          — Production-ready code
feat/*        — New features (feat/email-alerts)
fix/*         — Bug fixes (fix/duplicate-alerts)
security/*    — Security improvements (security/rate-limiting)
docs/*        — Documentation changes (docs/api-reference)
```

## Commit Messages

```
type: Short description (max 72 chars)

Longer description if needed. Explain what and why,
not how.
```

Types: `feat`, `fix`, `security`, `docs`, `refactor`, `test`, `chore`, `style`

## Pull Request Process

1. Create a branch from `main`
2. Make changes following [Development Rules](./03-Development-Rules.md)
3. Run `npm test` to verify tests pass
4. Update documentation if changing routes, models, or engines
5. Open a PR against `main`
6. PR title should match commit style: `type: description`

## Code Review Checklist

- [ ] No secrets or `.env` files committed
- [ ] New routes have auth middleware (if mutating)
- [ ] Error handling in all async handlers (try-catch)
- [ ] Rate limiting considered for new endpoints
- [ ] Documentation updated (ROUTES_DOC.md, model docs, etc.)
- [ ] Tests pass (`npm test`)

## Reporting Issues

Report bugs or suggest features via GitHub Issues. Include:
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable
- Environment (OS, Node version, browser)
