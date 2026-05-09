# Healthcare Ops Advisor

An internal analytics prototype for VPs of Operations, CFOs, and Department Directors at acute care health systems. The product surfaces six operational KPIs alongside an AI-prioritized **"Where to focus today"** panel so a leader can identify the most important issue, log an action, and follow it through to resolution — with no onboarding.

See [`healthcare-ops-advisor-prd.md`](./healthcare-ops-advisor-prd.md) for the full PRD.

---

## Flow

```
First visit
   │
   ▼
/role-select  ──►  /welcome  ──►  /  (Operations Dashboard)
                                       │
                          click signal │
                                       ▼
                            SignalDetailModal
                                       │
                          Log Action   │   updates signal status
                                       ▼
                              /recommendations  (Priority Tracker)
                                Active │ In progress │ Resolved
```

1. **Role selection** (`/role-select`) — Pick a role; Directors also pick a department. Persists to `localStorage` under `hoa.profile.v1`.
2. **Welcome** (`/welcome`) — Confirms identity and previews the user's top 3 KPI focus areas based on role.
3. **Operations Dashboard** (`/`) — Three-column layout:
   - **Left:** `KpiStack` — six metrics with status dots (green ≤10% deviation, yellow ≤20%, red >20%).
   - **Center:** `MetricDetailCard` — current vs. target, signed deviation, 30-day trend with target reference line, AI-flagged context.
   - **Right:** `PrioritySignalPanel` — dark-surface anchor card listing active + in-progress signals, sorted by priority. This is the visual anchor that tells a new user where to look first.
4. **Signal detail** — Any signal card opens `SignalDetailModal` (impact, recommended next action, signal history chain, full action log, **Log Action** dropdown).
5. **Priority Tracker** (`/recommendations`) — Tabbed view (Active / In progress / Resolved) with live counts. Status changes from the modal propagate instantly via the reactive store.

**Targets:** first-time user completes triage in under 30 seconds with no instruction; returning user in under 60 seconds.

---

## Project structure

Files are grouped by **feature**, not by type. Each feature folder has its own `data/`, `components/`, `hooks/`, and (where relevant) `server/` subfolders.

```
src/
├── features/
│   ├── profile/                  # Role, department, name, email
│   │   ├── data/user-profile.ts          # localStorage-backed profile + useUserProfile / useHydrated
│   │   ├── hooks/use-require-role.ts     # Gate hook → redirects to /role-select when no role
│   │   └── components/
│   │       ├── role-picker.tsx           # Reusable role + department selector
│   │       └── profile-modal.tsx         # Top-nav profile chip modal
│   │
│   ├── kpis/                     # The six operational KPIs
│   │   ├── data/kpi-catalog.ts           # Pure data + helpers (status, deviation, trend, formatters)
│   │   └── components/
│   │       ├── kpi-stack.tsx             # Left column of dashboard
│   │       ├── kpi-stack-skeleton.tsx    # Loading state
│   │       └── metric-detail-card.tsx    # Center column (Recharts trend)
│   │
│   ├── signals/                  # AI-flagged operational signals
│   │   ├── data/signals-store.ts         # Reactive store (useSyncExternalStore) + seed data
│   │   ├── server/recommendations.functions.ts  # createServerFn → Lovable AI Gateway, forced tool call
│   │   └── components/
│   │       ├── priority-signal-panel.tsx          # Right column ("Where to focus today")
│   │       ├── priority-signal-panel-skeleton.tsx
│   │       ├── signal-detail-modal.tsx            # Detail view + Log Action dropdown
│   │       └── priority-tracker-card.tsx          # Row card used in /recommendations tabs
│   │
│   └── dashboard/                # Cross-cutting page chrome
│       └── components/top-nav.tsx        # Title + Refresh insights + profile chip
│
├── components/
│   ├── app-sidebar.tsx           # App shell (rendered from __root.tsx)
│   └── ui/                       # shadcn/ui primitives (untouched)
│
├── routes/                       # TanStack Start file-based routes
│   ├── __root.tsx                # Shell + AppSidebar + Outlet
│   ├── index.tsx                 # OperationsDashboardPage  →  /
│   ├── welcome.tsx               # WelcomePage              →  /welcome
│   ├── role-select.tsx           # RoleSelectPage           →  /role-select
│   ├── recommendations.tsx       # PriorityTrackerPage      →  /recommendations
│   └── api/public/recommend.ts   # Public POST endpoint for external recommendation calls
│
├── integrations/supabase/        # Auto-generated Lovable Cloud client + types
├── lib/utils.ts                  # `cn` helper from shadcn
├── styles.css                    # Tailwind v4 entry + OKLCH design tokens
└── router.tsx                    # TanStack Router bootstrap
```

