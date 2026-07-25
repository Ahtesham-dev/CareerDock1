# CareerDock — Job Intelligence Platform

**Smart job search tracking, aggregation, and AI-powered matching.**

CareerDock aggregates jobs from 14+ sources (LinkedIn, Naukri, JSearch, YCombinator, Cutshort, Instahyre, and more), deduplicates them, scores them for quality, and delivers personalized recommendations and email alerts.

> **Live:** [career-dock1.vercel.app](https://career-dock1.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Scraping | Axios, Cheerio, Puppeteer |
| NLP | Natural, @xenova/transformers |
| Caching | Redis (optional, in-memory fallback) |
| Scheduling | node-cron |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Ahtesham-dev/CareerDock1.git
cd CareerDock1

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET at minimum

# 4. Start (server + client concurrently)
npm run dev
```

- Server: `http://localhost:5000`
- Client: `http://localhost:3000`

## Folder Structure

```
CareerDock1/
├── client/                  # React SPA
│   └── src/
│       ├── api.js           # Axios instance + API modules
│       ├── App.jsx          # Root component + routing
│       ├── context/         # Auth, Toast, Drawer contexts
│       ├── hooks/           # useDebounce
│       ├── layout/          # Sidebar, TopNav, MobileNav, MobileDrawer
│       ├── components/      # Shared UI (Badge, Button, Modal, etc.)
│       └── pages/           # 12 page components
├── server/                  # Express backend
│   ├── index.js             # Server entry + middleware setup
│   ├── routes/              # 15 Express routers
│   ├── models/              # 12 Mongoose models
│   ├── middleware/          # Auth, admin, logger
│   ├── engine/              # 7 stateless engines (search, ranking, etc.)
│   ├── services/            # Cache, email, matching, embeddings
│   ├── scrapers/            # 9 legacy scrapers
│   ├── pipeline/            # Modular ingestion pipeline (5 sources)
│   ├── workers/             # Batch workers (dedup, quality, recs)
│   └── scheduler.js         # Legacy cron scheduler
├── docs/                    # Documentation
└── Dockerfile               # Docker deployment
```

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `ADMIN_USER_ID` | No | — | Admin user ID for protected routes |
| `SMTP_USER` | No | — | Email sending (alerts) |
| `SMTP_PASS` | No | — | Email password |
| `CLIENT_URL` | No | `http://localhost:3000` | CORS origin |
| `NODE_ENV` | No | `development` | Logger behavior |

See [`.env.example`](../.env.example) for the full list.

## Deployment

- **Railway** — `railway.json` + Dockerfile auto-deploy
- **Vercel** — Frontend at `career-dock1.vercel.app`, backend on Railway
- **Docker** — `docker build -t careerdock . && docker run -p 3001:3001 careerdock`

See [Deployment](./13-Deployment.md) for details.

## Documentation

| Doc | Purpose |
|-----|---------|
| [PRD](./01-PRD.md) | Product requirements, mission, goals |
| [Architecture](./02-Architecture.md) | System architecture, data flow |
| [Development Rules](./03-Development-Rules.md) | Coding standards, conventions |
| [Roadmap](./04-Roadmap.md) | Milestones and future plans |
| [Design System](./05-Design-System.md) | Colors, typography, components |
| [Features](./06-Features.md) | Feature descriptions |
| [Mobile](./07-Mobile.md) | Mobile-specific behavior |
| [Backend](./08-Backend.md) | Backend structure and routes |
| [Frontend](./09-Frontend.md) | Frontend structure and pages |
| [Database](./10-Database.md) | All collections and schemas |
| [API](./11-API.md) | Full API reference |
| [Scrapers](./12-Scrapers.md) | Scraper/pipeline architecture |
| [Deployment](./13-Deployment.md) | Deploy instructions |
| [Testing](./14-Testing.md) | Test commands and coverage |
| [Contributing](./15-Contributing.md) | How to contribute |
| [Changelog](./16-Changelog.md) | Version history |
| [Memory](./17-Memory.md) | AI assistant session context |
| [TODO](./18-TODO.md) | Backlog and priorities |
