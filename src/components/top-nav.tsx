import { useState } from "react";
import { Sparkles, User } from "lucide-react";
import { roleLabel, useUserProfile } from "@/lib/user-profile";
import { ProfileModal } from "@/components/profile-modal";

export function TopNav({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  const profile = useUserProfile();
  const [open, setOpen] = useState(false);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {trailing}
        <button className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15">
          <Sparkles className="h-3.5 w-3.5" />
          Refresh insights
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-xs text-foreground transition-colors hover:border-primary/40"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <User className="h-3.5 w-3.5" />
          </span>
          <span className="text-left leading-tight">
            <span className="block font-medium text-foreground">{profile.name}</span>
            <span className="block text-[10px] text-muted-foreground">
              {roleLabel(profile.role)}
              {profile.department ? ` · ${profile.department}` : ""}
            </span>
          </span>
        </button>
      </div>
      <ProfileModal open={open} onOpenChange={setOpen} />
    </header>
  );
}
