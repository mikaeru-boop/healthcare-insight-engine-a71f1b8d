import {
  Activity,
  BedDouble,
  Clock,
  DollarSign,
  Gauge,
  RotateCcw,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * KPI data layer.
 * - Pure helpers (deviation, status, formatting, trend) stay here.
 * - The KPI list itself is fetched from Supabase via `useKpis()`.
 */

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

const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  BedDouble,
  Gauge,
  Activity,
  RotateCcw,
  Clock,
};

function rowToKpi(r: {
  slug: string;
  label: string;
  current_value: number;
  target_value: number;
  unit: string;
  better: string;
  category: string;
  icon: string;
}): Kpi {
  return {
    slug: r.slug,
    label: r.label,
    current: Number(r.current_value),
    target: Number(r.target_value),
    unit: r.unit,
    better: (r.better as "higher" | "lower") ?? "higher",
    category: r.category as Kpi["category"],
    icon: ICON_MAP[r.icon] ?? HelpCircle,
  };
}

export const kpisQueryKey = ["kpis"] as const;

async function fetchKpis(): Promise<Kpi[]> {
  const { data, error } = await supabase
    .from("kpis")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToKpi);
}

export function useKpis() {
  return useQuery({ queryKey: kpisQueryKey, queryFn: fetchKpis });
}

/* ---------- Pure helpers (unchanged) ---------- */

export function deviationPct(k: Kpi): number {
  if (k.target === 0) return 0;
  return Math.abs((k.current - k.target) / k.target) * 100;
}

export function signedDeviationPct(k: Kpi): number {
  if (k.target === 0) return 0;
  return ((k.current - k.target) / k.target) * 100;
}

export type Status = "green" | "yellow" | "red";

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

export function trendFor(k: Kpi): { day: number; value: number }[] {
  const days = 30;
  const start = k.current * (k.better === "higher" ? 0.85 : 1.18);
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
