/** Loading state for the KPI stack. Rendered during initial load and on role switch. */
export function KpiStackSkeleton() {
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
