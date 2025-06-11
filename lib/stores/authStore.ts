import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Internal setters
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    // Auth state change listener will handle the rest
  },

  signUp: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    // Auth state change listener will handle the rest
  },

  signInWithGoogle: async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) throw error;
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));

// Auth state listener
if (typeof window !== "undefined") {
  const supabase = createClient();

  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setUser, setProfile, setLoading } = useAuthStore.getState();

    if (session?.user) {
      setUser(session.user);

      // Fetch user profile
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, is_admin, onboarding_completed")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    } else {
      setUser(null);
      setProfile(null);
    }

    setLoading(false);
  });

  // Initial session check
  supabase.auth.getSession().then(({ data: { session } }) => {
    // The onAuthStateChange will handle this
  });
}
