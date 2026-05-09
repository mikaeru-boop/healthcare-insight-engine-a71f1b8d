import { Sparkles } from "lucide-react";

/** Loading state for the priority signal panel. */
export function PrioritySignalPanelSkeleton() {
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
