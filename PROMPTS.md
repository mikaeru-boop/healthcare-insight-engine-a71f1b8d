# PROMPTS.md

This document captures the three pivotal prompts used to shape the Healthcare Ops Advisor prototype — labeled **Expand**, **Behavior**, and **Refine** — together with the documented results of each.

---

## 1. Expand — Add the 5 supporting screens

**Prompt**

> Add a 1st screen: a semi-landing screen that confirms the user's role and previews their top 3 KPI focus areas before routing to the dashboard. Match the layout of the attached reference screenshot.
> Add a 2nd screen: a role selection screen where a first-time user picks VP of Operations, CFO, or Department Director, with a department picker that appears conditionally for Department Director. Match the attached reference screenshot.
> Add a 3rd screen: a profile and settings modal accessible from the top navigation, showing the user's current role with an edit option that loads the same role selection UI. Match the attached reference screenshot.
> Add a 4th screen: a signal detail modal triggered by clicking any signal card, showing the full signal history chain, prior instances, action log with timestamps, and role attribution. Match the attached reference screenshot.
> Add a 5th screen: an updated recommendations view at /recommendations with three filtered sections: active signals, in-progress signals with action timestamps, and resolved signals with history chain. Match the attached reference screenshot. Build navigation between all 5 screens.

**Result**

Five new surfaces wired together with a shared profile + signal data layer:

- **`/role-select`** — first-time picker (VP of Operations, CFO, Department Director) with a conditional department dropdown when Director is chosen.
- **`/welcome`** — role confirmation screen previewing the top 3 KPI focus areas from `roleConfig.focusSlugs` before routing to the dashboard.
- **Profile & settings modal** — opened from the new `TopNav`; shows the current role and re-uses the role-select UI for edits.
- **Signal detail modal** — opens on any signal-card click; renders the full history chain, prior instances, action log with timestamps, and role attribution.
- **`/recommendations`** — tabbed view with Active / In Progress / Resolved sections, action timestamps, and outcome strings.

Files created: `src/lib/user-profile.ts`, `src/lib/signals-data.ts`, `src/components/role-picker.tsx`, `src/components/profile-modal.tsx`, `src/components/signal-detail-modal.tsx`, `src/components/top-nav.tsx`, `src/routes/role-select.tsx`, `src/routes/welcome.tsx`. Profile state persists in `localStorage`; users without a saved role are auto-routed to `/role-select`.

---

## 2. Behavior — Persist Log Action across the app

**Prompt**

> When a user selects an action from the Log Action dropdown in the signal detail modal, the status change must persist across the app. Specifically: update the signal's status in the shared app state immediately on selection; reflect the new status in the Priority Tracker page by moving the signal from the Active tab to the correct tab (In Progress or Resolved) and updating the tab counts; update the status badge on the signal card in the Priority Tracker list to match the new state; and update the Action Log entry with the timestamp, action taken, and the current user's name and role. The signal should no longer appear in the Active tab once a status change is logged. Do not change anything else.

**Result**

Replaced the static signal array with a reactive store so every surface re-renders on a status change:

- **`src/lib/signals-data.ts`** — added `useSignals()` backed by `useSyncExternalStore`, plus `logSignalAction(id, newStatus, entry)` that updates `status` and appends to `actionLog`, then notifies subscribers. `activeSignals` / `inProgressSignals` / `resolvedSignals` now read from the live store. `SignalStatus` extended with `"escalated"`, which falls under In Progress.
- **`src/components/signal-detail-modal.tsx`** — subscribes to the store and re-derives the signal by ID, so the status badge in the modal header updates instantly. `handleAction` calls `logSignalAction` with `profile.name` and `roleLabel(profile.role)` and a freshly formatted timestamp.
- **`src/routes/recommendations.tsx`** — `groups` and tab counts derive from `useSignals()`; cards now render a colored `StatusBadge` (active / in-progress / escalated / resolved). Logged signals immediately leave the Active tab.
- **`src/routes/index.tsx`** — dashboard `visibleSignals` also reads from `useSignals()`, so the right-hand AI panel reflects status changes without a refresh.

Net effect: a single action in the modal moves the signal across tabs, updates badges everywhere, increments/decrements counts, and writes a stamped, attributed log entry — all in one render cycle.

---

## 3. Refine — Fix the signal card's typography hierarchy

**Prompt**

> Focus only on the signal card in the dark right panel.
> Start by listing the 3 biggest gaps in typography hierarchy, spacing, and information density compared to a professional clinical operations dashboard standard.
> Once identified, adjust the type scale, padding, and priority badge placement to fix those gaps. Don't change anything else in the project.

**Result — three diagnosed gaps**

1. **Flat typography hierarchy.** Signal, Impact, and Next action were all `text-xs` with identical weight — only inline bold labels differentiated them. The signal statement is the headline and should dominate; impact is secondary; next action is a directive.
2. **Priority badge buried and underweight.** A 2.5px dot + 10px uppercase "Priority X" competed with body text instead of leading the scan. Clinical dashboards lead with a high-contrast numbered severity chip so triage happens in under a second.
3. **Undifferentiated spacing / density.** Uniform ~6px gaps between three paragraphs and a tight `p-4` gave no grouping between headline and supporting metadata, making the card feel like an email blob rather than a triage card.

**Fixes applied in `src/routes/index.tsx`**

- Signal becomes the headline at `text-[13px] font-semibold leading-snug text-foreground`.
- Impact drops to `text-[11px] leading-relaxed text-muted-foreground` as secondary context.
- "Next action" is set apart with a `border-t border-border/60 pt-2.5` divider, an uppercase `text-[10px] font-semibold tracking-wider text-primary/80` label, and a `text-[12px]` directive line.
- Card padding increased from `p-4` to `p-5` with grouped vertical rhythm (`mt-2` / `mt-3`) between tiers.
- Priority badge placement and treatment iterated through review; the card now reads in three clear tiers — priority → headline → impact → next action.

---

_Last updated: May 9, 2026_
