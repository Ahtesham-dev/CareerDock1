# Design System

**Last Updated:** July 25, 2026
**Related Docs:** [Frontend](./09-Frontend.md)

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `surface-base` | `#0A0A0A` | Page background |
| `surface-raised` | `#121212` | Card/section background |
| `surface-card` | `#1A1A1A` | Card background |
| `accent` | `#6366F1` (Indigo-500) | Primary buttons, links, active states |
| `accent-light` | `#818CF8` (Indigo-400) | Hover states, accents |
| `accent-dark` | `#4F46E5` (Indigo-600) | Active/pressed states |
| `text-primary` | `#EDEDED` | Primary text |
| `text-secondary` | `#A1A1AA` (Zinc-400) | Secondary text |
| `text-muted` | `#7A7A7A` | Muted text, placeholders |
| `success` | `#22C55E` (Green-500) | Success states |
| `error` | `#EF4444` (Red-500) | Error states |
| `warning` | `#F59E0B` (Amber-500) | Warning states |

## Typography

| Element | Class | Size | Weight |
|---------|-------|------|--------|
| Page title | `text-2xl font-bold` | 24px | 700 |
| Section title | `text-xl font-semibold` | 20px | 600 |
| Card title | `text-base font-medium` | 16px | 500 |
| Body | `text-sm` | 14px | 400 |
| Small | `text-xs` | 12px | 400 |
| Badge | `text-xs font-medium` | 12px | 500 |

**Font Family:** `Inter, system-ui, -apple-system, sans-serif`

## Spacing Scale

Uses Tailwind defaults: `4`, `6`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`

| Token | Value | Usage |
|-------|-------|-------|
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Section padding |
| `gap-3` | 12px | Card grid gap |
| `gap-4` | 16px | Section gap |
| `space-y-4` | 16px | Vertical stack gap |

## Components

### Button

| Variant | Classes | Usage |
|---------|---------|-------|
| Primary | `btn-primary` | Main CTA (indigo bg) |
| Secondary | `btn-secondary` | Secondary actions (outlined) |
| Ghost | `btn-ghost` | Tertiary actions (transparent) |
| Success | `bg-green-600` | Confirm/success actions |
| Danger | `bg-red-600` | Destructive actions |

### Card

| Variant | Classes | Usage |
|---------|---------|-------|
| Default | `card-premium` | Job cards, stat cards |
| Hover | `card-premium-hover` | Interactive cards |
| Large | `card-premium-lg` | Feature cards (landing) |

### Form Elements

| Element | Class | Notes |
|---------|-------|-------|
| Input | `input-field` | Labeled with optional icon |
| Select | Standard Tailwind | Labeled dropdown |
| Toggle | Custom `Toggle` component | With optional label |
| Badge | `Badge` component | Colored by variant |

## Animations

| Animation | Library | Usage |
|-----------|---------|-------|
| Page transitions | Framer Motion `AnimatePresence` | Fade + y-slip (6px) |
| Sidebar collapse | Framer Motion `layout` | Width animation |
| Mobile drawer | Framer Motion spring | Slide from left |
| Modal | Framer Motion spring | Scale + fade overlay |
| Stats counter | Intersection Observer | Count-up on scroll |
| Loading screen | Canvas particles | 13s boot sequence |
| Toast notifications | Framer Motion | Slide-in from right |

## Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | 640px | Minor layout adjustments |
| `md` | 768px | Tablet layout |
| `lg` | 1024px | Desktop layout (sidebar visible) |
| `xl` | 1280px | Wide desktop |

## Mobile-Specific

- **Bottom nav** (`MobileNav.jsx`) — 5 tabs, always visible on mobile
- **Hamburger** — Opens drawer (left panel with source filters)
- **Sidebar** — Hidden on mobile (`lg:hidden`)
- **Cards** — Full width on mobile, grid on desktop
