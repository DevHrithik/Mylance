import { createClient } from "@/lib/supabase/client";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

/**
 * Simple auth utility that reads user data directly from cookie token
 */
export class SimpleAuth {
  private static instance: SimpleAuth;
  private cachedUser: UserData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): SimpleAuth {
    if (!SimpleAuth.instance) {
      SimpleAuth.instance = new SimpleAuth();
    }
    return SimpleAuth.instance;
  }

  /**
   * Get user ID directly from the token without session validation
   */
  private getUserIdFromToken(): string | null {
    if (typeof window === "undefined") return null;

    try {
      // Check all localStorage keys for Supabase auth data
      const allKeys = Object.keys(localStorage);

      // Look for the main Supabase auth token - it's usually named like:
      // sb-[project-ref]-auth-token
      for (const key of allKeys) {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const tokenData = localStorage.getItem(key);
          if (!tokenData) continue;

          try {
            const parsed = JSON.parse(tokenData);
            if (parsed?.user?.id) {
              return parsed.user.id;
            }
          } catch (e) {
            console.warn("Error parsing token data:", e);
            continue;
          }
        }
      }

      // Fallback: try to get session directly from Supabase client
      return null;
    } catch (error) {
      console.warn("Error reading user ID from token:", error);
      return null;
    }
  }

  /**
   * Get user data using cached approach or fresh fetch
   */
  async getUserData(): Promise<UserData | null> {
    // Check cache first
    const now = Date.now();
    if (this.cachedUser && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cachedUser;
    }

    // Try token first
    const userId = this.getUserIdFromToken();

    // If no token, try getting session from Supabase directly
    if (!userId) {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          this.cachedUser = null;
          return null;
        }

        // Use session user ID
        const sessionUserId = session.user.id;
        return await this.fetchUserProfile(sessionUserId);
      } catch (error) {
        console.warn("Error getting session:", error);
        this.cachedUser = null;
        return null;
      }
    }

    return await this.fetchUserProfile(userId);
  }

  /**
   * Fetch user profile from database
   */
  private async fetchUserProfile(userId: string): Promise<UserData | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_admin, onboarding_completed")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.warn("Error fetching user profile:", error);
        this.cachedUser = null;
        return null;
      }

      this.cachedUser = data;
      this.cacheTimestamp = Date.now();
      return data;
    } catch (error) {
      console.warn("Error in fetchUserProfile:", error);
      this.cachedUser = null;
      return null;
    }
  }

  /**
   * Check if user is authenticated (has valid token or session)
   */
  async isAuthenticated(): Promise<boolean> {
    // First check token
    const userId = this.getUserIdFromToken();
    if (userId) return true;

    // Fallback to session check
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session?.user;
    } catch {
      return false;
    }
  }

  /**
   * Get user ID synchronously from token (for quick checks)
   */
  getUserId(): string | null {
    return this.getUserIdFromToken();
  }

  /**
   * Clear cache (useful after logout or profile updates)
   */
  clearCache(): void {
    this.cachedUser = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Simple logout - just clear tokens and reload
   */
  async logout(): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Error during logout:", error);
    }

    this.clearCache();

    // Clear all auth tokens
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage).filter(
        (key) => key.startsWith("sb-") || key.includes("supabase")
      );
      keys.forEach((key) => localStorage.removeItem(key));

      // Redirect to login
      window.location.href = "/login";
    }
  }
}

export const simpleAuth = SimpleAuth.getInstance();
