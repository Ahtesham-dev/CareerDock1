# Mobile

**Last Updated:** July 25, 2026
**Related Docs:** [Frontend](./09-Frontend.md), [Design System](./05-Design-System.md)

---

## Overview

CareerDock is a **mobile-first web application**. The frontend is fully responsive with dedicated mobile navigation, drawer, and layouts. There is no native mobile app yet (planned for Phase 5).

## Mobile Layout

```
┌─────────────────────┐
│      TopNav         │  ← Sticky header with hamburger
├─────────────────────┤
│                     │
│   Content Area      │  ← AnimatePresence page transitions
│   (scrollable)      │
│                     │
├─────────────────────┤
│ Feed │ Stats │ ...  │  ← Bottom Nav (fixed, 5 tabs)
└─────────────────────┘
```

## Mobile Components

| Component | File | Behavior |
|-----------|------|----------|
| TopNav | `layout/TopNav.jsx` | Hamburger button visible on mobile (`lg:hidden`) |
| MobileNav | `layout/MobileNav.jsx` | Fixed bottom bar, 5 items with active indicator animation |
| MobileDrawer | `layout/MobileDrawer.jsx` | Slide-in from left (270px), backdrop blur, swipe-to-close via Framer Motion drag |
| PageTransition | `layout/PageTransition.jsx` | Fade + y-slip animation on every route change |

## Drawer

The MobileDrawer contains:
- CareerDock logo + brand name
- Source filter panel (14 sources in 5 groups with color dots)
- "Logged in as: \<username\>" display
- Logout button

**Interactions:**
- Opens via hamburger button or swipe from left edge
- Closes: backdrop tap, swipe right (80px threshold / 200px/s velocity), Escape key
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation menu"`

## Bottom Navigation

5 fixed tabs at screen bottom:
1. Feed (`/dashboard`)
2. Stats (`/command-center`)
3. Saved (`/saved`)
4. Apps (`/applications`)
5. Insights (`/insights`)

Active indicator uses Framer Motion `layoutId` animation.

## Responsive Behavior

| Viewport | Sidebar | TopNav | Bottom Nav | Drawer |
|----------|---------|--------|------------|--------|
| < 1024px | Hidden | Hamburger visible | Visible | Available |
| >= 1024px | Visible | No hamburger | Hidden (pb-0) | Available |

## Guest Mode on Mobile

Guests can browse all read-only pages. Mutating routes (/saved, /applications, /alerts, /settings) redirect to /dashboard via the RequireAuth component.