### Separation rules

- **`data/`** is pure: types, seed data, formatters, and store hooks. No JSX, no styling, no `lucide-react`.
- **`components/`** consumes `data/` and renders. No data mutations live here other than calling exported store actions (e.g. `logSignalAction`, `setProfile`).
- **`hooks/`** wraps reusable behaviour that crosses both (e.g. `useRequireRole` reads profile + navigates).
- **`server/`** holds `createServerFn` handlers that run on the edge. UI imports the exported function, never the underlying fetch.
- **Routes** are thin: they wire data + components together. Layout and styling live in components.

### Renames vs. the previous tree

| Old | New | Why |
|-----|-----|-----|
| `src/lib/kpi-catalog.ts` | `src/features/kpis/data/kpi-catalog.ts` | Co-locate KPI data with KPI components. |
| `src/lib/signals-data.ts` | `src/features/signals/data/signals-store.ts` | Name reflects the reactive store role. |
| `src/lib/user-profile.ts` | `src/features/profile/data/user-profile.ts` | Feature grouping. |
| `src/components/dashboard/ai-panel.tsx` | `src/features/signals/components/priority-signal-panel.tsx` | Matches PRD vocabulary ("AI recommendation panel" / "Where to focus today"). |
| `src/components/dashboard/metric-detail.tsx` | `src/features/kpis/components/metric-detail-card.tsx` | Card suffix clarifies it's a UI block, not a route. |
| `src/components/dashboard/panel-skeletons.tsx` | Split into `kpi-stack-skeleton.tsx` + `priority-signal-panel-skeleton.tsx` | One skeleton per panel, co-located with its component. |
| `src/components/signal-detail-modal.tsx` | `src/features/signals/components/signal-detail-modal.tsx` | Feature grouping. |
| `src/components/role-picker.tsx`, `profile-modal.tsx` | `src/features/profile/components/...` | Feature grouping. |
| `src/components/top-nav.tsx` | `src/features/dashboard/components/top-nav.tsx` | Cross-cutting page chrome lives in the `dashboard` feature. |
| `src/server/recommendations.functions.ts` | `src/features/signals/server/recommendations.functions.ts` | Co-locate server fn with the feature it serves. |
| `recommendations.tsx`'s inline `SignalCard` | `src/features/signals/components/priority-tracker-card.tsx` | Reusable; route file stays thin. |
| `Dashboard` (component) | `OperationsDashboardPage` | Matches PRD section 6.2 vocabulary. |
| `RecommendationsPage` (component) | `PriorityTrackerPage` | Matches PRD section 6.4 vocabulary. URL `/recommendations` kept for compatibility. |
| `AiPanel`, `MetricDetail` | `PrioritySignalPanel`, `MetricDetailCard` | Aligned with PRD names. |

---

## Stack & key decisions

- **Stack.** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, Recharts, Lovable Cloud, Lovable AI Gateway.
- **Reactive signal store.** `useSyncExternalStore`-backed `useSignals()` + `logSignalAction(id, status, entry)`. Status changes from the modal propagate instantly to the dashboard right panel and the Priority Tracker tabs/badges/counts — no refresh, no prop drilling.
- **Centralized KPI catalog.** Status thresholds are absolute deviation from target: ≤10% green, ≤20% yellow, >20% red. 30-day trends are deterministically seeded so the prototype is stable across reloads.
- **`useRequireRole` hook.** Single source of truth for the "no role → redirect" gate, returning `{ hydrated, profile }` so consumers don't re-call `useHydrated` / `useUserProfile`.
- **Profile in `localStorage`.** No server identity in this release; the action log credits the active profile on every entry.
- **Loading, empty, and error states are first-class.** Skeletons during refresh; tab-specific empty copy in the tracker; friendly fallback copy on AI gateway failure.
- **Brand palette.** Deep green (`#145338`) primary with soft sage neutrals via OKLCH tokens in `src/styles.css`. Google Sans Text + Google Sans typography.

---

## Run locally

```bash
bun install
bun dev
```

## Repo sync

This project is mirrored to GitHub through Lovable's two-way sync — commits made in Lovable appear on the connected repository automatically. See `CHANGELOG.md` for a running build log, `PROMPTS.md` for the three pivotal prompts (Expand / Behavior / Refine), and `healthcare-ops-advisor-prd.md` for the PRD.
