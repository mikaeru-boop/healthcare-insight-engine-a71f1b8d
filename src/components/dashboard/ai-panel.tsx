import { Sparkles, AlertTriangle } from "lucide-react";
import { PRIORITY_DOT, type SignalRecord } from "@/lib/signals-data";

export function AiPanel({
  signals,
  activeSlug,
  onSelectSignal,
  onOpenSignal,
}: {
  signals: SignalRecord[];
  activeSlug: string;
  onSelectSignal: (slug: string) => void;
  onOpenSignal: (s: SignalRecord) => void;
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
                onClick={() => {
                  onSelectSignal(s.metricSlug);
                  onOpenSignal(s);
                }}
                className={`w-full rounded-xl border bg-card/40 p-5 text-left transition-all ${
                  active
                    ? "border-primary/60 bg-card/60 shadow-[0_2px_6px_rgba(91,73,232,0.25)]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
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

export function AiPanelError({ signals }: { signals: SignalRecord[] }) {
  return (
    <aside className="dark rounded-2xl border border-border bg-[oklch(0.18_0.03_270)] p-5 text-foreground shadow-[0_8px_24px_-8px_rgba(16,24,40,0.25)]">
      <div className="mb-1 flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-base font-semibold text-foreground">Where to focus today</h2>
      </div>
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-xs leading-relaxed text-amber-100/90">
          Signals unavailable. Showing last known priorities.
        </p>
      </div>
      <ul className="space-y-3">
        {signals.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-border bg-card/40 p-4 opacity-80"
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
              Priority {s.priority}
            </span>
            <p className="mt-2 text-xs leading-relaxed text-foreground/90">
              <span className="font-semibold text-foreground">Signal:</span> {s.signal}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
