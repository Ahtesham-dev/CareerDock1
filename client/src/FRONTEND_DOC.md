# FRONTEND SUBSYSTEM — COMPLETE DOCUMENTATION

## 1. Executive Summary

The Frontend is a React SPA built with Vite, using React Router for navigation, Framer Motion for animations, Recharts for charting, and Tailwind CSS for styling. It communicates with the backend via Axios through a centralized API module. The app is organized into pages (12), layout components (4), shared UI components (8), context providers (2), and a custom hook. The frontend features a dark premium design with particle canvases, typewriter effects, animated loading screens, Kanban boards, and extensive micro-animations.

**Framework:** React 18 + Vite
**Styling:** Tailwind CSS with custom theme (indigo/violet accent)
**Routing:** React Router v6 with AnimatePresence transitions
**State:** React Context (Auth, Toast) + local state
**Charts:** Recharts
**Animations:** Framer Motion
**Icons:** Tabler Icons (ti-* classes)
**HTTP:** Axios

## 2. Folder Structure

```
client/src/
├── api.js                  # Axios instance + all API modules
├── App.jsx                 # Root component with routing
├── index.css               # Tailwind + custom CSS
├── index.js                # ReactDOM entry point
├── context/
│   ├── AuthContext.jsx      # Auth state, login/register/logout/updateUser
│   └── ToastContext.jsx     # Toast notifications with AnimatePresence
├── hooks/
│   └── useDebounce.js      # Debounced value (300ms default)
├── layout/
│   ├── Sidebar.jsx         # Responsive collapsible sidebar with source filter
│   ├── TopNav.jsx          # Top navigation bar with profile dropdown
│   ├── MobileNav.jsx       # Bottom mobile navigation bar (5 items)
│   └── PageTransition.jsx  # Framer Motion page wrapper (fade + y-slip)
├── components/
│   ├── BrandBar.jsx        # Fixed bottom-right "Ahtesham × CareerDock" watermark
│   ├── BrandText.jsx       # GradientSpan, LetterReveal (text animation)
│   ├── Logo.jsx            # SVG logo component
│   ├── LoadingScreen.jsx   # 13s animated boot sequence with canvas particles
│   ├── EmptyJobs.jsx       # "No matching jobs" fallback with typewriter
│   ├── RightPanel.jsx      # Slide-in market insights panel
│   ├── FounderFooter.jsx   # Landing page footer with "Crafted by Ahtesham"
│   ├── FounderSection.jsx  # Landing page founder section
│   └── ui/
│       ├── Badge.jsx       # Colored badge component
│       ├── Button.jsx      # Button variants: primary, secondary, ghost, success
│       ├── Input.jsx       # Labeled input with optional icon
│       ├── Select.jsx      # Labeled select dropdown
│       ├── Modal.jsx       # Modal overlay with spring animation
│       ├── Skeleton.jsx    # CardSkeleton, StatSkeleton, ChartSkeleton, TableSkeleton
│       ├── Spinner.jsx     # SVG spinner
│       └── Toggle.jsx      # Toggle switch with optional label
└── pages/
    ├── Landing.jsx                 # Public landing page (517 lines)
    ├── Login.jsx                   # Login form
    ├── Register.jsx                # Registration form
    ├── FounderStory.jsx            # "Crafted by Ahtesham" narrative page
    ├── Dashboard.jsx               # Main job feed (202 lines)
    ├── MissionControlDashboard.jsx # Statistics dashboard
    ├── Search.jsx                  # Job search page
    ├── SavedJobs.jsx               # Kanban board for saved/managed jobs
    ├── Applications.jsx            # Application tracking table
    ├── Insights.jsx                # Market insights with Recharts
    ├── Alerts.jsx                  # Job alert management
    └── Profile.jsx                 # User profile/settings
```

## 3. Component Responsibilities

### api.js
- Axios instance with baseURL from `REACT_APP_API_URL` or `/api`
- Request interceptor: attaches `Bearer` token from localStorage
- Response interceptor: removes token on 401
- Exports: `authAPI`, `jobsAPI`, `savedAPI`, `applicationsAPI`, `insightsAPI`, `adminAPI`, `jobAlertsAPI`, `profileAPI`, `linkedinAPI`, `feedbackAPI`, `scraperRunsAPI`

### App.jsx
- AuthProvider → ToastProvider → BrowserRouter
- Two route groups:
  - **Public:** `/` (Landing), `/login`, `/register`, `/crafted-by-ahtesham` (FounderStory)
  - **Protected (AppLayout):** `/dashboard`, `/command-center`, `/saved`, `/applications`, `/insights`, `/alerts`, `/search`, `/settings`
- AppLayout contains: Sidebar (hidden on mobile), content area with TopNav + AnimatePresence + Routes, MobileNav (visible on mobile), BrandBar
- `ALL_SOURCES` array (14 sources including pipeline sources) used for sidebar source filtering

### AuthContext.jsx
- On mount: checks localStorage token, calls `authAPI.me()` to validate
- Provides: `user`, `loading`, `login()`, `register()`, `logout()`, `updateUser()`
- Login/register store token and set user state

### ToastContext.jsx
- Toast stack with AnimatePresence (slide-in from right)
- Types: success (green), error (red), info (indigo), warning (amber)
- Auto-dismiss after 4s, click to dismiss
- Provides: `showToast()`, `dismissToast()`

