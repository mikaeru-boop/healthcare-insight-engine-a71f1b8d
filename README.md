# Healthcare Ops Advisor

An internal analytics prototype for VPs of Operations, CFOs, and department directors at acute care health systems. The product surfaces six operational KPIs alongside an AI-prioritized "where to focus today" panel so a new user can identify the most important issue and take action without onboarding.

## Hypothesis

The core analytics suite has a 60% first-visit bounce rate. The data is accurate, but new users see a wall of metrics and leave; only power users extract value. We believe the bounce is a *prioritization* problem, not a data problem.

> If we pair a scannable KPI stack with a single, prioritized AI signal that names the metric, the impact, and the next action, then a first-time user can read the top signal, click into the related metric, and decide what to do — in under 30 seconds, with no instruction.

## Scenario

Monday, 8:04 AM. A VP of Operations opens the dashboard with coffee in hand. She doesn't read every tile. She glances at the dark right-hand panel, sees that *Discharge Before Noon* is 43.6% below target and has been for 30 consecutive days, clicks the card, and the center panel snaps to the 30-day trend with the AI-flagged context line. She forwards it to the throughput director before her 8:15 standup.

## Key screens

- **`/` — Dashboard.** Three-column layout:
  - **Left:** KPI stack (6 metrics, status color, value vs. target, large-type values for scannability).
  - **Center:** Metric detail — 30-day trend vs. target, deviation, and AI-flagged context line.
  - **Right:** AI recommendation panel on a dark background — the visual anchor — with three prioritized signal cards (Signal / Impact / Next Action).
- **`/recommendations`** — Full recommendations view for follow-up.

## User flow

1. Land on dashboard.
2. Scan the six KPI tiles (color status + value vs. target).
3. Read the top priority signal in the dark right panel.
4. Click a signal card *or* a KPI tile.
5. Center panel updates with trend chart, deviation, and the AI-flagged explanation.
6. Take next action (named in the signal card).

Target: complete steps 1–5 in under 30 seconds with no onboarding.

## Main build decisions

- **Stack:** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, Recharts, Lovable Cloud backend, Lovable AI Gateway for the recommendations server function.
- **Three-column hierarchy.** Dark right panel is intentional — it creates the visual anchor that tells a new user *where to look first*. Light center/left allows data density without competing for attention.
- **Centralized KPI catalog** in `src/lib/kpi-catalog.ts`. Status thresholds based on absolute deviation from target: ≤10% green, ≤20% yellow, >20% red. Trends are deterministically seeded so the prototype is stable across reloads.
- **AI signals** are produced by the `getRecommendations` server function (`src/server/recommendations.functions.ts`) via Lovable AI Gateway. Static demo copy is used as a fallback so stakeholders always see a realistic, specific output rather than a loading state.
- **Priority badges** are small filled circles (red P1 / orange P2 / yellow P3) for instant scan on the dark panel.
- **Chart axis** is 0–100% with a target reference line so deviation is legible at a glance, regardless of the metric's native unit.
- **Real specificity over placeholder copy.** Cards reference actual operational levers (Discharge Before Noon, Cost per Case, OR Throughput) instead of generic "Metric A / Metric B" stand-ins.

## Run locally

```bash
bun install
bun dev
```

## Repo sync

This project is mirrored to GitHub through Lovable's two-way sync — commits made in Lovable appear on the connected repository automatically.
