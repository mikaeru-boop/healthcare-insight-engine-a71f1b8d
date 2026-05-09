# Engineering Handoff — Healthcare Ops Advisor

This document hands the prototype off to the engineering team taking it from "internal demo" to "multi-user product." Pair this with [`README.md`](./README.md) (architecture + flow) and [`healthcare-ops-advisor-prd.md`](./healthcare-ops-advisor-prd.md) (product requirements).

---

## 1. What you are inheriting

A working prototype of the Healthcare Ops Advisor for VPs of Operations, CFOs, and Department Directors at acute-care health systems. It surfaces six operational KPIs and an AI-prioritized **"Where to focus today"** panel, lets the user log an action against a signal, and tracks status (Active → In progress → Resolved) in a Priority Tracker.

**Status:** functionally complete prototype, single-user, no real auth. Wired end-to-end to Lovable Cloud.

### Stack

| Layer | Choice |
|---|---|
| Framework | TanStack Start v1 (React 19, Vite 7) — file-based routing in `src/routes/` |
| Styling | Tailwind v4 + shadcn/ui, OKLCH design tokens in `src/styles.css` |
| Charts | Recharts |
| Backend | Lovable Cloud (managed Supabase: Postgres + Auth + Edge) |
| Data fetching | TanStack Query (`QueryClientProvider` in `src/routes/__root.tsx`) |
| AI | Lovable AI Gateway via `createServerFn` (`src/features/signals/server/recommendations.functions.ts`) |
| Hosting | Cloudflare Worker (edge SSR) — note Worker runtime constraints in `Notes` below |

### Repo conventions

- Files grouped **by feature**, not by type (`src/features/{profile,kpis,signals,dashboard}/{data,components,hooks,server}`).
- `data/` is pure (types, hooks, formatters — no JSX). `components/` consume `data/`. Routes are thin wrappers.
- Auto-generated files — **never edit by hand**: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `src/routeTree.gen.ts`, `.env`.

---

## 2. What's already built

### Frontend
- `/role-select`, `/welcome`, `/` (Operations Dashboard), `/recommendations` (Priority Tracker).
- `KpiStack`, `MetricDetailCard`, `PrioritySignalPanel`, `SignalDetailModal`, `PriorityTrackerCard`.
- Loading skeletons, empty states, AI-failure fallback copy.
- Profile chip + modal in top nav.

### Backend (Lovable Cloud)
Migration: [`supabase/migrations/20260509183109_*.sql`](./supabase/migrations).

| Table | Purpose | RLS today |
|---|---|---|
| `kpis` | Six KPIs (slug, label, current/target, unit, category, icon) | public read |
| `signals` | AI-flagged signals (priority, status, metric_slug, impact, next_action) | public read + update |
| `signal_history` | Past instances per signal | public read |
| `signal_action_log` | Append-only audit trail (timestamp, actor, role, action) | public read + insert |

Seeded with 5 KPIs, 5 signals, 9 history entries, 13 action log entries. Frontend reads via `useKpis()` and `useSignals()`; status changes go through `useLogSignalAction()` (multi-table mutation).

### Server functions
- `src/features/signals/server/recommendations.functions.ts` — `createServerFn` calling Lovable AI Gateway with a forced tool call. Public POST endpoint mirror at `src/routes/api/public/recommend.ts`.

---

## 3. What is intentionally NOT built

These are scoped out of the prototype and are your first sprint:

1. **Real authentication.** Profile lives in `localStorage` under `hoa.profile.v1`. There is no `auth.users` integration yet.
2. **Role enforcement.** Roles are picked at `/role-select` and trusted from the client. No RLS gates by role.
3. **Per-user data.** `signal_action_log.actor` is a free-text string ("VP Operations" etc.), not a FK to a user.
4. **Realtime.** Status changes are reactive within a single session only. Other open dashboards do not update.
5. **Audit / admin views.** No `/audit` route, no admin role.
6. **Production hardening.** No rate limiting, no monitoring hooks, no error reporting beyond console.

Two Supabase linter warnings (no auth, public RLS on writes) are **expected** and reflect the above — close them as part of the auth milestone.

---

## 4. Recommended next milestones

See README "Next steps" for the user-facing version. Engineering breakdown:

### Milestone 1 — Auth + RBAC (blocking everything else)

