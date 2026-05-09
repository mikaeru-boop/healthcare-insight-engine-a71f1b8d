## README.md for Healthcare Ops Advisor

I'll create a `README.md` at the repo root summarizing the prototype. Since this project is synced to GitHub via Lovable's bidirectional integration, committing the file in Lovable automatically pushes it to your connected GitHub repo — no separate push step is needed (and I don't have direct git/GitHub API access from here).

### Proposed README sections

1. **Project**: Healthcare Ops Advisor — internal analytics prototype for VPs of Operations, CFOs, and department directors at acute care health systems.
2. **Hypothesis**: New users bounce (60% first-visit) because a wall of metrics hides what matters. If we surface a single prioritized AI signal alongside a scannable KPI stack, a new user can identify the top issue and take action in under 30 seconds without onboarding.
3. **Scenario**: A VP of Operations opens the dashboard Monday morning. Within 30 seconds they read the top AI-flagged signal, click into the related KPI, and see trend + next action.
4. **Key screens**:
   - `/` Dashboard — three-column layout: KPI stack (left), metric detail with 30-day trend vs. target (center), AI recommendation panel with dark background (right).
   - `/recommendations` — full recommendations view.
5. **User flow**: Land on dashboard → scan 6 KPI tiles (status color + value vs. target) → read top priority signal in dark right panel → click signal or KPI → center panel updates with trend chart, deviation, and AI-flagged context line.
6. **Build decisions**:
   - **Stack**: TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, Recharts, Lovable Cloud (Supabase) backend, Lovable AI Gateway for recommendations server function.
   - **Three-column hierarchy**: dark right panel intentionally creates visual anchor; light center/left for data density.
   - **KPI catalog** centralized in `src/lib/kpi-catalog.ts` (status thresholds: ≤10% green, ≤20% yellow, >20% red; deterministic seeded trends).
   - **AI signals** via `getRecommendations` server function; static demo fallback copy used in prototype so stakeholders see realistic output without waiting for the model.
   - **Priority badges** as filled color circles (red/orange/yellow) for instant scan.
   - **Y-axis 0–100% with target reference line** to make deviation legible at a glance.
7. **Run locally**: `bun install`, `bun dev`.
8. **Repo / sync note**: Code is mirrored to GitHub through Lovable's two-way sync; commits made in Lovable appear on the connected repo automatically.

### Out of scope

- I cannot directly invoke `git push` or the GitHub API. The push happens automatically via the existing Lovable ↔ GitHub sync once the file is committed in the project. If the repo isn't connected yet, you'll need to connect it from the Plus (+) menu → GitHub.
