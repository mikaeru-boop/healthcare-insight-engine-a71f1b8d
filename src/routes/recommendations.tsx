import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { TopNav } from "@/features/dashboard/components/top-nav";
import { SignalDetailModal } from "@/features/signals/components/signal-detail-modal";
import { PriorityTrackerCard } from "@/features/signals/components/priority-tracker-card";
import {
  activeSignals,
  inProgressSignals,
  resolvedSignals,
  useSignals,
  type SignalRecord,
} from "@/features/signals/data/signals-store";

export const Route = createFileRoute("/recommendations")({
  component: PriorityTrackerPage,
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

function PriorityTrackerPage() {
  const [tab, setTab] = useState<TabId>("active");
  const [openSignal, setOpenSignal] = useState<SignalRecord | null>(null);

  const all = useSignals();
  const groups = useMemo(
    () => ({
      active: activeSignals(all),
      "in-progress": inProgressSignals(all),
      resolved: resolvedSignals(all),
    }),
    [all],
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
              <PriorityTrackerCard
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
