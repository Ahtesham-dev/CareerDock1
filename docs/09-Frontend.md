# Frontend

**Last Updated:** July 25, 2026
**Related Docs:** [Design System](./05-Design-System.md), [Mobile](./07-Mobile.md), [API](./11-API.md)

---

## Overview

The frontend is a React 18 SPA built with Create React App, using React Router for navigation, Framer Motion for animations, Recharts for charting, and Tailwind CSS for styling.

See [FRONTEND_DOC.md](../client/src/FRONTEND_DOC.md) for the complete detailed reference.

## Directory Structure

```
client/src/
├── api.js                # Axios instance + all API modules
├── App.jsx               # Root component with routing
├── index.js              # ReactDOM entry point
├── index.css             # Tailwind + custom CSS
├── context/
│   ├── AuthContext.jsx   # Auth state, login/register/guest/logout
│   ├── DrawerContext.jsx # Mobile drawer state
│   └── ToastContext.jsx  # Toast notifications
├── hooks/
│   └── useDebounce.js    # Debounced value (300ms default)
├── layout/
│   ├── Sidebar.jsx       # Desktop sidebar with source filter
│   ├── TopNav.jsx        # Top bar with profile dropdown
│   ├── MobileNav.jsx     # Bottom mobile nav (5 tabs)
│   ├── MobileDrawer.jsx  # Slide-in mobile drawer
│   └── PageTransition.jsx # Framer Motion page wrapper
├── components/
│   ├── BrandBar.jsx      # "Ahtesham × CareerDock" watermark
│   ├── BrandText.jsx     # Animated text components
│   ├── Logo.jsx          # SVG logo
│   ├── LoadingScreen.jsx # 13s animated boot sequence
│   ├── EmptyJobs.jsx     # Empty state with typewriter
│   ├── RightPanel.jsx    # Market insights panel
│   ├── FounderFooter.jsx # Landing page footer
│   ├── FounderSection.jsx # Landing founder section
│   ├── SourceFilterPanel.jsx # Shared source filter
│   ├── RequireAuth.jsx   # Guest mode route guard
│   └── ui/               # Shared UI primitives
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Select.jsx
│       ├── Modal.jsx
│       ├── Skeleton.jsx
│       ├── Spinner.jsx
│       └── Toggle.jsx
└── pages/
    ├── Landing.jsx                 # Public landing page
    ├── Login.jsx                   # Login form
    ├── Register.jsx                # Registration form
    ├── FounderStory.jsx            # "Crafted by Ahtesham" page
    ├── Dashboard.jsx               # Main job feed
    ├── MissionControlDashboard.jsx # Statistics dashboard
    ├── Search.jsx                  # Job search
    ├── SavedJobs.jsx               # Kanban board
    ├── Applications.jsx            # Application tracker
    ├── Insights.jsx                # Market insights
    ├── Alerts.jsx                  # Alert management
    └── Profile.jsx                 # User profile/settings
```

## Pages

See the [API Integration table in FRONTEND_DOC.md](../client/src/FRONTEND_DOC.md#4-api-integration-points) for which endpoints each page calls.

## State Management

| Context | State | Provided By |
|---------|-------|-------------|
| AuthContext | user, loading, guest, displayName | App.jsx root |
| DrawerContext | open, toggle, close | AppLayout |
| ToastContext | toast stack | App.jsx root |

## Auth Flow

- Token stored in `localStorage('token')`
- Guest mode stored in `localStorage('guest')`
- AuthContext validates token on mount via `/api/auth/me`
- API interceptor attaches `Bearer` token, removes token on 401
- Guest mode redirects from mutating routes via `<RequireAuth>`

## Routing

```
Public:  / → Landing
         /login → Login
         /register → Register
         /crafted-by-ahtesham → FounderStory

AppLayout (auth not required, but guest restricted):
         /dashboard → Dashboard
         /command-center → MissionControlDashboard
         /saved → SavedJobs (RequireAuth)
         /applications → Applications (RequireAuth)
         /insights → Insights
         /alerts → Alerts (RequireAuth)
         /search → Search
         /settings → Profile (RequireAuth)
```
