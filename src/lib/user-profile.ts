import { useSyncExternalStore } from "react";

export type Role = "vp-operations" | "cfo" | "department-director";

export const ROLES: { id: Role; label: string; blurb: string; focusSlugs: string[] }[] = [
  {
    id: "vp-operations",
    label: "VP of Operations",
    blurb: "Throughput, capacity, and discharge flow across the system.",
    focusSlugs: ["discharge-before-noon", "or-throughput", "bed-utilization"],
  },
  {
    id: "cfo",
    label: "CFO",
    blurb: "Cost per case, length of stay, and financial impact of operations.",
    focusSlugs: ["cost-per-case", "length-of-stay", "readmission-rate"],
  },
  {
    id: "department-director",
    label: "Department Director",
    blurb: "Department-level metrics and frontline operational signals.",
    focusSlugs: ["or-throughput", "length-of-stay", "discharge-before-noon"],
  },
];

export const DEPARTMENTS = [
  "Emergency",
  "Surgical Services",
  "Medical / Telemetry",
  "ICU / Critical Care",
  "Cardiology",
  "Oncology",
];

export type UserProfile = {
  role: Role | null;
  department: string | null;
  name: string;
  email: string;
};

const KEY = "hoa.profile.v1";
const DEFAULT: UserProfile = {
  role: null,
  department: null,
  name: "Dr. Reynolds",
  email: "m.reynolds@stmichael.health",
};

const listeners = new Set<() => void>();
let cache: UserProfile | null = null;

function read(): UserProfile {
  if (typeof window === "undefined") return DEFAULT;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

function write(p: UserProfile) {
  cache = p;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  }
  listeners.forEach((l) => l());
}

export function setProfile(patch: Partial<UserProfile>) {
  write({ ...read(), ...patch });
}

export function clearProfile() {
  write({ ...DEFAULT });
}

export function useUserProfile(): UserProfile {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => DEFAULT,
  );
}

/** Returns true once mounted on client (avoids SSR hydration mismatch). */
export function useHydrated(): boolean {
  const sub = (cb: () => void) => {
    cb();
    return () => {};
  };
  return useSyncExternalStore(
    sub,
    () => true,
    () => false,
  );
}

export function roleLabel(r: Role | null): string {
  return ROLES.find((x) => x.id === r)?.label ?? "Unassigned";
}

