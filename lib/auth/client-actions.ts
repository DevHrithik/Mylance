import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

// Configuration - set to false to use email/password auth
export const USE_MAGIC_LINK = false;

export const clientAuth = {
  signUp: async (email: string, password?: string) => {
    const supabase = createClient();

    if (USE_MAGIC_LINK) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) throw new Error(error.message);
    } else {
      if (!password) {
        throw new Error("Password is required");
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw new Error(error.message);
    }
  },

  signIn: async (email: string, password?: string) => {
    const supabase = createClient();

    if (USE_MAGIC_LINK) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    } else {
      if (!password) {
        throw new Error("Password is required");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    }
  },

  signOut: async () => {
    // Use the auth store's signOut method which handles everything
    await useAuthStore.getState().signOut();
  },

  getSession: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  getUser: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  getUserProfile: async () => {
    const { user, profile } = useAuthStore.getState();

    if (!profile) {
      if (!user) {
        throw new Error("No authenticated user");
      }
      throw new Error("Profile not loaded");
    }

    return profile;
  },

  // Check if user is admin
  isAdmin: async () => {
    const { profile } = useAuthStore.getState();
    return profile?.is_admin ?? false;
  },

  // Refresh session
  refreshSession: async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(error.message);
    return data.session;
  },
};

// Backward compatibility exports
export const signIn = clientAuth.signIn;
export const signUp = clientAuth.signUp;
export const signOut = clientAuth.signOut;
export const getSession = clientAuth.getSession;
export const getUser = clientAuth.getUser;

// Alias for backward compatibility
export const logout = clientAuth.signOut;
