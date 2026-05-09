import { useMemo } from "react";
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
import {
  formatTarget,
  formatValue,
  signedDeviationPct,
  trendFor,
  type Kpi,
} from "@/features/kpis/data/kpi-catalog";
import type { SignalRecord } from "@/features/signals/data/signals-store";

/**
 * Center column of the dashboard: full detail for the active KPI —
 * current vs. target, signed deviation, 30-day trend, and the AI signal headline.
 */
export function MetricDetailCard({
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
