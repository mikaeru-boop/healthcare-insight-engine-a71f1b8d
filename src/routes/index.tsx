import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  KPI_CATALOG,
  signedDeviationPct,
  type Kpi,
} from "@/lib/kpi-catalog";
import {
  activeSignals,
  inProgressSignals,
  useSignals,
  type SignalRecord,
} from "@/lib/signals-data";
import { TopNav } from "@/components/top-nav";
import { SignalDetailModal } from "@/components/signal-detail-modal";
import { useHydrated, useUserProfile } from "@/lib/user-profile";
import { KpiStack } from "@/components/dashboard/kpi-stack";
import { MetricDetail } from "@/components/dashboard/metric-detail";
import { AiPanel, AiPanelError } from "@/components/dashboard/ai-panel";
import { KpiStackSkeleton, AiPanelSkeleton } from "@/components/dashboard/panel-skeletons";

export const Route = createFileRoute("/")({
  component: Dashboard,
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

function Dashboard() {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const hydrated = useHydrated();

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
  const [signalsError] = useState(false); // wired for failure display

  useEffect(() => {
    if (hydrated && !profile.role) {
      navigate({ to: "/role-select" });
    }
  }, [hydrated, profile.role, navigate]);

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
          <MetricDetail kpi={activeKpi} signal={activeSignal} />
          {loading ? (
            <AiPanelSkeleton />
          ) : signalsError ? (
            <AiPanelError signals={visibleSignals} />
          ) : (
            <AiPanel
              signals={visibleSignals}
              activeSlug={activeKpi.slug}
              onSelectSignal={(slug) => setActiveSlug(slug)}
              onOpenSignal={(s) => setOpenSignal(s)}
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
