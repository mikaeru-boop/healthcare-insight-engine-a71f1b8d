import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHydrated, useUserProfile } from "@/lib/user-profile";

export function useRequireRole() {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !profile.role) {
      navigate({ to: "/role-select" });
    }
  }, [hydrated, profile.role, navigate]);
}
