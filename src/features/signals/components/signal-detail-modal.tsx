import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, History, ListChecks, AlertTriangle, ChevronDown } from "lucide-react";
import {
  useLogSignalAction,
  PRIORITY_DOT,
  useSignals,
  type SignalRecord,
  type SignalStatus,
} from "@/features/signals/data/signals-store";
import { useKpis } from "@/features/kpis/data/kpi-catalog";
import { useUserProfile, roleLabel } from "@/features/profile/data/user-profile";

/**
 * Full-detail view of a signal: header, impact, recommended action,
 * Log Action dropdown, signal history chain, and full action log.
 * Mounted from both the dashboard right panel and the Priority Tracker.
 */

const STATUS_BADGE: Record<SignalStatus, string> = {
  active: "bg-red-500/15 text-red-400 border-red-500/30",
  "in-progress": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  escalated: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const ACTIONS: { id: SignalStatus; label: string; logLabel: string }[] = [
  { id: "active", label: "Active", logLabel: "Marked active" },
  { id: "in-progress", label: "In Progress", logLabel: "Marked in progress" },
  { id: "resolved", label: "Resolved", logLabel: "Marked resolved" },
];

export function SignalDetailModal({
  signal: initialSignal,
  open,
  onOpenChange,
}: {
  signal: SignalRecord | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const profile = useUserProfile();
  const all = useSignals();
  const { data: kpis = [] } = useKpis();
  const logAction = useLogSignalAction();
  const [menuOpen, setMenuOpen] = useState(false);

  // Always read the latest record from the store
  const signal = initialSignal ? all.find((s) => s.id === initialSignal.id) ?? initialSignal : null;
  if (!signal) return null;
  const kpi = kpis.find((k) => k.slug === signal.metricSlug);

  function handleAction(a: (typeof ACTIONS)[number]) {
    if (!signal) return;
    const ts = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    logAction.mutate({
      id: signal.id,
      newStatus: a.id,
      entry: {
        timestamp: ts,
        action: a.logLabel,
        actor: profile.name,
        role: roleLabel(profile.role),
      },
    });
    setMenuOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[signal.priority]}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Priority {signal.priority} · {kpi?.label ?? signal.metricSlug}
            </span>
            <span
              className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_BADGE[signal.status]}`}
            >
              {signal.status.replace("-", " ")}
            </span>
          </div>
          <DialogTitle className="pt-1 text-base leading-snug">{signal.signal}</DialogTitle>
        </DialogHeader>

        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> Detected {signal.detectedAt}
        </p>

        <Section title="Impact" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <p className="text-sm leading-relaxed text-foreground/90">{signal.impact}</p>
        </Section>

        <Section title="Recommended next action" icon={<ListChecks className="h-3.5 w-3.5" />}>
          <p className="text-sm leading-relaxed text-foreground/90">{signal.nextAction}</p>
        </Section>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Log Action <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute z-10 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAction(a)}
                  className="block w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Section title="Signal history chain" icon={<History className="h-3.5 w-3.5" />}>
          {signal.history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No prior instances on record.</p>
          ) : (
            <ol className="space-y-3">
              {signal.history.map((h, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-card/60 p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {h.date}
                  </p>
                  <p className="mt-1 text-xs text-foreground/90">{h.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Outcome: {h.outcome}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Action log" icon={<ListChecks className="h-3.5 w-3.5" />}>
          <ol className="space-y-2">
            {signal.actionLog.map((a, i) => (
              <li
                key={i}
                className="grid grid-cols-[120px_1fr] gap-3 rounded-lg border border-border bg-card/60 p-3"
              >
                <span className="text-[11px] text-muted-foreground">{a.timestamp}</span>
                <div>
                  <p className="text-xs text-foreground/90">{a.action}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.actor} · <span className="text-foreground/70">{a.role}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
