import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, AlertTriangle } from "lucide-react";
import {
  KPI_CATALOG,
  formatTarget,
  formatValue,
  signedDeviationPct,
  statusFor,
  trendFor,
  type Kpi,
  type Status,
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

/* ---------- Left: KPI stack ---------- */

function KpiStack({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="text-sm font-semibold text-foreground">Metrics</h2>
        <span className="text-[11px] text-muted-foreground">{KPI_CATALOG.length} tracked</span>
      </div>
      <div className="space-y-1">
        {KPI_CATALOG.map((k) => {
          const active = k.slug === activeSlug;
          return (
            <button
              key={k.slug}
              onClick={() => onSelect(k.slug)}
              className={`group flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors ${
                active ? "bg-sidebar-accent" : "hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`truncate text-[12px] font-medium uppercase tracking-wide ${
                    active ? "text-sidebar-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  {k.label}
                </p>
                <StatusDot status={statusFor(k)} />
              </div>
              <p className="text-[26px] font-semibold leading-none tracking-tight text-foreground">
                {formatValue(k)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Target {formatTarget(k)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Status }) {
  const color =
    status === "green"
      ? "bg-emerald-500"
      : status === "yellow"
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} aria-label={status} />;
}

/* ---------- Center: metric detail ---------- */

function MetricDetail({
  kpi,
  signal,
}: {
  kpi: Kpi;
  signal: SignalRecord | undefined;
}) {
  const trend = useMemo(() => trendFor(kpi), [kpi]);
  const dev = signedDeviationPct(kpi);
  const devLabel = `${dev > 0 ? "+" : ""}${dev.toFixed(1)}%`;

  const { yDomain, yTicks } = useMemo(() => {
    if (kpi.unit === "%") {
      return { yDomain: [0, 100] as [number, number], yTicks: [0, 20, 40, 60, 80, 100] };
    }
    const values = trend.map((d) => d.value);
    const rawMax = Math.max(kpi.target, kpi.current, ...values) * 1.25;
    const pow = Math.pow(10, Math.max(0, Math.floor(Math.log10(rawMax)) - 1));
    const step = Math.ceil(rawMax / 5 / pow) * pow;
    const max = step * 5;
    return {
      yDomain: [0, max] as [number, number],
      yTicks: [0, step, step * 2, step * 3, step * 4, step * 5],
    };
  }, [kpi, trend]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Metric detail
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">{kpi.label}</h2>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-1 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current</p>
            <p className="text-lg font-semibold text-foreground">{formatValue(kpi)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Target</p>
            <p className="text-lg font-semibold text-foreground">{formatTarget(kpi)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Deviation</p>
            <p className="text-lg font-semibold text-foreground">{devLabel}</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend} margin={{ top: 8, right: 56, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={56}
              domain={yDomain}
              ticks={yTicks}
              tickFormatter={(v: number) => formatValue(kpi, v)}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v: number | number[]) => {
                const n = Array.isArray(v) ? v[1] - v[0] : v;
                return [formatValue(kpi, n as number), kpi.label];
              }}
            />
            <Area
              type="monotone"
              dataKey={(d: { value: number }) =>
                kpi.better === "higher"
                  ? [Math.min(d.value, kpi.target), kpi.target]
                  : [kpi.target, Math.max(d.value, kpi.target)]
              }
              stroke="none"
              fill="oklch(0.72 0.18 25)"
              fillOpacity={0.18}
              isAnimationActive={false}
              activeDot={false}
            />
            <ReferenceLine
              y={kpi.target}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{
                value: "Target",
                position: "right",
                fill: "var(--color-muted-foreground)",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-foreground)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Flagged by AI:</span>{" "}
          {signal?.signal ?? "No active signal for this metric."}
        </p>
      </div>
    </div>
  );
}

/* ---------- Right: AI panel ---------- */

function AiPanel({
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

/* ---------- Skeletons & error states ---------- */

function KpiStackSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-14 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AiPanelSkeleton() {
  return (
    <aside className="dark rounded-2xl border border-border bg-[oklch(0.18_0.03_270)] p-5 text-foreground shadow-[0_8px_24px_-8px_rgba(16,24,40,0.25)]">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="mb-5 h-3 w-32 animate-pulse rounded bg-muted/30" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-card/40 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted/40" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted/30" />
            <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted/30" />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function AiPanelError({ signals }: { signals: SignalRecord[] }) {
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

