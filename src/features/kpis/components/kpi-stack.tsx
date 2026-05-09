import {
  formatTarget,
  formatValue,
  statusFor,
  useKpis,
  type Kpi,
  type Status,
} from "@/features/kpis/data/kpi-catalog";

/**
 * Left column of the dashboard: scannable list of all KPIs with status dots.
 * Selecting a tile sets the active metric for the center MetricDetailCard.
 */
export function KpiStack({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  const { data: kpis = [] } = useKpis();
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <h2 className="text-sm font-semibold text-foreground">Metrics</h2>
        <span className="text-[11px] text-muted-foreground">{kpis.length} tracked</span>
      </div>
      <div className="space-y-1">
        {kpis.map((k: Kpi) => {
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

export function StatusDot({ status }: { status: Status }) {
  const color =
    status === "green"
      ? "bg-emerald-500"
      : status === "yellow"
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} aria-label={status} />;
}
