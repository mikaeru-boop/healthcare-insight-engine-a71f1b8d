## Problem

The current Overview is a flat 4-card KPI grid. The data is accurate but every card looks equal — users have to read all of them, do the gap math in their heads, and decide what matters. That's why the bounce rate is 60%: nothing tells the executive *what to look at first* or *what to do next*.

## Goal

Rebuild `/` so that within the first 3 seconds a user sees:
1. The single most urgent issue (hero)
2. A ranked list of what needs attention vs what's healthy
3. A direct path into the AI recommendation flow, pre-loaded with the problem KPIs

No new data — same 4 KPIs, same backend. Pure interface upgrade to prove the thesis.

## New Overview layout

```text
┌─────────────────────────────────────────────────────────────┐
│  Q3 2026 · Ops Health: NEEDS ATTENTION                      │
│  2 of 4 KPIs off target · Est. impact $1.6M/qtr             │
├─────────────────────────────────────────────────────────────┤
│  TOP PRIORITY                              [Act on this →]  │
│  Cost per Discharge is $1,650 over target                   │
│  $12,450 actual vs $10,800 goal  ·  15% gap                 │
│  Sparkline / trend arrow                                    │
├─────────────────────────────────────────────────────────────┤
│  Needs attention (2)         │  On track (2)                │
│  • OR Utilization  −14 pts   │  • (compact rows)            │
│  • ED Throughput   −0.9 /hr  │                              │
│                              │                              │
│  [Generate AI action plan for off-target KPIs →]            │
└─────────────────────────────────────────────────────────────┘
```

### Sections

1. **Health banner** — Aggregate status pill (`Healthy` / `Watch` / `Needs attention`), count of off-target KPIs, and a rough $ exposure figure derived from the worst cost KPI gap. Sets context instantly.

2. **Hero priority card** — The single worst-performing KPI, computed by largest normalized gap. Shows: plain-English headline ("Cost per Discharge is $1,650 over target"), current vs target, gap as both absolute and %, status color bar, and a primary CTA button "Get action plan" that deep-links to `/recommendations` with that KPI pre-loaded.

3. **Two-column triage**:
   - **Needs attention** — sorted by gap descending, each row shows label, delta from target with sign, mini progress bar, click-through.
   - **On track** — compact list, muted styling, just label + check.

4. **Bulk CTA** — "Generate AI action plan for all off-target KPIs" — pre-loads the recommendations form with only the underperformers.

### Visual signal hierarchy

- Off-target uses `destructive` color tokens; on-target uses muted/secondary. No more equal-weight cards.
- Hero card is ~2× the height of triage rows and uses `bg-card` with a colored left border indicating severity.
- Numbers shown with explicit deltas (`−14 pts`, `+$1,650`) instead of raw values requiring mental math.

## Cross-page wiring

`/recommendations` already accepts metric rows in local state. Add support for prefilling via TanStack Router search params:

- `?focus=cost-per-discharge` → loads only that one row + a second placeholder
- `?focus=off-target` → loads all KPIs whose `gapPct < 95`

The Overview's CTAs link with these params. Recommendations route reads `Route.useSearch()`, maps the slug(s) to the existing KPI catalog, and seeds `metrics` state on mount. If no param is present, behavior is unchanged.

## Files to change

- `src/routes/index.tsx` — full rewrite of the Overview component using the layout above. Extract a small `KPI_CATALOG` constant (the existing `KPIS` array, lightly extended with a slug + optional `dollarImpact` for the cost KPI) and helper functions: `rankByGap`, `formatDelta`, `aggregateHealth`.
- `src/routes/recommendations.tsx` — add `validateSearch` for `{ focus?: string }`, read it in the component, and seed `metrics` from the shared catalog when present. Also accept the catalog from a new shared module.
- `src/lib/kpi-catalog.ts` — new file. Single source of truth for the 4 KPIs (slug, label, current, target, unit, better, optional unit cost / $ impact). Both routes import from here so the data stays in sync.

## Out of scope

- No backend or schema changes.
- No new AI prompt — the existing `/api/public/recommend` endpoint is reused as-is.
- Sidebar and root layout untouched.
- No charts library; tiny inline progress / trend marks only (sparklines optional, can be a div bar).

## Acceptance

- Loading `/` shows a clear health verdict and a single "do this next" recommendation above the fold at the current viewport (571×853).
- Clicking the hero CTA lands on `/recommendations` with that KPI's row already filled.
- Clicking "Generate AI action plan for off-target KPIs" lands on `/recommendations` with all underperforming KPI rows pre-filled and ready to submit.
- On-target KPIs are visually de-emphasized so the eye goes to the problems first.
