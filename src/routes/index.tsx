import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  KPI_CATALOG,
  aggregateHealth,
  formatDelta,
  formatExposure,
  formatTarget,
  formatValue,
  gapPct,
  headlineFor,
  rankByGap,
  type Kpi,
} from "@/lib/kpi-catalog";

export const Route = createFileRoute("/")({
  component: Overview,
  head: () => ({
    meta: [
      { title: "Overview — Healthcare Ops Advisor" },
      {
        name: "description",
        content:
          "High-signal operational overview: top priority KPI, what needs attention, and one-click AI action plans.",
      },
    ],
  }),
});

function Overview() {
  const health = aggregateHealth(KPI_CATALOG);
  const ranked = rankByGap(KPI_CATALOG);
  const hero = ranked[0]; // worst-performing
  const needsAttention = rankByGap(health.offTarget);
  const onTrack = health.onTarget;

  const banner = healthBanner(health.status);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ---------- Health banner ---------- */}
        <div
          className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 ${banner.wrap}`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2.5 ${banner.iconWrap}`}>
              <banner.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Q3 2026 · Ops Health
              </p>
              <p className="text-base font-semibold leading-tight text-foreground">
                {banner.label}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <Stat label="Off target" value={`${health.offTarget.length} of ${KPI_CATALOG.length}`} />
            {health.exposureUsd > 0 && (
              <Stat label="Est. exposure" value={`${formatExposure(health.exposureUsd)} / qtr`} />
            )}
          </div>
        </div>

        {/* ---------- Hero priority ---------- */}
        {hero && gapPct(hero) < 95 ? (
          <HeroCard kpi={hero} />
        ) : (
          <AllClearCard />
        )}

        {/* ---------- Triage ---------- */}
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Needs attention ({needsAttention.length})
                  </h2>
                </div>
                {needsAttention.length > 0 && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/recommendations" search={{ focus: "off-target" }}>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      AI plan for all
                    </Link>
                  </Button>
                )}
              </div>
              {needsAttention.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing flagged. All KPIs are within 5% of target.
                </p>
              ) : (
                <ul className="space-y-2">
                  {needsAttention.map((k) => (
                    <AttentionRow key={k.slug} kpi={k} isHero={k.slug === hero?.slug} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  On track ({onTrack.length})
                </h2>
              </div>
              {onTrack.length === 0 ? (
                <p className="text-sm text-muted-foreground">No KPIs on target yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {onTrack.map((k) => (
                    <li
                      key={k.slug}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/60" />
                        {k.label}
                      </span>
                      <span className="text-xs">{formatValue(k)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function HeroCard({ kpi }: { kpi: Kpi }) {
  const pct = gapPct(kpi);
  const severity = pct < 80 ? "critical" : "warn";
  const borderColor =
    severity === "critical" ? "border-l-destructive" : "border-l-amber-500";

  return (
    <Card className={`relative overflow-hidden border-l-4 ${borderColor}`}>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="destructive" className="uppercase tracking-wide">
                Top priority
              </Badge>
              <span className="text-xs text-muted-foreground">
                Largest gap to target
              </span>
            </div>
            <h2 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
              {headlineFor(kpi)}
            </h2>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                Actual{" "}
                <span className="font-semibold text-foreground">{formatValue(kpi)}</span>
              </span>
              <span className="text-muted-foreground">
                Target{" "}
                <span className="font-semibold text-foreground">{formatTarget(kpi)}</span>
              </span>
              <span className="font-semibold text-destructive">{formatDelta(kpi)}</span>
            </div>
          </div>
          <Button asChild size="lg">
            <Link to="/recommendations" search={{ focus: kpi.slug }}>
              <Sparkles className="mr-2 h-4 w-4" />
              Get action plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Progress to target</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </CardContent>
    </Card>
  );
}

function AllClearCard() {
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">All KPIs on target</h2>
            <p className="text-sm text-muted-foreground">
              Nothing critical to act on right now.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/recommendations">
            Open Recommendations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AttentionRow({ kpi, isHero }: { kpi: Kpi; isHero: boolean }) {
  const pct = gapPct(kpi);
  const Icon = kpi.icon;
  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {kpi.label}
              {isHero && (
                <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-destructive">
                  · top priority
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatValue(kpi)} vs {formatTarget(kpi)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-destructive">{formatDelta(kpi)}</span>
          <Button asChild size="sm" variant="ghost">
            <Link to="/recommendations" search={{ focus: kpi.slug }}>
              Plan
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <Progress value={pct} className="h-1.5" />
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function healthBanner(status: "healthy" | "watch" | "needs-attention") {
  if (status === "needs-attention") {
    return {
      label: "Needs attention",
      Icon: AlertTriangle,
      wrap: "border-destructive/30 bg-destructive/5",
      iconWrap: "bg-destructive/10 text-destructive",
    };
  }
  if (status === "watch") {
    return {
      label: "Watch",
      Icon: AlertTriangle,
      wrap: "border-amber-500/30 bg-amber-500/5",
      iconWrap: "bg-amber-500/10 text-amber-600",
    };
  }
  return {
    label: "Healthy",
    Icon: ShieldCheck,
    wrap: "border-emerald-500/30 bg-emerald-500/5",
    iconWrap: "bg-emerald-500/10 text-emerald-600",
  };
}
