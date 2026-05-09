# Healthcare Ops Advisor

An internal analytics prototype for VPs of Operations, CFOs, and department directors at acute care health systems. The product surfaces six operational KPIs alongside an AI-prioritized "where to focus today" panel so a new user can identify the most important issue, log an action, and follow it through to resolution without onboarding.

## Hypothesis

The core analytics suite has a 60% first-visit bounce rate. The data is accurate, but new users see a wall of metrics and leave; only power users extract value. We believe the bounce is a *prioritization* problem, not a data problem.

> If we pair a scannable KPI stack with a single, prioritized AI signal that names the metric, the impact, and the next action — and we let the user log that action and watch it persist across the app — then a first-time user can read the top signal, click into the related metric, and decide what to do in under 30 seconds, with no instruction.

## Scenario

Monday, 8:04 AM. A VP of Operations opens the dashboard with coffee in hand. She doesn't read every tile. She glances at the dark right-hand panel, sees that *Discharge Before Noon* is 43.6% below target and has been for 30 consecutive days, clicks the card, reviews the full signal history chain in the detail modal, and selects **Mark as In Progress** from the Log Action dropdown. The signal moves from Active to In Progress in the Priority Tracker, the action log captures her name, role, and timestamp, and she forwards the link to the throughput director before her 8:15 standup.

## Key screens

1. **`/role-select` — Role selection.** First-time picker (VP of Operations, CFO, Department Director) with a conditional department dropdown for Directors. Stored in `localStorage`.
2. **`/welcome` — Role confirmation & focus preview.** Confirms the chosen role and previews the top 3 KPI focus areas before routing to the dashboard.
3. **`/` — Dashboard.** Three-column layout:
   - **Left:** KPI stack (6 metrics, status color, value vs. target, large-type values for scannability).
   - **Center:** Metric detail — 30-day trend vs. target, deviation, AI-flagged context line.
   - **Right:** AI recommendation panel on a dark background — the visual anchor — with prioritized signal cards (Signal headline → Impact → Next Action divider). Loading skeletons + an error fallback ("Signals unavailable. Showing last known priorities.") cover failure modes.
   - **Top nav:** Profile & settings modal showing the current role with an edit option that re-opens the role-select UI.
4. **Signal detail modal.** Triggered by clicking any signal card. Shows the full signal history chain, prior instances, action log with timestamps and role attribution, and a **Log Action** dropdown (Active / In Progress / Resolved).
5. **`/recommendations` — Priority Tracker.** Tabbed view (Active / In Progress / Resolved) with status badges, action timestamps, and outcome strings. Tab counts and empty states update live as signals are actioned.

## User flow

1. First visit → `/role-select` → choose role (and department if Director).
2. `/welcome` → confirm role + preview top 3 KPI focuses → continue.
3. Dashboard → scan the six KPI tiles → read the top priority signal in the dark right panel.
4. Click a signal card → review history chain + impact + recommended action in the detail modal.
5. Select **Log Action** → status updates live across the dashboard and Priority Tracker; entry written to the action log with name, role, and timestamp.
6. Open `/recommendations` to track active, in-progress, and resolved signals through to closure.

Target: a returning user can land, triage, and log an action in under 60 seconds; a first-time user can complete steps 1–4 in under 30 seconds with no onboarding.

## Main build decisions

- **Stack.** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, Recharts, Lovable Cloud backend, Lovable AI Gateway for the recommendations server function.
- **Three-column hierarchy.** The dark right panel is intentional — it creates the visual anchor that tells a new user *where to look first*. Light center/left allows data density without competing for attention.
- **Centralized KPI catalog** in `src/lib/kpi-catalog.ts`. Status thresholds based on absolute deviation from target: ≤10% green, ≤20% yellow, >20% red. Trends are deterministically seeded so the prototype is stable across reloads.
- **Reactive signal store.** `src/lib/signals-data.ts` exposes a `useSyncExternalStore`-backed `useSignals()` hook plus `logSignalAction(id, status, entry)`. Status changes from the modal propagate instantly to the dashboard's right panel and the Priority Tracker tabs/badges/counts — no refresh, no prop drilling.
- **Profile persistence.** `src/lib/user-profile.ts` stores role, department, name, and email in `localStorage`. Users without a saved role are auto-routed to `/role-select`. The action log credits the active profile on every entry.
- **AI signals** are produced by the `getRecommendations` server function (`src/server/recommendations.functions.ts`) via Lovable AI Gateway. Static demo copy is used as a fallback so stakeholders always see a realistic, specific output rather than a loading state.
- **Loading, empty, and error states** are first-class: skeleton tiles in the KPI stack on role switch, skeleton signal cards in the AI panel during refresh, an error banner in the AI panel on failure, and tab-specific empty-state copy in the Priority Tracker (e.g. *"No signals actioned yet. When you escalate or note a signal, it will appear here."*).
- **Signal card typography hierarchy.** Three clear tiers — 13px semibold signal headline, 11px secondary impact, and a divider-separated *Next action* directive with an uppercase label — instead of three same-weight paragraphs.
- **Real specificity over placeholder copy.** Cards reference actual operational levers (Discharge Before Noon, Cost per Case, OR Throughput) instead of generic stand-ins.
- **Brand palette.** Deep green (`#145338`) primary with soft sage neutrals, rendered through OKLCH tokens in `src/styles.css`. Google Sans Text + Google Sans typography.

## Run locally

```bash
bun install
bun dev
```

## Repo sync

This project is mirrored to GitHub through Lovable's two-way sync — commits made in Lovable appear on the connected repository automatically. See `CHANGELOG.md` for a running build log and `PROMPTS.md` for the three pivotal prompts (Expand / Behavior / Refine) that shaped the prototype.
