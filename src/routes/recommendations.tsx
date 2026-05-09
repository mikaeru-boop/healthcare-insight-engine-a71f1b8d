import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, AlertCircle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { SignalDetailModal } from "@/components/signal-detail-modal";
import {
  activeSignals,
  inProgressSignals,
  resolvedSignals,
  type SignalRecord,
} from "@/lib/signals-data";
import { KPI_CATALOG } from "@/lib/kpi-catalog";

export const Route = createFileRoute("/recommendations")({
  component: RecommendationsPage,
  head: () => ({
    meta: [
      { title: "Priority Tracker — Healthcare Ops Advisor" },
      {
        name: "description",
        content:
          "Active, in-progress, and resolved operational signals with full action history.",
      },
    ],
  }),
});

type TabId = "active" | "in-progress" | "resolved";

function RecommendationsPage() {
  const [tab, setTab] = useState<TabId>("active");
  const [openSignal, setOpenSignal] = useState<SignalRecord | null>(null);

  const groups = useMemo(
    () => ({
      active: activeSignals(),
      "in-progress": inProgressSignals(),
      resolved: resolvedSignals(),
    }),
    [],
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "active", label: "Active", icon: <AlertCircle className="h-3.5 w-3.5" />, count: groups.active.length },
    { id: "in-progress", label: "In progress", icon: <Clock className="h-3.5 w-3.5" />, count: groups["in-progress"].length },
    { id: "resolved", label: "Resolved", icon: <CheckCircle2 className="h-3.5 w-3.5" />, count: groups.resolved.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-6">
        <TopNav title="Priority Tracker" />

        <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1">
          {tabs.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
                <span
                  className={`ml-1 rounded-full px-1.5 text-[10px] ${
                    active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {groups[tab].length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            groups[tab].map((s) => (
              <SignalCard
                key={s.id}
                signal={s}
                onOpen={() => setOpenSignal(s)}
              />
            ))
          )}
        </div>
      </div>

      <SignalDetailModal
        signal={openSignal}
        open={openSignal !== null}
        onOpenChange={(v) => !v && setOpenSignal(null)}
      />
    </div>
  );
}

function SignalCard({ signal, onOpen }: { signal: SignalRecord; onOpen: () => void }) {
  const kpi = KPI_CATALOG.find((k) => k.slug === signal.metricSlug);
  const lastAction = signal.actionLog[signal.actionLog.length - 1];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
    >
      <div className="mt-1 flex flex-col items-center gap-1">
        <span className={`inline-block h-3 w-3 rounded-full ${signal.dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          P{signal.priority}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {kpi?.label ?? signal.metricSlug}
          </span>
          {signal.status === "resolved" && signal.history.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {signal.history.length} prior instance{signal.history.length === 1 ? "" : "s"} on record
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{signal.signal}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{signal.impact}</p>

        {signal.status === "in-progress" && lastAction && (
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

function EmptyState({ tab }: { tab: TabId }) {
  const copy: Record<TabId, { icon: React.ReactNode; text: string }> = {
    active: {
      icon: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
      text: "No active signals. New AI-flagged priorities will appear here as they're detected.",
    },
    "in-progress": {
      icon: <Clock className="h-5 w-5 text-muted-foreground" />,
      text: "No signals actioned yet. When you escalate or note a signal, it will appear here.",
    },
    resolved: {
      icon: <CheckCircle2 className="h-5 w-5 text-muted-foreground" />,
      text: "No resolved signals yet. Signals close automatically when the metric returns within threshold.",
    },
  };
  const { icon, text } = copy[tab];
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
