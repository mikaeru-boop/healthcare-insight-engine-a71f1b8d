import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, User as UserIcon, Mail, Building2, BadgeCheck } from "lucide-react";
import { roleLabel, setProfile, useUserProfile, type Role } from "@/lib/user-profile";
import { RolePicker } from "@/components/role-picker";

export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const profile = useUserProfile();
  const [editing, setEditing] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setEditing(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile & settings</DialogTitle>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {profile.email}
                </p>
              </div>
            </div>

            <Row label="Role" icon={<BadgeCheck className="h-3.5 w-3.5" />} value={roleLabel(profile.role)} />
            {profile.role === "department-director" && (
              <Row
                label="Department"
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={profile.department ?? "—"}
              />
            )}

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit role
            </button>
          </div>
        ) : (
          <RolePicker
            initialRole={profile.role}
            initialDepartment={profile.department}
            ctaLabel="Save"
            onSubmit={(role: Role, department) => {
              setProfile({ role, department });
              setEditing(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
