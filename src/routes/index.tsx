import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  KPI_CATALOG,
  signedDeviationPct,
  type Kpi,
} from "@/features/kpis/data/kpi-catalog";
import {
  activeSignals,
  inProgressSignals,
  useSignals,
  type SignalRecord,
} from "@/features/signals/data/signals-store";
import { TopNav } from "@/features/dashboard/components/top-nav";
import { SignalDetailModal } from "@/features/signals/components/signal-detail-modal";
import { useRequireRole } from "@/features/profile/hooks/use-require-role";
import { KpiStack } from "@/features/kpis/components/kpi-stack";
import { KpiStackSkeleton } from "@/features/kpis/components/kpi-stack-skeleton";
import { MetricDetailCard } from "@/features/kpis/components/metric-detail-card";
import { PrioritySignalPanel } from "@/features/signals/components/priority-signal-panel";
import { PrioritySignalPanelSkeleton } from "@/features/signals/components/priority-signal-panel-skeleton";

export const Route = createFileRoute("/")({
  component: OperationsDashboardPage,
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Healthcare Ops Advisor" },
      {
        name: "description",
        content:
          "Healthcare operations dashboard surfacing the highest-signal KPIs and AI-prioritized actions.",
      },
    ],
  }),
});

function OperationsDashboardPage() {
  const { hydrated, profile } = useRequireRole();

  const all = useSignals();
  // Visible signals on dashboard = active + in-progress, sorted by priority.
  const visibleSignals = useMemo(
    () =>
      [...activeSignals(all), ...inProgressSignals(all)].sort(
        (a, b) => a.priority - b.priority,
      ),
    [all],
  );

  const [activeSlug, setActiveSlug] = useState<string>(
    visibleSignals[0]?.metricSlug ?? KPI_CATALOG[0].slug,
  );
  const [openSignal, setOpenSignal] = useState<SignalRecord | null>(null);

  // Loading state for AI panel + KPI stack (also re-runs on role switch)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [hydrated, profile.role, profile.department]);

  const activeKpi = useMemo<Kpi>(() => {
    return (
      KPI_CATALOG.find((k) => k.slug === activeSlug) ??
      KPI_CATALOG.slice().sort(
        (a, b) => Math.abs(signedDeviationPct(b)) - Math.abs(signedDeviationPct(a)),
      )[0]
    );
  }, [activeSlug]);

  const activeSignal = visibleSignals.find((s) => s.metricSlug === activeKpi.slug);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1480px] px-6 py-6">
        <TopNav
          title="Operations Dashboard"
          subtitle="High-signal KPIs and AI-ranked priorities for today."
        />

        <div className="grid gap-5 lg:[grid-template-columns:22%_minmax(0,1fr)_30%]">
          {loading ? <KpiStackSkeleton /> : <KpiStack activeSlug={activeKpi.slug} onSelect={setActiveSlug} />}
          <MetricDetailCard kpi={activeKpi} signal={activeSignal} />
          {loading ? (
            <PrioritySignalPanelSkeleton />
          ) : (
            <PrioritySignalPanel
              signals={visibleSignals}
              activeSlug={activeKpi.slug}
              onSignalClick={(signal) => {
                setActiveSlug(signal.metricSlug);
                setOpenSignal(signal);
              }}
            />
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
