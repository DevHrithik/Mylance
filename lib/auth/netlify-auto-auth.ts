import { createClient } from "@/lib/supabase/client";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: number;
}

type AuthListener = (state: AuthState) => void;

export class NetlifyAutoAuth {
  private static instance: NetlifyAutoAuth;
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    lastChecked: 0,
  };
  private listeners: AuthListener[] = [];
  private initialized = false;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache (increased from 30 seconds)
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pendingCheck = false;

  static getInstance(): NetlifyAutoAuth {
    if (!NetlifyAutoAuth.instance) {
      NetlifyAutoAuth.instance = new NetlifyAutoAuth();
    }
    return NetlifyAutoAuth.instance;
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    // Debounce listener notifications to prevent excessive re-renders
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.listeners.forEach((listener) => listener(this.state));
    }, 16); // ~60fps debounce
  }

  private updateState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates, lastChecked: Date.now() };
    this.notifyListeners();
  }

  getState(): AuthState {
    return { ...this.state };
  }

  // Check if we have cached valid state
  private isCacheValid(): boolean {
    const now = Date.now();
    const cacheAge = now - this.state.lastChecked;
    return cacheAge < this.cacheTimeout && this.state.lastChecked > 0;
  }

  // Clear browser storage on logout to prevent stale sessions
  private clearBrowserStorage() {
    if (typeof window === "undefined") return;

    try {
      // Clear all Supabase-related localStorage items
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.includes("auth-token") ||
          key.includes("refresh-token") ||
          key.includes("access-token")
        ) {
          localStorage.removeItem(key);
          console.log(`NetlifyAutoAuth: Cleared localStorage key: ${key}`);
        }
      });

      // Clear all sessionStorage items
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.includes("auth-token") ||
          key.includes("refresh-token") ||
          key.includes("access-token")
        ) {
          sessionStorage.removeItem(key);
          console.log(`NetlifyAutoAuth: Cleared sessionStorage key: ${key}`);
        }
      });

      // Clear auth-related cookies by setting them to expire
      const cookiesToClear = [
        "sb-access-token",
        "sb-refresh-token",
        "supabase-auth-token",
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
      ];

      cookiesToClear.forEach((cookieName) => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        // Also try clearing for the base domain
        const domain = window.location.hostname.split(".").slice(-2).join(".");
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
      });

      console.log("NetlifyAutoAuth: Browser storage cleared successfully");
    } catch (error) {
      console.warn("NetlifyAutoAuth: Error clearing browser storage:", error);
    }
  }

  // Initialize authentication with retry logic and better caching
  async initialize(forceRefresh = false): Promise<void> {
    // Prevent concurrent initialization
    if (this.pendingCheck) {
      return;
    }

    if (this.initialized && !forceRefresh && this.isCacheValid()) {
      return;
    }

    this.pendingCheck = true;

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    try {
      await this.performAuthCheck(0);
      this.initialized = true;
    } finally {
      this.pendingCheck = false;
    }
  }

  private async performAuthCheck(retryCount: number): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      this.updateState({ isLoading: true, error: null });

      console.log(
        `NetlifyAutoAuth: Starting auth check (attempt ${retryCount + 1})`
      );

      const supabase = createClient();

      // Check session first with longer timeout for better reliability
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 10000) // Increased to 10 seconds
      );

      const { data: sessionData, error: sessionError } = (await Promise.race([
        sessionPromise,
        timeoutPromise,
      ])) as any;

      if (sessionError) {
        // Check if it's a refresh token error
        if (
          sessionError.message?.includes("refresh_token_not_found") ||
          sessionError.message?.includes("Invalid Refresh Token") ||
          sessionError.code === "refresh_token_not_found"
        ) {
          console.log(
            "NetlifyAutoAuth: Refresh token expired, clearing session"
          );
          this.clearBrowserStorage();
          this.updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }
        throw new Error(`Session error: ${sessionError.message}`);
      }

      const session = sessionData?.session;

      if (!session?.user) {
        console.log("NetlifyAutoAuth: No session found");
        this.clearBrowserStorage();
        this.updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      console.log("NetlifyAutoAuth: Session found, fetching user profile");

      // Fetch user profile with timeout and error handling
      const profilePromise = supabase
        .from("profiles")
        .select(
          "id, email, first_name, full_name, is_admin, onboarding_completed"
        )
        .eq("id", session.user.id)
        .single();

      const profileTimeout = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Profile fetch timeout")), 8000) // 8 seconds timeout
      );

      const { data: profileData, error: profileError } = (await Promise.race([
        profilePromise,
        profileTimeout,
      ])) as any;

      if (profileError) {
        console.warn("NetlifyAutoAuth: Profile fetch error:", profileError);
        // Continue with basic user data if profile fetch fails
        const userData: UserData = {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || null,
          is_admin: false,
          onboarding_completed: false,
        };

        this.updateState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }

      const userData: UserData = {
        id: profileData.id,
        email: profileData.email || session.user.email || "",
        full_name: profileData.full_name || profileData.first_name,
        is_admin: profileData.is_admin || false,
        onboarding_completed: profileData.onboarding_completed || false,
      };

      console.log("NetlifyAutoAuth: User authenticated successfully:", {
        email: userData.email,
        isAdmin: userData.is_admin,
        onboardingCompleted: userData.onboarding_completed,
      });

      this.updateState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error(
        `NetlifyAutoAuth: Auth check failed (attempt ${retryCount + 1}):`,
        error
      );

      if (retryCount < this.maxRetries) {
        this.retryTimeout = setTimeout(() => {
          this.performAuthCheck(retryCount + 1);
        }, this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        console.error("NetlifyAutoAuth: Max retries reached, giving up");
        this.updateState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        });
      }
    }
  }

  // Force refresh user data
  async refresh(): Promise<void> {
    await this.initialize(true);
  }

  autoRedirect(): string | null {
    if (typeof window === "undefined") return null;

    const currentPath = window.location.pathname;
    const state = this.getState();

    // Skip redirect logic if still loading
    if (state.isLoading) return null;

    console.log("NetlifyAutoAuth: Determining redirect for:", {
      currentPath,
      isAuthenticated: state.isAuthenticated,
      isAdmin: state.user?.is_admin,
      onboardingCompleted: state.user?.onboarding_completed,
    });

    // Public routes that don't require auth
    if (
      currentPath === "/" ||
      currentPath.startsWith("/login") ||
      currentPath.startsWith("/signup") ||
      currentPath.startsWith("/help") ||
      currentPath.startsWith("/product")
    ) {
      if (state.isAuthenticated) {
        // Auto-redirect authenticated users to appropriate dashboard
        if (state.user?.is_admin) {
          return "/admin";
        } else if (!state.user?.onboarding_completed) {
          return "/onboarding";
        } else {
          return "/dashboard";
        }
      }
      return null; // Stay on public page if not authenticated
    }

    // Auth routes
    if (currentPath.startsWith("/auth/")) {
      if (state.isAuthenticated) {
        if (state.user?.is_admin) {
          return "/admin";
        } else if (!state.user?.onboarding_completed) {
          return "/onboarding";
        } else {
          return "/dashboard";
        }
      }
      return null;
    }

    // Require authentication for all other routes
    if (!state.isAuthenticated) {
      return "/login";
    }

    // Admin routes
    if (currentPath.startsWith("/admin")) {
      if (!state.user?.is_admin) {
        return "/dashboard";
      }
      return null; // Admin can stay on admin pages
    }

    // Onboarding route
    if (currentPath.startsWith("/onboarding")) {
      if (state.user?.onboarding_completed) {
        if (state.user?.is_admin) {
          return "/admin";
        } else {
          return "/dashboard";
        }
      }
      return null; // Stay on onboarding if not completed
    }

    // Protected routes (dashboard, posts, etc.)
    if (
      currentPath.startsWith("/dashboard") ||
      currentPath.startsWith("/posts") ||
      currentPath.startsWith("/analytics") ||
      currentPath.startsWith("/billing") ||
      currentPath.startsWith("/profile") ||
      currentPath.startsWith("/settings") ||
      currentPath.startsWith("/feedback") ||
      currentPath.startsWith("/content-calendar") ||
      currentPath.startsWith("/prompt-library") ||
      currentPath.startsWith("/resources")
    ) {
      // Redirect admins to admin panel from regular user pages
      if (state.user?.is_admin) {
        return "/admin";
      }

      // Redirect to onboarding if not completed
      if (!state.user?.onboarding_completed) {
        return "/onboarding";
      }

      return null; // User can stay on user pages
    }

    // Default: no redirect needed
    return null;
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      console.log("NetlifyAutoAuth: Login successful");

      // Force refresh auth state
      await this.initialize(true);

      return { success: true };
    } catch (error) {
      console.error("NetlifyAutoAuth: Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  async signup(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      console.log("NetlifyAutoAuth: Signup successful");

      // Force refresh auth state
      await this.initialize(true);

      return { success: true };
    } catch (error) {
      console.error("NetlifyAutoAuth: Signup error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      // Clear cached auth state
      this.clearBrowserStorage();
      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastChecked: 0,
      });

      console.log("NetlifyAutoAuth: Logout successful");
    } catch (error) {
      console.error("NetlifyAutoAuth: Logout error:", error);
    }
  }

  // Cleanup method
  destroy() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.listeners = [];
    this.initialized = false;
  }

  // Force clear authentication state (for debugging)
  async forceClearAuth(): Promise<void> {
    this.clearBrowserStorage();
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastChecked: 0,
    });
    this.initialized = false;
  }
}

// Export singleton instance
export const netlifyAutoAuth = NetlifyAutoAuth.getInstance();
