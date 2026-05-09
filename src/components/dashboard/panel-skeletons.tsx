import { Sparkles } from "lucide-react";

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

export function AiPanelSkeleton() {
  return (
    <aside className="dark rounded-2xl border border-border bg-[oklch(0.18_0.03_270)] p-5 text-foreground shadow-[0_8px_24px_-8px_rgba(16,24,40,0.25)]">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="mb-5 h-3 w-32 animate-pulse rounded bg-muted/30" />
      <ul className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl border border-border bg-card/40 p-4"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted/40" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted/30" />
            <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted/30" />
          </li>
        ))}
      </ul>
    </aside>
  );
}
