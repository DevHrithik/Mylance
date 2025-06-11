import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Cache for user profiles to reduce database calls
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 100 * 60 * 1000; // 10 minutes - increased for better performance

// Helper function to create response with Netlify-specific cache headers
function createNetlifyResponse(
  request: NextRequest,
  options?: any
): NextResponse {
  const response = NextResponse.next({
    request,
    ...options,
  });

  // Netlify-specific headers to prevent session caching
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("Vary", "Cookie, Authorization, Accept-Encoding");
  response.headers.set("X-No-Cache", "true");

  // Add unique identifiers to prevent caching
  response.headers.set("X-Response-Time", Date.now().toString());
  response.headers.set("X-Request-ID", crypto.randomUUID());

  return response;
}

// Helper function to create redirect with proper cache headers
function createRedirectResponse(url: URL, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(url);

  // Critical: Prevent redirect caching on Netlify
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, max-age=0, must-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("Netlify-Vary", "cookie");
  response.headers.set("X-No-Cache", "true");

  return response;
}

// Get cached profile or fetch from database
async function getCachedProfile(userId: string, supabase: any) {
  const now = Date.now();
  const cached = profileCache.get(userId);

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Fetch with timeout to prevent hangs
    const profilePromise = supabase
      .from("profiles")
      .select("is_admin, onboarding_completed")
      .eq("id", userId)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
    );

    const { data, error } = await Promise.race([
      profilePromise,
      timeoutPromise,
    ]);

    if (error) {
      console.error("Middleware: Profile fetch error:", error);
      return null;
    }

    // Cache the result
    profileCache.set(userId, { data, timestamp: now });

    // Clean up old cache entries (keep cache size manageable)
    if (profileCache.size > 100) {
      const keys = Array.from(profileCache.keys());
      const oldestKey = keys[0];
      if (oldestKey) {
        profileCache.delete(oldestKey);
      }
    }

    return data;
  } catch (error) {
    console.error("Middleware: Profile fetch failed:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = createNetlifyResponse(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value);
          supabaseResponse = createNetlifyResponse(request);
          supabaseResponse.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },
        remove(name: string, options: any) {
          request.cookies.set(name, "");
          supabaseResponse = createNetlifyResponse(request);
          supabaseResponse.cookies.set(name, "", {
            ...options,
            path: "/",
            maxAge: 0,
          });
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Allow access to public routes and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/callback") ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/" || // Allow root path to do its own redirect
    pathname.startsWith("/help") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp")
  ) {
    return supabaseResponse;
  }

  try {
    // Get user with timeout to prevent hangs
    const userPromise = supabase.auth.getUser();
    const userTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("User auth timeout")), 8000)
    );

    const result = await Promise.race([userPromise, userTimeout]);

    // Type guard to ensure result has the expected structure
    if (!result || typeof result !== "object" || !("data" in result)) {
      throw new Error("Invalid auth response structure");
    }

    const {
      data: { user },
      error: userError,
    } = result as {
      data: { user: any };
      error: any;
    };

    if (userError) {
      // Handle refresh token errors specifically
      if (
        userError.message?.includes("refresh_token_not_found") ||
        userError.message?.includes("Invalid Refresh Token") ||
        userError.code === "refresh_token_not_found"
      ) {
        console.log("Middleware: Refresh token expired, redirecting to login");
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return createRedirectResponse(url, request);
      }

      console.log("Middleware: User auth error, redirecting to login");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return createRedirectResponse(url, request);
    }

    if (!user) {
      console.log("Middleware: No valid user session, redirecting to login");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return createRedirectResponse(url, request);
    }

    // Get user profile with caching
    const profile = await getCachedProfile(user.id, supabase);

    if (!profile) {
      console.log(
        "Middleware: Could not fetch user profile, redirecting to login"
      );
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return createRedirectResponse(url, request);
    }

    const isAdmin = profile.is_admin || false;
    const hasCompletedOnboarding = profile.onboarding_completed || false;

    // AUTO-LOGIN LOGIC STARTS HERE
    console.log(
      `Middleware: User ${user.email} authenticated - isAdmin: ${isAdmin}, onboardingCompleted: ${hasCompletedOnboarding}`
    );

    // Handle admin routes
    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        console.log(
          "Middleware: Non-admin accessing admin route, redirecting to dashboard"
        );
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return createRedirectResponse(url, request);
      }
      return supabaseResponse;
    }

    // AUTO-REDIRECT: Admins from dashboard to admin panel
    if (pathname.startsWith("/dashboard") && isAdmin) {
      console.log(
        "Middleware: Admin accessing dashboard, redirecting to admin"
      );
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return createRedirectResponse(url, request);
    }

    // AUTO-REDIRECT: Admins from other user routes to admin panel
    if (
      (pathname.startsWith("/posts") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/feedback") ||
        pathname.startsWith("/content-calendar") ||
        pathname.startsWith("/prompt-library") ||
        pathname.startsWith("/resources")) &&
      isAdmin
    ) {
      console.log(
        `Middleware: Admin accessing user route ${pathname}, redirecting to admin`
      );
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return createRedirectResponse(url, request);
    }

    // Handle onboarding
    if (pathname.startsWith("/onboarding")) {
      if (hasCompletedOnboarding) {
        if (isAdmin) {
          console.log(
            "Middleware: Completed admin on onboarding, redirecting to admin"
          );
          const url = request.nextUrl.clone();
          url.pathname = "/admin";
          return createRedirectResponse(url, request);
        } else {
          console.log(
            "Middleware: Completed user on onboarding, redirecting to dashboard"
          );
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          return createRedirectResponse(url, request);
        }
      }
      return supabaseResponse;
    }

    // AUTO-REDIRECT: Incomplete onboarding to onboarding page
    if (!hasCompletedOnboarding && !isAdmin) {
      console.log(
        "Middleware: User hasn't completed onboarding, redirecting to onboarding"
      );
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return createRedirectResponse(url, request);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware: Unexpected error:", error);

    // Clear potentially corrupted cache on error
    profileCache.clear();

    // Don't redirect on errors, let the page handle it
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