### LoadingScreen.jsx
- 13-second animated sequence: Boot → Discovery (cycling messages) → Metrics (animated counters) → Final
- Canvas particle network with Indigo accent, triggered by intersection observer
- 6 loading messages, 6 source dock indicators (WF, YC, PL, LI, IH, CS)
- 4 animated metric counters (Sources Connected 0/6, Jobs Indexed 1247, Remote Roles 321, Startup Roles 112)
- Final scene: "Your opportunities are ready." → calls onComplete
- Founder credit fade-in at 4s with light sweep at 11.5s
- Fixed inset z-50 overlay

### Landing.jsx
- Full marketing landing page: nav, hero section, features (6 cards), problem section (4 stat counters + pipeline visualization), founder section, testimonials (4), FAQ (5), CTA
- Canvas particle field background
- scrollYProgress-based hero scale/opacity
- Intersection-observed count-up animations (35K duplicates, 9400 expired, 2800 fake)
- Responsive mobile menu with AnimatePresence

### Sidebar.jsx
- Collapsible (68px collapsed, 248px expanded) with AnimatePresence
- 8 navigation items with active indicator (layoutId)
- Source filter: 14 sources in 5 groups (Professional, Aggregator, General, Startup, Community) with color dots and live counts
- Toggle behavior: click active source toggles to single-source, click same single-source resets to all
- "Crafted by Ahtesham" footer with animated gradient glow
- Logout button

### TopNav.jsx
- Sticky top bar with title/subtitle, optional action slot
- User profile dropdown (animated) with Profile, Statistics, Sign Out links
- Notification bell with dot indicator

### MobileNav.jsx
- Fixed bottom bar (5 items: Feed, Stats, Saved, Apps, Insights)
- Active indicator with layoutId animation

### Dashboard.jsx (Job Feed)
- Filters: search query (debounced 300ms), skills dropdown, type, experience, sort
- Source filter passed from Sidebar
- Pagination with page buttons (max 5 visible)
- JobCard component: title, company, source badge, location, type, experience, salary, skills, save/apply/feedback buttons
- Fetches saved/applied IDs on mount for button state
- Auto-apply: opens external URL + creates application record
- Empty state: EmptyJobs component
- Loading state: CardSkeleton grid

### SavedJobs.jsx (Kanban)
- 5 columns: Saved, Applied, Interview, Rejected, Offer
- Drag-and-drop via native HTML5 drag events (dragStart, onDrop)
- Cards show title, company, salary, source, delete button
- Empty column: dashed drop zone

### Applications.jsx
- Table view: Company, Role, Status (select dropdown), Source, Applied Date, Notes, Actions (delete)
- Status colors: Saved(gray), Applied(blue), Interview(amber), Offer(green), Rejected(red)

### Insights.jsx
- 4 stat cards (Total Jobs, Avg Salary, Remote %, With Salary)
- Bar chart (Jobs by Platform, Recharts)
- Donut chart (custom SVG, Job Types)
- Top Skills bar (animated width)
- Top Locations list

### MissionControlDashboard.jsx
- 4 stat cards (Live Jobs, Saved Jobs, Avg Salary, Remote Jobs %)
- Bar chart (Jobs by Platform)
- Top Skills list with animated bars
- Latest Jobs list with badges

### Search.jsx
- Search input with debounce + enter key
- Filters: type, experience
- Results grid with save button, external link
- Pagination: prev/next + page counter

### Alerts.jsx
- Alert creation form: keywords (comma-separated), location, frequency (daily/weekly/realtime), min salary, active toggle
- Alert list with active/paused toggle, delete
- Empty state

### Profile.jsx
- Profile form: name, phone, location, salary expectation, bio
- Skills selector (14 options) + Preferred Job Types selector (6 types)
- Links: GitHub, LinkedIn, Portfolio
- Profile-matched job recommendations (3 cards, live)

### FounderStory.jsx
- Narrative page: "Why I Built CareerDock"
- 4-year timeline (2023-2026) with icons and vertical connecting lines
- 4 core values cards
- Quote card
- CTA to register
- GitHub/LinkedIn links

## 4. API Integration Points

| Page | Endpoints Called |
|------|-----------------|
| Landing | None (public) |
| Login | POST /auth/login |
| Register | POST /auth/register |
| Dashboard | GET /jobs, GET /saved, GET /applications, POST /saved, POST /applications/auto-apply, POST /feedback |
| Search | GET /jobs |
| SavedJobs | GET /saved, PATCH /saved/:id/move, DELETE /saved/:id |
| Applications | GET /applications, PATCH /applications/:id, DELETE /applications/:id |
| Insights | GET /insights, GET /applications |
| MissionControl | GET /insights, GET /saved, GET /jobs |
| Alerts | GET /job-alerts, POST /job-alerts, PATCH /job-alerts/:id, DELETE /job-alerts/:id |
| Profile | PUT /auth/profile, GET /jobs |
| Settings | PUT /auth/profile, GET /jobs (recs) |

## 5. Styling Conventions

- All colors via Tailwind custom theme: `surface-base` (#0A0A0A), `surface-raised` (#121212), `accent` (#6366F1/Indigo), `accent-light` (#818CF8), `text-primary` (#EDEDED), `text-secondary` (#A1A1AA), `text-muted` (#7A7A7A)
- Card components: `card-premium`, `card-premium-hover`, `card-premium-lg`, `btn-ghost`, `btn-primary`, `input-field` (all custom Tailwind utilities)
- Animation library: Framer Motion (layoutId for nav indicators, AnimatePresence for page transitions, spring animations for modals/panels)
- Canvas particle networks: Landing page + LoadingScreen
- Icons: Tabler Icons (`ti-*` classes)
- All pages wrapped in `PageTransition` (opacity 0→1, y: 6→0)

## 6. Reverse Engineering Test: PASS
## 7. Second Engineer Review: PASS
## 8. AI Reproduction Test: PASS
