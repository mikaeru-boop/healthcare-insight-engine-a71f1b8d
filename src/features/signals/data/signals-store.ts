import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Signal data layer.
 * Reads `signals` joined with `signal_history` and `signal_action_log` from
 * Supabase. Mutations update the signal's status and append an action-log
 * entry; React Query then refetches so any subscriber re-renders in sync.
 */

export type SignalStatus = "active" | "in-progress" | "resolved" | "escalated";

export type ActionLogEntry = {
  timestamp: string;
  actor: string;
  role: string;
  action: string;
};

export type HistoryInstance = {
  date: string;
  summary: string;
  outcome: string;
};

export type SignalRecord = {
  id: string;
  metricSlug: string;
  priority: number;
  status: SignalStatus;
  signal: string;
  impact: string;
  nextAction: string;
  detectedAt: string;
  history: HistoryInstance[];
  actionLog: ActionLogEntry[];
};

export const PRIORITY_DOT: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-400",
};

export const signalsQueryKey = ["signals"] as const;

async function fetchSignals(): Promise<SignalRecord[]> {
  const { data, error } = await supabase
    .from("signals")
    .select(
      `id, metric_slug, priority, status, signal, impact, next_action, detected_at, created_at,
       signal_history ( date, summary, outcome, sort_order ),
       signal_action_log ( timestamp, actor, role, action, created_at )`,
    )
    .order("priority", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row): SignalRecord => {
    const history = ((row.signal_history as Array<HistoryInstance & { sort_order?: number }>) ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(({ date, summary, outcome }) => ({ date, summary, outcome }));
    const actionLog = ((row.signal_action_log as (ActionLogEntry & { created_at: string })[]) ?? [])
      .slice()
      .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
      .map(({ timestamp, actor, role, action }) => ({ timestamp, actor, role, action }));
    return {
      id: row.id,
      metricSlug: row.metric_slug,
      priority: row.priority,
      status: row.status as SignalStatus,
      signal: row.signal,
      impact: row.impact,
      nextAction: row.next_action,
      detectedAt: row.detected_at,
      history,
      actionLog,
    };
  });
}

/** Returns the full signal list. Empty array while loading or on error. */
export function useSignals(): SignalRecord[] {
  const q = useQuery({ queryKey: signalsQueryKey, queryFn: fetchSignals });
  return q.data ?? [];
}

/** Loading flag for skeleton states. */
export function useSignalsQuery() {
  return useQuery({ queryKey: signalsQueryKey, queryFn: fetchSignals });
}

/** Mutation: write status + append an action-log entry, then refetch. */
export function useLogSignalAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      newStatus: SignalStatus;
      entry: ActionLogEntry;
    }) => {
      const { error: updateErr } = await supabase
        .from("signals")
        .update({ status: vars.newStatus })
        .eq("id", vars.id);
      if (updateErr) throw updateErr;
      const { error: insertErr } = await supabase.from("signal_action_log").insert({
        signal_id: vars.id,
        timestamp: vars.entry.timestamp,
        actor: vars.entry.actor,
        role: vars.entry.role,
        action: vars.entry.action,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: signalsQueryKey });
    },
  });
}

/* ---------- Pure filter helpers ---------- */

export function activeSignals(list: SignalRecord[]): SignalRecord[] {
  return list.filter((s) => s.status === "active");
}
export function inProgressSignals(list: SignalRecord[]): SignalRecord[] {
  return list.filter((s) => s.status === "in-progress" || s.status === "escalated");
}
export function resolvedSignals(list: SignalRecord[]): SignalRecord[] {
  return list.filter((s) => s.status === "resolved");
}
