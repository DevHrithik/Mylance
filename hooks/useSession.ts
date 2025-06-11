"use client";

import { useAuthStore } from "@/lib/stores/authStore";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook for accessing session state from the Zustand auth store
 * This provides the most up-to-date auth state
 */
export function useSession() {
  const { user, profile, loading } = useAuthStore();

  return {
    user,
    session: user ? { user } : null, // Simplified session object
    isLoading: loading,
    error: null, // Auth store doesn't track errors currently
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin ?? false,
    hasCompletedOnboarding: profile?.onboarding_completed ?? false,
    profile,
    signOut: useAuthStore.getState().signOut,
    refreshSession: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session;
    },
  };
}