- Enable Email + Google sign-in via Lovable Cloud (managed OAuth, no client ID setup).
- Add `/login`, `/signup`, `/reset-password` routes (public). The reset-password page MUST exist and call `supabase.auth.updateUser({ password })` — without it users get auto-logged-in without resetting.
- Set up `supabase.auth.onAuthStateChange` BEFORE `getSession()` in the root, expose user via TanStack Router context.
- Create `_authenticated` pathless layout route with `beforeLoad` redirect-to-login. Move `/`, `/welcome`, `/role-select`, `/recommendations` under it. Delete `useRequireRole`.
- **Roles MUST live in their own table.** Never on `profiles`. This is a security hard requirement (privilege-escalation prevention).
  - `app_role` enum: `'vp_operations' | 'cfo' | 'department_director'`.
  - `user_roles (user_id, role)` table, RLS-enabled.
  - `has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function — use inside every role-gated RLS policy to avoid recursive RLS on `user_roles`.
- `profiles` table FK to `auth.users(id) ON DELETE CASCADE`. Trigger to auto-create on signup. RLS: user reads/updates only their own row.
- `/role-select` writes to `user_roles` + `profiles`, not localStorage.

### Milestone 2 — Multi-user signals

- `signal_action_log.actor uuid` → FK to `auth.users.id`. Derive `role` server-side from `user_roles` (do not trust client).
- Tighten `signals` RLS: read/update gated by `has_role(auth.uid(), ...)` and (for directors) matching `department`.
- Enable Realtime on `signals` + `signal_action_log`:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_action_log;
  ```
  Subscribe in `useSignals()` and invalidate the query on change.
- Add `signals.assigned_to uuid` (nullable FK) + "Assign to me / Reassign" action in `SignalDetailModal`.

### Milestone 3 — Audit, personalization, polish

- `/audit` route, gated by `has_role(uid, 'vp_operations')`. Lists every action across all signals.
- Pass `{ role, department }` into the `recommendations` server fn so AI prompts are tailored.
- Optional: email/in-app notifications on new high-priority signals for the user's department.

---

## 5. Notes, gotchas, and conventions

**TanStack Start specifics**
- Loaders are isomorphic — never hit Supabase admin client from a loader. Use `createServerFn` + `requireSupabaseAuth` middleware.
- A `loader` calling an auth-protected server fn must be gated by `beforeLoad` that awaits `supabase.auth.getUser()`, otherwise the first request fires before the session hydrates and 401s. The `_authenticated` layout pattern handles this in one place.
- Server functions live in `*.functions.ts` files in client-safe paths (`src/features/*/server/`, `src/lib/`). Never under `src/server/`.

**Worker runtime (Cloudflare)**
- Available in server fns: `fs`, `path`, `crypto`, `Buffer`, `stream`, `http`, `https`, `zlib`.
- NOT available: `child_process`, `sharp`, `canvas`, `puppeteer`, file watching, native addons. Avoid Node-only npm packages.
- All deps must be bundled at build time. Do NOT set `ssr.external` in `vite.config.ts`.

**Database**
- Use the migration tool for ALL schema changes. Never edit `src/integrations/supabase/types.ts`.
- Use **validation triggers**, not `CHECK` constraints, for time-based validations (CHECK constraints must be immutable).
- Never touch reserved schemas: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.
- Default Supabase row limit is 1000 — paginate when this matters.

**Design system**
- Always use semantic tokens from `src/styles.css` (`bg-primary`, `text-foreground`, etc.). Never hardcode colors in components.
- Brand: deep green `#145338` primary, soft sage neutrals, Google Sans Text + Google Sans.

**Status thresholds (KPI catalog)**
- Green ≤10% absolute deviation from target, yellow ≤20%, red >20%. Centralized in `src/features/kpis/data/kpi-catalog.ts`.

---

## 6. Local dev

```bash
bun install
bun dev
```

`.env` is auto-managed by Lovable Cloud and contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. Do not edit by hand.

---

## 7. Where things live (quick map)

```
src/features/profile/    → role/dept/name (currently localStorage)
src/features/kpis/       → KPI catalog, KpiStack, MetricDetailCard
src/features/signals/    → signals store, PrioritySignalPanel, SignalDetailModal,
                           PriorityTrackerCard, recommendations.functions.ts
src/features/dashboard/  → top nav (cross-cutting page chrome)
src/routes/              → file-based routes (do not create src/pages/)
src/integrations/supabase/ → auto-generated, do not edit
supabase/migrations/     → schema source of truth
```

---

## 8. Contacts & references

- PRD: [`healthcare-ops-advisor-prd.md`](./healthcare-ops-advisor-prd.md)
- Architecture + flow: [`README.md`](./README.md)
- Build log: [`CHANGELOG.md`](./CHANGELOG.md)
- Pivotal prompts (Expand / Behavior / Refine): [`PROMPTS.md`](./PROMPTS.md)

Open questions or scope clarifications go to the product owner before changing PRD vocabulary (e.g. "Priority Tracker", "Where to focus today", "Operations Dashboard" — these names are load-bearing in user research).
