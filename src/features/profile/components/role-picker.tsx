import { useState } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { ROLES, DEPARTMENTS, type Role } from "@/features/profile/data/user-profile";

export function RolePicker({
  initialRole,
  initialDepartment,
  ctaLabel = "Continue",
  onSubmit,
}: {
  initialRole?: Role | null;
  initialDepartment?: string | null;
  ctaLabel?: string;
  onSubmit: (role: Role, department: string | null) => void;
}) {
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [department, setDepartment] = useState<string | null>(
    initialDepartment ?? null,
  );

  const needsDept = role === "department-director";
  const canSubmit = role !== null && (!needsDept || !!department);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {ROLES.map((r) => {
          const active = r.id === role;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{r.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
              </div>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          );
        })}
      </div>

      {needsDept && (
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> Department
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEPARTMENTS.map((d) => {
              const active = d === department;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepartment(d)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => role && onSubmit(role, needsDept ? department : null)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {ctaLabel} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
