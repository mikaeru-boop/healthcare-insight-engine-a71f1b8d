# Healthcare Ops Advisor — Product Requirements Document

**Status:** Prototype (extracted from working build)
**Owner:** Product
**Last updated:** May 9, 2026

---

## 1. Summary

Healthcare Ops Advisor is an internal analytics tool for VPs of Operations, CFOs, and Department Directors at acute care health systems. It surfaces six core operational KPIs alongside an AI-prioritized "where to focus today" panel so a leader can identify the most important issue, log an action, and follow it through to resolution — with no onboarding.

The prototype replaces the current analytics suite's wall-of-metrics experience, which has a 60% first-visit bounce rate, with a triaged, action-oriented view.

## 2. Problem & hypothesis

**Problem.** The existing analytics suite presents accurate data but no prioritization. New users see dozens of equally-weighted metrics, can't tell which one matters today, and leave. Only power users extract value.

**Hypothesis.** The bounce is a *prioritization* problem, not a data problem. If we pair a scannable KPI stack with a single, AI-prioritized signal that names the metric, the impact, and the next action — and let the user log that action and watch it persist across the app — a first-time user can read the top signal, click into the related metric, and decide what to do in **under 30 seconds**, with no instruction.

## 3. Goals & non-goals

### Goals
- Reduce first-visit bounce by surfacing one clear "do this next" recommendation.
- Make every signal actionable: every card carries an explicit next action and an in-app way to log progress.
- Persist actions and status across screens so triage feels like real work, not a demo.
- Tailor the experience to the user's role (VP Ops, CFO, Director) without requiring configuration.

### Non-goals (this release)
- Multi-tenant auth, SSO, or HIPAA-grade PHI handling. Profile is local-only.
- Writing back to source-of-truth EHR/finance systems.
- Mobile-first layout — desktop is the primary form factor for ops standups.
- Custom KPI authoring by end users.

## 4. Target users

| Role | Primary concerns | Default focus KPIs |
|------|------------------|--------------------|
| **VP of Operations** | Throughput, capacity, discharge flow across the system | Discharge Before Noon, OR Throughput, Bed Utilization |
| **CFO** | Cost per case, length of stay, financial impact of operations | Cost per Case, Length of Stay, Readmission Rate |
| **Department Director** | Department-level frontline operational signals | OR Throughput, Length of Stay, Discharge Before Noon |

Profile fields collected: role, department (Directors only), name, email. Stored in `localStorage`.

## 5. Core scenario

Monday, 8:04 AM. A VP of Operations opens the dashboard with coffee in hand. She doesn't read every tile. She glances at the dark right-hand panel, sees that *Discharge Before Noon* is 43.6% below target and has been for 30 consecutive days, clicks the card, reviews the full signal history chain in the detail modal, and selects **Mark as In Progress** from the Log Action dropdown. The signal moves from Active to In Progress in the Priority Tracker, the action log captures her name, role, and timestamp, and she forwards the link to the throughput director before her 8:15 standup.

## 6. Functional requirements

### 6.1 Onboarding & role selection (`/role-select`, `/welcome`)
- New users without a saved role are auto-redirected to `/role-select`.
- Role picker offers VP of Operations, CFO, Department Director. Directors must also pick a department from a fixed list (Emergency, Surgical Services, Medical / Telemetry, ICU / Critical Care, Cardiology, Oncology).
- `/welcome` confirms role + name and previews the user's top 3 KPI focus areas with current value, target, and signed deviation. CTA: "Open dashboard".
- Role can be changed at any time from the profile button in the top nav, which re-opens the role-select UI.

### 6.2 Dashboard (`/`)
Three-column layout (22% / flex / 30%):

**Left — KPI stack.** Six metrics rendered as scannable tiles: label (uppercase), large-type current value, target, and a status dot (green ≤10% deviation, yellow ≤20%, red >20%). Clicking a tile selects it as the active metric.

**Center — Metric detail.** For the active KPI: current, target, signed % deviation, a 30-day trend line vs. a dashed target reference, and a one-line "Flagged by AI" summary tied to the current signal (if any).

**Right — AI recommendation panel (dark surface).** The visual anchor. Renders prioritized signal cards. Each card shows:
- Priority badge (1 / 2 / 3 with red / orange / yellow dot)
- Signal headline (13px semibold) — what is happening, with concrete numbers
- Impact (11px) — operational or financial consequence
- "Next action" directive on its own divider — one concrete step

Visible signals = active + in-progress, sorted ascending by priority. Clicking a card sets it as the active metric *and* opens the signal detail modal.

**Top nav.** Page title, "Refresh insights" affordance, and a profile chip (name + role) that opens a modal where the user can edit identity or trigger role change.

**Loading & error states.**
- Skeleton tiles for the KPI stack and skeleton signal cards for the AI panel during initial load and on role/department change (~600ms simulated latency).

### 6.3 Signal detail modal
Opened from any signal card on the dashboard or Priority Tracker. Contains:
- Header: priority dot, KPI label, status badge, signal headline, detection timestamp.
- **Impact** section.
- **Recommended next action** section.
- **Log Action** dropdown — write Active / In Progress / Resolved. Writes a new entry to the action log with `{ timestamp, actor (profile.name), role (roleLabel), action }`.
- **Signal history chain** — prior instances of the same signal with date, summary, and outcome (e.g. "Resolved after 9 days following weekend rounding pilot").
- **Action log** — full chronological audit trail.

