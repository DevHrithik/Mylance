import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      },
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    }
  );
}

// Helper function to add timeout to any promise
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  );
  return Promise.race([promise, timeoutPromise]);
}

// Get current user session with error handling and timeout
export async function getSession() {
  const supabase = createClient();
  try {
    const result = await withTimeout(supabase.auth.getSession(), 5000);
    const {
      data: { session },
      error,
    } = result;

    if (error) {
      // Handle refresh token errors
      if (
        error.message?.includes("refresh_token_not_found") ||
        error.message?.includes("Invalid Refresh Token") ||
        error.code === "refresh_token_not_found"
      ) {
        console.log("Refresh token expired, clearing session");
        await clearAuthData();
        return null;
      }
      throw error;
    }

    return session;
  } catch (error) {
    console.error("Session error:", error);
    if (error instanceof Error && error.message.includes("timed out")) {
      console.log("Session check timed out, redirecting to login");
      // Clear potentially corrupted session data
      await clearAuthData();
    }
    return null;
  }
}

// Clear all auth data
export async function clearAuthData() {
  if (typeof window === "undefined") return;

  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });

    // Clear localStorage
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
      }
    });

    // Clear sessionStorage
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
      }
    });
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}

// Sign in with email and password
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({ email, password });
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signUp({ email, password });
}

// Sign in with Google
export async function signInWithGoogle() {
  const supabase = createClient();
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/callback`,
    },
  });
}

// Sign out with proper cleanup
export async function signOut() {
  const supabase = createClient();
  try {
    await supabase.auth.signOut({ scope: "global" });
  } finally {
    await clearAuthData();
  }
}

// Get user profile with admin check
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  return await supabase
    .from("profiles")
    .select("id, email, full_name, is_admin, onboarding_completed")
    .eq("id", userId)
    .single();
}
