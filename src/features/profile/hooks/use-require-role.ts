import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHydrated, useUserProfile } from "@/features/profile/data/user-profile";

/**
 * Gate hook for routes that require a chosen role.
 * Redirects to /role-select when the profile has no role.
 * Returns hydration + profile so consumers don't need to call them again.
 */
export function useRequireRole() {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !profile.role) {
      navigate({ to: "/role-select" });
    }
  }, [hydrated, profile.role, navigate]);

  return { hydrated, profile };
}
