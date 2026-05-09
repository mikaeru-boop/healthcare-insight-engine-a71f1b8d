import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { roleLabel, ROLES } from "@/lib/user-profile";
import { useRequireRole } from "@/hooks/use-require-role";
import {
  KPI_CATALOG,
  formatTarget,
  formatValue,
  signedDeviationPct,
  statusFor,
} from "@/lib/kpi-catalog";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
  head: () => ({
    meta: [{ title: "Welcome — Healthcare Ops Advisor" }],
  }),
});

function WelcomePage() {
  const navigate = useNavigate();
  const { hydrated, profile } = useRequireRole();

  if (!hydrated || !profile.role) {
    return <div className="min-h-screen bg-background" />;
  }

  const roleConfig = ROLES.find((r) => r.id === profile.role)!;
  const focusKpis = roleConfig.focusSlugs
    .map((slug) => KPI_CATALOG.find((k) => k.slug === slug))
    .filter(Boolean) as typeof KPI_CATALOG;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            Welcome back
          </span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {profile.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">{roleLabel(profile.role)}</span>
          {profile.department && (
            <>
              {" "}
              · <span className="text-foreground">{profile.department}</span>
            </>
          )}
          .{" "}
          <Link to="/role-select" className="text-primary hover:underline">
            Not you?
          </Link>
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Your top 3 focus areas today
            </h2>
          </div>

          <ol className="space-y-3">
            {focusKpis.map((k, i) => {
              const status = statusFor(k);
              const dev = signedDeviationPct(k);
              const dot =
                status === "red"
                  ? "bg-red-500"
                  : status === "yellow"
                    ? "bg-amber-500"
                    : "bg-emerald-500";
              return (
                <li
                  key={k.slug}
                  className="flex items-center gap-4 rounded-xl border border-border bg-background p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
                      <p className="truncate text-sm font-semibold text-foreground">
                        {k.label}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Current {formatValue(k)} · Target {formatTarget(k)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      Math.abs(dev) > 10 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {dev > 0 ? "+" : ""}
                    {dev.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Open dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
