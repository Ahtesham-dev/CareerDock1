# Product Requirements Document

**Last Updated:** July 25, 2026
**Related Docs:** [Roadmap](./04-Roadmap.md), [Features](./06-Features.md)

---

## Mission

Democratize job search intelligence. Give every job seeker the same data advantage that recruiters have — aggregated listings, quality signals, market insights, and personalized matching — in one unified platform.

## Problem Statement

Job seekers face:
- **Fragmented sources** — Jobs spread across LinkedIn, Naukri, Wellfound, company career pages, and dozens of niche boards
- **No quality signal** — No way to distinguish real opportunities from ghost listings, expired posts, or low-effort postings
- **Manual tracking** — Spreadsheets and browser tabs to manage applications, no pipeline visibility
- **No market intelligence** — No insight into salary ranges, skill demand, hiring trends by location
- **Notification overload** — Keyword alerts that match everything or nothing

## Target Audience

- **Primary:** Tech professionals (0–15 years experience) in India actively job searching
- **Secondary:** Remote job seekers globally
- **Tertiary:** Students and freshers entering the job market

## Goals

1. Aggregate jobs from 14+ sources into a single searchable feed
2. Deduplicate and score listings for quality (0–100)
3. Provide personalized recommendations and email alerts
4. Track applications through a Kanban pipeline
5. Deliver market intelligence (salary, skill, hiring trends)

## Non-Goals

- Not a job board — we don't host job listings, we aggregate and link out
- Not a recruiter platform — no employer-side posting or applicant tracking
- Not a resume builder — ATS matching reads resumes but doesn't create them
- Not a social network — no messaging, endorsements, or follower features

## Core Features

| Feature | Description |
|---------|-------------|
| Job Aggregation | 14+ sources, deduplicated, normalized |
| Search & Filter | Full-text search, skills, type, experience, salary, source |
| Quality Scoring | 8-factor model → 0-100 score per job |
| Kanban Pipeline | Saved → Applied → Interview → Offer → Rejected |
| Email Alerts | Keyword/location/salary-based matching with daily digest |
| Market Intelligence | Salary trends, skill demand, location analysis, hiring activity |
| ATS Matching | Resume vs. job match scoring with skill gap analysis |
| Recommendations | Personalized job, skill, company, and career path suggestions |
| Guest Mode | Full browse without registration |

## Future Features

- Browser extension for one-click save
- AI resume analyzer with rewrite suggestions
- Company reputation scoring
- Mobile app (React Native)
- Interview preparation assistant
- Recruiter outreach tracker

## Success Metrics

| Metric | Target |
|--------|--------|
| Job sources connected | 14+ |
| Jobs in database | 10,000+ |
| User retention (30d) | >40% |
| Alert match precision | >80% relevant |
| Application tracking usage | >30% of active users |
| Platform uptime | >99.5% |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jun 25, 2026 | Landing page, auth, job feed, search |
| 1.1 | Jun 28, 2026 | Alerts, statistics, performance improvements |
| 1.2 | Jul 25, 2026 | Security hardening (helmet, rate limiting, auth), email propagation, guest protection |
