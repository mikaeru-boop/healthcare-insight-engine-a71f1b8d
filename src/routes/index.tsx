import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  DollarSign,
  Gauge,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "Overview — Healthcare Ops Advisor" },
      {
        name: "description",
        content:
          "Operational overview of cost, utilization, and throughput KPIs across the organization.",
      },
    ],
  }),
});

type Kpi = {
  label: string;
  value: string;
  current: number;
  target: number;
  unit: string;
  better: "higher" | "lower";
  icon: typeof Activity;
};

const KPIS: Kpi[] = [
  {
    label: "OR Utilization",
    value: "68%",
    current: 68,
    target: 82,
    unit: "%",
    better: "higher",
    icon: Gauge,
  },
  {
    label: "Avg Length of Stay",
    value: "5.4 days",
    current: 5.4,
    target: 4.2,
    unit: "days",
    better: "lower",
    icon: Activity,
  },
  {
    label: "Cost per Discharge",
    value: "$12,450",
    current: 12450,
    target: 10800,
    unit: "USD",
    better: "lower",
    icon: DollarSign,
  },
  {
    label: "ED Throughput",
    value: "2.1 pts/hr",
    current: 2.1,
    target: 3.0,
    unit: "pts/hr",
    better: "higher",
    icon: TrendingUp,
  },
];

function gapPct(k: Kpi) {
  // % progress toward target (0–100, clamped)
  const pct =
    k.better === "higher"
      ? (k.current / k.target) * 100
      : (k.target / k.current) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function status(k: Kpi): { label: string; tone: "good" | "warn" | "bad" } {
  const p = gapPct(k);
  if (p >= 95) return { label: "On target", tone: "good" };
  if (p >= 80) return { label: "Near target", tone: "warn" };
  return { label: "Off target", tone: "bad" };
}

function Overview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground">
              Cost, utilization, and throughput at a glance — Q3 2026.
            </p>
          </div>
          <Button asChild>
            <Link to="/recommendations">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate recommendations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => {
            const Icon = k.icon;
            const s = status(k);
            const trendUp = k.better === "higher" ? k.current >= k.target : k.current <= k.target;
            return (
              <Card key={k.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{k.label}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{k.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Target {k.target}
                      {k.unit === "%" ? "%" : ` ${k.unit}`}
                    </span>
                    <span
                      className={
                        trendUp ? "text-foreground" : "text-destructive"
                      }
                    >
                      {trendUp ? (
                        <TrendingUp className="inline h-3 w-3" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3" />
                      )}
                    </span>
                  </div>
                  <Progress value={gapPct(k)} />
                  <div className="mt-3">
                    <Badge
                      variant={
                        s.tone === "good"
                          ? "secondary"
                          : s.tone === "warn"
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {s.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>
              Send these KPIs to the advisor for a prioritized action list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/recommendations">
                Open Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
