# Deployment

**Last Updated:** July 25, 2026
**Related Docs:** [Backend](./08-Backend.md), [Environment Variables](../.env.example)

---

## Local Development

```bash
# Terminal 1 — Server
npm run server        # nodemon on port 5000

# Terminal 2 — Client
cd client && npm start  # CRA on port 3000, proxies to :5000

# Or both at once
npm run dev
```

## Environment Variables

Minimum required: `MONGO_URI`, `JWT_SECRET`

See [`.env.example`](../.env.example) for all variables.

## Production — Railway

The server deploys on Railway via `railway.json` or Dockerfile.

**Dockerfile:** `node:20-alpine`, port 3001, Puppeteer not bundled.

**Puppeteer/Chrome:** Peerlist and Naukri scrapers require Chromium. In Docker:
```dockerfile
RUN apk add --no-cache chromium
ENV CHROME_PATH=/usr/bin/chromium-browser
```
Without Chrome, these sources return 0 jobs.

## Production — Vercel

Frontend deploys to Vercel:
- `career-dock1.vercel.app`
- `API` proxy points to Railway backend

## Docker

```bash
docker build -t careerdock .
docker run -p 3001:3001 \
  -e MONGO_URI=mongodb://... \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  careerdock
```

## CI/CD

No CI/CD pipeline configured yet. Deploy via `git push` to Railway-connected branch.

## Health Checks

```
GET /api/health → { status: 'ok', uptime, timestamp }
GET /api/pipeline/stats → pipeline statistics + source health
```
