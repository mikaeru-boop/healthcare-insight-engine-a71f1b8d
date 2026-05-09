import { Sparkles } from "lucide-react";
import { PRIORITY_DOT, type SignalRecord } from "@/features/signals/data/signals-store";

/**
 * Right column of the dashboard ("Where to focus today").
 * Dark-surface anchor that lists active + in-progress signals sorted by priority.
 * Per PRD: this is the visual anchor that tells a new user where to look first.
 */
export function PrioritySignalPanel({
  signals,
  activeSlug,
  onSignalClick,
}: {
  signals: SignalRecord[];
  activeSlug: string;
  onSignalClick: (signal: SignalRecord) => void;
}) {
  return (
    <aside className="dark rounded-2xl border border-border bg-[oklch(0.18_0.03_270)] p-5 text-foreground shadow-[0_8px_24px_-8px_rgba(16,24,40,0.25)]">
      <div className="mb-1 flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-base font-semibold text-foreground">Where to focus today</h2>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Updated May 2, 2026 at 8:04 AM
      </p>

      <ul className="space-y-3">
        {signals.map((s) => {
          const active = s.metricSlug === activeSlug;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSignalClick(s)}
                className={`w-full rounded-xl border bg-card/40 p-5 text-left transition-all ${
                  active
                    ? "border-primary/60 bg-card/60 shadow-[0_2px_6px_rgba(91,73,232,0.25)]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[s.priority]}`} />
                  Priority {s.priority}
                </span>

                {/* Headline: the signal */}
                <p className="mt-2 text-[13px] font-semibold leading-snug text-foreground">
                  {s.signal}
                </p>

                {/* Secondary: impact */}
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {s.impact}
                </p>

                {/* Directive: next action, set apart */}
                <div className="mt-3 border-t border-border/60 pt-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                    Next action
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-foreground/90">
                    {s.nextAction}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