### 6.4 Priority Tracker (`/recommendations`)
Tabbed view: **Active**, **In progress**, **Resolved**. Each tab shows a live count badge.
- Each card shows: priority dot, KPI label, status badge, signal headline, impact, and a contextual footer line (last action for in-progress, detection time for active, outcome for resolved).
- Empty states are tab-specific (e.g. "No signals actioned yet. When you escalate or note a signal, it will appear here.").
- Cards open the same signal detail modal as the dashboard. Status changes update tab counts and card placement live.

## 7. Data model

**KPI** (`src/lib/kpi-catalog.ts`): `slug`, `label`, `current`, `target`, `unit` (USD / % / cases/day / days), `better` ("higher" | "lower"), `category` (Financial / Capacity / Throughput / Quality), `icon`.

Six seeded KPIs: Cost per Case, Bed Utilization, OR Throughput, Length of Stay, Readmission Rate, Discharge Before Noon.

**Signal** (`src/lib/signals-data.ts`):
```
id, metricSlug, priority (1|2|3), status ("active"|"in-progress"|"resolved"|"escalated"),
signal, impact, nextAction, detectedAt,
history: [{ date, summary, outcome }],
actionLog: [{ timestamp, actor, role, action }]
```

Priority → dot color: 1 = red, 2 = orange, 3 = yellow.

**UserProfile**: `role`, `department`, `name`, `email` — persisted to `localStorage` under `hoa.profile.v1`.

## 8. AI integration

`getRecommendations` server function (`src/server/recommendations.functions.ts`) calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a structured tool call (`emit_signals`) that returns up to 3 signals with `{ priority, metricSlug, signal, impact, nextAction }`.

- Input: KPI slugs/values/targets/deviation/status. Only off-target KPIs are sent.
- Output is enforced via JSON schema on a forced tool call — no free-form parsing.
- Prompt enforces tone: concrete numbers, one-sentence each, with a directive next step.
- Failure modes return structured `{ error }` with friendly copy: rate limit, credits exhausted, generic gateway error. The current dashboard renders static seed signals as a deterministic fallback so stakeholders always see realistic output.

## 9. Key flows

1. **First visit** → `/role-select` → `/welcome` → dashboard.
2. **Returning visit** → dashboard loads with role-tailored loading state, then KPI stack + AI panel.
3. **Triage** → scan KPI stack → read top priority signal → click card → review history + impact + next action → **Log Action** → status updates everywhere.
4. **Follow-through** → open `/recommendations` → filter by tab → see action timestamps and outcomes through to closure.

**Targets.** First-time user completes steps 1–4 in under 30 seconds with no onboarding. Returning user lands, triages, and logs an action in under 60 seconds.

## 10. Design principles

- **Three-column hierarchy with a dark right panel.** The dark surface is the visual anchor that tells a new user *where to look first*. Light center/left allows data density without competing for attention.
- **Typography hierarchy on signal cards.** Three tiers (13px semibold headline, 11px impact, divider-separated uppercase "Next action") instead of three same-weight paragraphs.
- **Real specificity over placeholder copy.** Cards reference actual operational levers (Discharge Before Noon, Cost per Case, OR Throughput) rather than generic stand-ins.
- **First-class loading, empty, and error states.** Skeletons during refresh; tab-specific empty copy in the tracker; friendly fallback in the AI panel on failure.
- **Brand palette.** Deep green (`#145338`) primary with soft sage neutrals, OKLCH tokens in `src/styles.css`. Google Sans Text + Google Sans typography.

## 11. Technical decisions

- **Stack.** TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, Recharts, Lovable Cloud backend, Lovable AI Gateway.
- **Reactive signal store.** `useSyncExternalStore`-backed `useSignals()` hook + `logSignalAction(id, status, entry)`. Status changes from the modal propagate instantly to the dashboard's right panel and the Priority Tracker tabs/badges/counts — no refresh, no prop drilling.
- **Centralized KPI catalog.** Status thresholds are absolute deviation from target: ≤10% green, ≤20% yellow, >20% red. 30-day trends are deterministically seeded so the prototype is stable across reloads.
- **`useRequireRole` hook.** Single source of truth for the "no role → redirect" gate, returning `{ hydrated, profile }` to consumers.
- **Profile in `localStorage`.** No server identity in this release; the action log credits the active profile on every entry.

## 12. Success metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| First-visit bounce rate | 60% | < 30% |
| Time-to-first-action (new user) | n/a | < 30 sec |
| Time-to-first-action (returning) | n/a | < 60 sec |
| % of active signals with a logged action within 24h | n/a | > 70% |
| % of resolved signals closed via in-app action (vs. ignored until metric recovers) | n/a | > 50% |

## 13. Edge cases & open questions

**Edge cases handled in prototype.**
- No active signals on a metric → metric detail shows "No active signal for this metric."
- AI gateway 429 / 402 / generic error → friendly fallback copy; static seed signals remain visible.
- SSR/hydration → `useHydrated` gate prevents flicker between default profile and persisted profile.
- Role switch → triggers loading skeletons in KPI stack + AI panel so stale role-specific copy isn't shown.

**Open questions.**
- Server identity & multi-user attribution: when do we move off `localStorage` profiles?
- Signal lifecycle: should "Resolved" auto-revert to "Active" if the metric drifts back out of threshold, or require manual re-open?
- Notification model: do we push new active signals to email/Slack, or keep pull-only?
- Department-level scoping: today, Director's department is captured but not yet used to filter signals.
- Source-of-truth integrations: which EHR / finance systems for the v1 production release?

## 14. Out of scope for this release

- Writing back to EHR / finance systems.
- Mobile and tablet layouts.
- User-defined KPIs, thresholds, or signal rules.
- Multi-tenant org management, SSO, RBAC.
- Historical analytics beyond the seeded 30-day trend.
