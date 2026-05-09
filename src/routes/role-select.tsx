import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { RolePicker } from "@/features/profile/components/role-picker";
import { setProfile, useUserProfile } from "@/features/profile/data/user-profile";

export const Route = createFileRoute("/role-select")({
  component: RoleSelectPage,
  head: () => ({
    meta: [{ title: "Choose your role — Healthcare Ops Advisor" }],
  }),
});

function RoleSelectPage() {
  const navigate = useNavigate();
  const profile = useUserProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            Healthcare Ops Advisor
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Pick your role
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll prioritize signals and metrics for the work you actually own.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <RolePicker
            initialRole={profile.role}
            initialDepartment={profile.department}
            ctaLabel="Continue"
            onSubmit={(role, department) => {
              setProfile({ role, department });
              navigate({ to: "/welcome" });
            }}
          />
        </div>
      </div>
    </div>
  );
}
