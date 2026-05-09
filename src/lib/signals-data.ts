import { useSyncExternalStore } from "react";

export type SignalStatus = "active" | "in-progress" | "resolved" | "escalated";

export type ActionLogEntry = {
  timestamp: string; // human-readable
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


export const SIGNALS: SignalRecord[] = [
  {
    id: "sig-001",
    metricSlug: "discharge-before-noon",
    priority: 1,
    status: "active",
    signal:
      "Discharge Before Noon is 43.6% below target and has not improved in 30 days.",
    impact:
      "Afternoon bed pressure is increasing, raising ED boarding risk across the facility.",
    nextAction:
      "Pull late discharge data by attending physician and schedule a review with case management this week.",
    detectedAt: "May 2, 2026 · 8:04 AM",
    history: [
      {
        date: "Apr 4, 2026",
        summary: "Same signal raised — 39% below target for 14 consecutive days.",
        outcome: "Acknowledged. No corrective action logged.",
      },
      {
        date: "Mar 11, 2026",
        summary: "Discharge Before Noon dropped below 35% for the first time in Q1.",
        outcome: "Routed to Care Management. Closed without resolution.",
      },
      {
        date: "Feb 17, 2026",
        summary: "First flagged at 41% (target 55%).",
        outcome: "Resolved after 9 days following weekend rounding pilot.",
      },
    ],
    actionLog: [
      {
        timestamp: "May 2, 2026 · 8:04 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal raised at priority 1.",
      },
    ],
  },
  {
    id: "sig-002",
    metricSlug: "cost-per-case",
    priority: 2,
    status: "in-progress",
    signal: "Cost per Case is 23% above the $12,000 target.",
    impact:
      "At current volume, this gap represents unplanned spend that compounds each week without intervention.",
    nextAction:
      "Pull case-level cost breakdown for the top 3 service lines before the next ops review.",
    detectedAt: "Apr 28, 2026 · 7:12 AM",
    history: [
      {
        date: "Mar 30, 2026",
        summary: "Cost per Case crossed 20% above target for the first time in FY26.",
        outcome: "Resolved May 1 after orthopedic implant contract renegotiation.",
      },
    ],
    actionLog: [
      {
        timestamp: "Apr 28, 2026 · 7:12 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal raised at priority 2.",
      },
      {
        timestamp: "Apr 29, 2026 · 9:40 AM",
        actor: "J. Alvarez",
        role: "CFO",
        action: "Acknowledged. Requested service-line cost breakdown.",
      },
      {
        timestamp: "May 1, 2026 · 2:15 PM",
        actor: "K. Liu",
        role: "Finance Analyst",
        action: "Uploaded service-line breakdown for Cardio, Ortho, Neuro.",
      },
    ],
  },
  {
    id: "sig-003",
    metricSlug: "or-throughput",
    priority: 3,
    status: "in-progress",
    signal:
      "OR Throughput is down 18% from the prior 30-day period at 4.1 cases per day against a target of 5.",
    impact:
      "Each case lost per day reduces weekly OR revenue and increases scheduling backlog.",
    nextAction:
      "Review first-case start time logs for the past 4 weeks and flag rooms with more than 3 late starts.",
    detectedAt: "Apr 24, 2026 · 6:50 AM",
    history: [
      {
        date: "Jan 9, 2026",
        summary: "OR Throughput briefly dropped to 4.3 after winter staffing gap.",
        outcome: "Resolved within 11 days following block schedule revision.",
      },
    ],
    actionLog: [
      {
        timestamp: "Apr 24, 2026 · 6:50 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal raised at priority 3.",
      },
      {
        timestamp: "Apr 25, 2026 · 11:20 AM",
        actor: "S. Patel",
        role: "VP of Operations",
        action: "Assigned to OR Director for first-case start audit.",
      },
    ],
  },
  {
    id: "sig-r01",
    metricSlug: "readmission-rate",
    priority: 2,
    status: "resolved",
    signal: "30-day Readmission Rate exceeded 12% for cardiac patients.",
    impact: "Increased CMS penalty exposure for the next reporting period.",
    nextAction: "Resolved after rollout of post-discharge call program.",
    detectedAt: "Mar 14, 2026 · 9:30 AM",
    history: [
      {
        date: "Nov 3, 2025",
        summary: "Cardiac readmission spike during respiratory season.",
        outcome: "Resolved after 18 days.",
      },
      {
        date: "Mar 14, 2026",
        summary: "Repeat spike, sustained 3 weeks.",
        outcome: "Resolved Apr 21 after post-discharge call program rollout.",
      },
    ],
    actionLog: [
      {
        timestamp: "Mar 14, 2026 · 9:30 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal raised.",
      },
      {
        timestamp: "Mar 18, 2026 · 1:05 PM",
        actor: "Dr. M. Reynolds",
        role: "Department Director",
        action: "Approved post-discharge call program pilot.",
      },
      {
        timestamp: "Apr 21, 2026 · 4:45 PM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal closed — readmission rate returned to 9.4%.",
      },
    ],
  },
  {
    id: "sig-l01",
    metricSlug: "length-of-stay",
    priority: 3,
    status: "resolved",
    signal: "Average Length of Stay drifted 0.6 days above target for medical units.",
    impact: "Reduced inpatient capacity during peak admission periods.",
    nextAction: "Resolved after geriatric consult workflow update.",
    detectedAt: "Feb 8, 2026 · 7:48 AM",
    history: [
      {
        date: "Feb 8, 2026",
        summary: "ALOS at 4.9 days against 4.2 target.",
        outcome: "Resolved Mar 2 after geriatric consult workflow update.",
      },
    ],
    actionLog: [
      {
        timestamp: "Feb 8, 2026 · 7:48 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal raised.",
      },
      {
        timestamp: "Mar 2, 2026 · 10:10 AM",
        actor: "Ops Advisor (AI)",
        role: "System",
        action: "Signal closed.",
      },
    ],
  },
];

/* ---------- Reactive store ---------- */

let signalState: SignalRecord[] = SIGNALS;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSignals(): SignalRecord[] {
  return useSyncExternalStore(subscribe, () => signalState, () => signalState);
}

export function getSignalById(id: string): SignalRecord | undefined {
  return signalState.find((s) => s.id === id);
}

export function logSignalAction(
  id: string,
  newStatus: SignalStatus,
  entry: ActionLogEntry,
) {
  signalState = signalState.map((s) =>
    s.id === id
      ? { ...s, status: newStatus, actionLog: [...s.actionLog, entry] }
      : s,
  );
  listeners.forEach((l) => l());
}

export function activeSignals(list: SignalRecord[] = signalState): SignalRecord[] {
  return list.filter((s) => s.status === "active");
}
export function inProgressSignals(
  list: SignalRecord[] = signalState,
): SignalRecord[] {
  return list.filter((s) => s.status === "in-progress" || s.status === "escalated");
}
export function resolvedSignals(
  list: SignalRecord[] = signalState,
): SignalRecord[] {
  return list.filter((s) => s.status === "resolved");
}
