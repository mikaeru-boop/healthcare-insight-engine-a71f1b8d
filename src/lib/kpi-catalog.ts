import { Activity, DollarSign, Gauge, TrendingUp, type LucideIcon } from "lucide-react";

export type Kpi = {
  slug: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** "higher" → bigger is better. "lower" → smaller is better. */
  better: "higher" | "lower";
  icon: LucideIcon;
  /** Approx $ exposure per quarter when off target. Used for the health banner only. */
  quarterlyDollarImpact?: number;
};

export const KPI_CATALOG: Kpi[] = [
  {
    slug: "or-utilization",
    label: "OR Utilization",
    current: 68,
    target: 82,
    unit: "%",
    better: "higher",
    icon: Gauge,
    quarterlyDollarImpact: 900_000,
  },
  {
    slug: "avg-length-of-stay",
    label: "Avg Length of Stay",
    current: 5.4,
    target: 4.2,
    unit: "days",
    better: "lower",
    icon: Activity,
    quarterlyDollarImpact: 450_000,
  },
  {
    slug: "cost-per-discharge",
    label: "Cost per Discharge",
    current: 12450,
    target: 10800,
    unit: "USD",
    better: "lower",
    icon: DollarSign,
    quarterlyDollarImpact: 1_650_000,
  },
  {
    slug: "ed-throughput",
    label: "ED Throughput",
    current: 2.1,
    target: 3.0,
    unit: "pts/hr",
    better: "higher",
    icon: TrendingUp,
    quarterlyDollarImpact: 320_000,
  },
];

/** % progress toward target (0–100, clamped). 100 = on target or better. */
export function gapPct(k: Kpi): number {
  const pct =
    k.better === "higher" ? (k.current / k.target) * 100 : (k.target / k.current) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export type Health = "healthy" | "watch" | "needs-attention";

export function aggregateHealth(kpis: Kpi[]): {
  status: Health;
  offTarget: Kpi[];
  onTarget: Kpi[];
  exposureUsd: number;
} {
  const offTarget = kpis.filter((k) => gapPct(k) < 95);
  const onTarget = kpis.filter((k) => gapPct(k) >= 95);
  const exposureUsd = offTarget.reduce((sum, k) => sum + (k.quarterlyDollarImpact ?? 0), 0);
  let status: Health = "healthy";
  if (offTarget.some((k) => gapPct(k) < 80)) status = "needs-attention";
  else if (offTarget.length > 0) status = "watch";
  return { status, offTarget, onTarget, exposureUsd };
}

/** Sorts worst → best by gap. */
export function rankByGap(kpis: Kpi[]): Kpi[] {
  return [...kpis].sort((a, b) => gapPct(a) - gapPct(b));
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

/** Signed delta from target, formatted with units. e.g. "−14 %", "+$1,650". */
export function formatDelta(k: Kpi): string {
  const raw = k.current - k.target;
  // For "lower is better", positive raw means we are OVER target → bad.
  // For "higher is better", negative raw means we are UNDER target → bad.
  const sign = raw > 0 ? "+" : raw < 0 ? "−" : "";
  const abs = Math.abs(raw);
  if (k.unit === "USD") return `${sign}$${formatNumber(abs)}`;
  if (k.unit === "%") return `${sign}${formatNumber(abs)} pts`;
  return `${sign}${formatNumber(abs)} ${k.unit}`;
}

export function formatValue(k: Kpi): string {
  if (k.unit === "USD") return `$${formatNumber(k.current)}`;
  if (k.unit === "%") return `${formatNumber(k.current)}%`;
  return `${formatNumber(k.current)} ${k.unit}`;
}

export function formatTarget(k: Kpi): string {
  if (k.unit === "USD") return `$${formatNumber(k.target)}`;
  if (k.unit === "%") return `${formatNumber(k.target)}%`;
  return `${formatNumber(k.target)} ${k.unit}`;
}

export function formatExposure(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1000)}K`;
  return `$${usd}`;
}

export function isOffTarget(k: Kpi): boolean {
  return gapPct(k) < 95;
}

/** Plain-English headline for the hero card. */
export function headlineFor(k: Kpi): string {
  const delta = Math.abs(k.current - k.target);
  if (k.unit === "USD") {
    const dir = k.current > k.target ? "over" : "under";
    return `${k.label} is $${formatNumber(delta)} ${dir} target`;
  }
  if (k.unit === "%") {
    const dir = k.better === "higher" ? "below" : "above";
    return `${k.label} is ${formatNumber(delta)} pts ${dir} target`;
  }
  const dir =
    k.better === "higher"
      ? k.current < k.target
        ? "below"
        : "above"
      : k.current > k.target
        ? "above"
        : "below";
  return `${k.label} is ${formatNumber(delta)} ${k.unit} ${dir} target`;
}
