import { Sparkles, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { PRIORITY_DOT, type SignalRecord } from "@/features/signals/data/signals-store";
import { useKpis } from "@/features/kpis/data/kpi-catalog";

/**
 * Row card used inside the Priority Tracker tabs.
 * Shows priority dot, KPI label, status badge, signal headline, impact,
 * and a status-specific footer (last action / detection / resolution outcome).
 */
export function PriorityTrackerCard({
  signal,
  onOpen,
}: {
  signal: SignalRecord;
  onOpen: () => void;
}) {
  const { data: kpis = [] } = useKpis();
  const kpi = kpis.find((k) => k.slug === signal.metricSlug);
  const lastAction = signal.actionLog[signal.actionLog.length - 1];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
    >
      <div className="mt-1 flex flex-col items-center gap-1">
        <span className={`inline-block h-3 w-3 rounded-full ${PRIORITY_DOT[signal.priority]}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          P{signal.priority}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {kpi?.label ?? signal.metricSlug}
          </span>
          <SignalStatusBadge status={signal.status} />
          {signal.status === "resolved" && signal.history.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {signal.history.length} prior instance{signal.history.length === 1 ? "" : "s"} on record
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{signal.signal}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{signal.impact}</p>

        {(signal.status === "in-progress" || signal.status === "escalated") && lastAction && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last action <span className="text-foreground">{lastAction.timestamp}</span> ·{" "}
            {lastAction.actor} ({lastAction.role})
          </p>
        )}
        {signal.status === "active" && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Detected <span className="text-foreground">{signal.detectedAt}</span> · No action logged
          </p>
        )}
        {signal.status === "resolved" && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {signal.history[signal.history.length - 1]?.outcome ?? "Resolved."}
          </p>
        )}
      </div>

      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function SignalStatusBadge({ status }: { status: SignalRecord["status"] }) {
  const map: Record<SignalRecord["status"], string> = {
    active: "bg-red-500/15 text-red-500 border-red-500/30",
    "in-progress": "bg-amber-500/15 text-amber-600 border-amber-500/30",
    escalated: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    resolved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
