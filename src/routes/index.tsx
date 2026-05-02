import { createFileRoute } from "@tanstack/react-router";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { Sparkles, AlertCircle, ArrowDown } from "lucide-react";
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
import { getRecommendations } from "@/server/recommendations.functions";
import type { Signal } from "@/server/recommendations.functions";

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
  const callRecs = useServerFn(getRecommendations);
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Fire AI call on load.
  useEffect(() => {
    let cancelled = false;
    const payload = {
      kpis: KPI_CATALOG.map((k) => ({
        slug: k.slug,
        label: k.label,
        current: k.current,
        target: k.target,
        unit: k.unit,
        better: k.better,
        deviationPct: Math.round(Math.abs(signedDeviationPct(k))),
        status: statusFor(k),
      })),
    };
    callRecs({ data: payload })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setRecError(res.error);
          return;
        }
        setSignals(res.signals);
        setGeneratedAt(res.generatedAt);
        if (res.signals[0]) setActiveSlug(res.signals[0].metricSlug);
      })
      .catch((e) => {
        if (!cancelled) setRecError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [callRecs]);

  const activeKpi = useMemo<Kpi>(() => {
    return (
      KPI_CATALOG.find((k) => k.slug === activeSlug) ??
      KPI_CATALOG.slice().sort(
        (a, b) => Math.abs(signedDeviationPct(b)) - Math.abs(signedDeviationPct(a)),
      )[0]
    );
  }, [activeSlug]);

  const activeSignal = signals?.find((s) => s.metricSlug === activeKpi.slug);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1480px] px-6 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              Operations Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              High-signal KPIs and AI-ranked priorities for today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15">
              <Sparkles className="h-3.5 w-3.5" />
              Refresh insights
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-[oklch(0.7_0.18_320)] shadow-sm" />
          </div>
        </header>

        {/* 3-column grid: 20 / 50 / 30 */}
        <div className="grid gap-5 lg:[grid-template-columns:22%_minmax(0,1fr)_30%]">
          <KpiStack
            activeSlug={activeKpi.slug}
            onSelect={(slug) => setActiveSlug(slug)}
          />
          <MetricDetail kpi={activeKpi} signal={activeSignal} />
          <AiPanel
            signals={signals}
            error={recError}
            generatedAt={generatedAt}
            activeSlug={activeKpi.slug}
            onSelectSignal={(slug) => setActiveSlug(slug)}
            onScrollToTable={() =>
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          />
        </div>

        <DataTable ref={tableRef} />
      </div>
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
              className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active ? "bg-sidebar-accent" : "hover:bg-muted"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`truncate text-[13px] font-medium ${
                    active ? "text-sidebar-accent-foreground" : "text-foreground"
                  }`}
                >
                  {k.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Target {formatTarget(k)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatValue(k)}
                </span>
                <StatusDot status={statusFor(k)} />
              </div>
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

function MetricDetail({ kpi, signal }: { kpi: Kpi; signal: Signal | undefined }) {
  const trend = useMemo(() => trendFor(kpi), [kpi]);
  const dev = signedDeviationPct(kpi);
  const devLabel = `${dev > 0 ? "+" : ""}${dev.toFixed(1)}%`;
  const isBad =
    (kpi.better === "higher" && dev < 0) || (kpi.better === "lower" && dev > 0);

  const { yDomain, yTicks } = useMemo(() => {
    if (kpi.unit === "%") {
      return { yDomain: [0, 100] as [number, number], yTicks: [0, 20, 40, 60, 80, 100] };
    }
    const values = trend.map((d) => d.value);
    const rawMax = Math.max(kpi.target, kpi.current, ...values) * 1.25;
    const rawMin = 0;
    const pow = Math.pow(10, Math.max(0, Math.floor(Math.log10(rawMax)) - 1));
    const step = Math.ceil(rawMax / 5 / pow) * pow;
    const max = step * 5;
    return {
      yDomain: [rawMin, max] as [number, number],
      yTicks: [0, step, step * 2, step * 3, step * 4, step * 5],
    };
  }, [kpi, trend]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Signal 1 · Metric detail
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
            <p
              className={`text-lg font-semibold ${
                isBad ? "text-foreground" : "text-foreground"
              }`}
            >
              {devLabel}
            </p>
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
          {signal?.signal ?? "Awaiting AI signal for this metric."}
        </p>
      </div>
    </div>
  );
}

/* ---------- Right: AI panel ---------- */

function AiPanel({
  signals,
  error,
  generatedAt,
  activeSlug,
  onSelectSignal,
  onScrollToTable,
}: {
  signals: Signal[] | null;
  error: string | null;
  generatedAt: string | null;
  activeSlug: string;
  onSelectSignal: (slug: string) => void;
  onScrollToTable: () => void;
}) {
  const ts = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <aside className="rounded-2xl border border-primary/15 bg-sidebar-accent p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-1 flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-base font-semibold text-foreground">Where to focus today</h2>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        {ts ? `Updated ${ts}` : "Updating…"}
      </p>

      {error ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm leading-relaxed text-foreground">
              Unable to load recommendations. Refresh to try again. If the issue continues,
              check that your data source is connected.
            </p>
          </div>
        </div>
      ) : signals === null ? (
        <SignalSkeletons />
      ) : signals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          No signals flagged today. All tracked metrics are within 10% of target. Check back
          after the next data refresh or review the full metric table below.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {signals.map((s) => {
            const active = s.metricSlug === activeSlug;
            return (
              <li key={s.priority}>
                <button
                  onClick={() => onSelectSignal(s.metricSlug)}
                  className={`w-full rounded-xl border bg-card p-4 text-left transition-all ${
                    active
                      ? "border-primary/40 shadow-[0_2px_6px_rgba(91,73,232,0.12)]"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Priority {s.priority}
                  </span>
                  <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                    {s.signal}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/70">Impact:</span> {s.impact}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground/70">Next action:</span> {s.nextAction}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={onScrollToTable}
        className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        View all metrics
        <ArrowDown className="h-3 w-3" />
      </button>
    </aside>
  );
}

function SignalSkeletons() {
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">Analyzing data…</p>
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-5/6 rounded bg-muted" />
          <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Bottom: data table ---------- */

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days", "Quarter to date"];
const CATEGORIES = ["All", "Financial", "Capacity", "Throughput", "Quality"] as const;

const DataTable = forwardRef<HTMLDivElement>(function DataTable(_, ref) {
  const [period, setPeriod] = useState(PERIODS[1]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = KPI_CATALOG.filter(
    (k) => category === "All" || k.category === category,
  );

  return (
    <div ref={ref} className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">All metrics</h2>
          <p className="text-xs text-muted-foreground">
            Full operational data for power users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground"
          >
            {PERIODS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number])
            }
            className="h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Metric</th>
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Current</th>
              <th className="py-2 pr-4 font-medium">Target</th>
              <th className="py-2 pr-4 font-medium">Deviation</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((k) => {
              const dev = signedDeviationPct(k);
              return (
                <tr key={k.slug} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{k.label}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{k.category}</td>
                  <td className="py-3 pr-4 text-foreground">{formatValue(k)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatTarget(k)}</td>
                  <td className="py-3 pr-4 text-foreground">
                    {dev > 0 ? "+" : ""}
                    {dev.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4">
                    <StatusDot status={statusFor(k)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
