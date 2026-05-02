import {
  Activity,
  BedDouble,
  Clock,
  DollarSign,
  Gauge,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export type Kpi = {
  slug: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  /** "higher" → bigger is better. "lower" → smaller is better. */
  better: "higher" | "lower";
  icon: LucideIcon;
  category: "Financial" | "Capacity" | "Throughput" | "Quality";
};

export const KPI_CATALOG: Kpi[] = [
  {
    slug: "cost-per-case",
    label: "Cost per Case",
    current: 14760,
    target: 12000,
    unit: "USD",
    better: "lower",
    icon: DollarSign,
    category: "Financial",
  },
  {
    slug: "bed-utilization",
    label: "Bed Utilization",
    current: 78,
    target: 85,
    unit: "%",
    better: "higher",
    icon: BedDouble,
    category: "Capacity",
  },
  {
    slug: "or-throughput",
    label: "OR Throughput",
    current: 4.1,
    target: 5.0,
    unit: "cases/day",
    better: "higher",
    icon: Gauge,
    category: "Throughput",
  },
  {
    slug: "length-of-stay",
    label: "Length of Stay",
    current: 4.6,
    target: 4.2,
    unit: "days",
    better: "lower",
    icon: Activity,
    category: "Quality",
  },
  {
    slug: "readmission-rate",
    label: "Readmission Rate",
    current: 11.2,
    target: 9.5,
    unit: "%",
    better: "lower",
    icon: RotateCcw,
    category: "Quality",
  },
  {
    slug: "discharge-before-noon",
    label: "Discharge Before Noon",
    current: 31,
    target: 55,
    unit: "%",
    better: "higher",
    icon: Clock,
    category: "Throughput",
  },
];

/** Absolute % deviation from target. */
export function deviationPct(k: Kpi): number {
  if (k.target === 0) return 0;
  return Math.abs((k.current - k.target) / k.target) * 100;
}

/** Signed % deviation: positive = above target, negative = below. */
export function signedDeviationPct(k: Kpi): number {
  if (k.target === 0) return 0;
  return ((k.current - k.target) / k.target) * 100;
}

export type Status = "green" | "yellow" | "red";

/** Status by deviation from target, regardless of direction. */
export function statusFor(k: Kpi): Status {
  const d = deviationPct(k);
  if (d <= 10) return "green";
  if (d <= 20) return "yellow";
  return "red";
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

export function formatValue(k: Kpi, value: number = k.current): string {
  if (k.unit === "USD") return `$${formatNumber(value)}`;
  if (k.unit === "%") return `${formatNumber(value)}%`;
  return `${formatNumber(value)} ${k.unit}`;
}

export function formatTarget(k: Kpi): string {
  return formatValue(k, k.target);
}

/** Generate a deterministic 30-day trend ending at current. */
export function trendFor(k: Kpi): { day: number; value: number }[] {
  const days = 30;
  const start = k.current * (k.better === "higher" ? 0.85 : 1.18);
  // simple seeded noise
  let seed = k.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const out: { day: number; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);
    const base = start + (k.current - start) * t;
    const noise = (rand() - 0.5) * (k.current * 0.04);
    out.push({ day: i + 1, value: +(base + noise).toFixed(2) });
  }
  out[out.length - 1].value = k.current;
  return out;
}
