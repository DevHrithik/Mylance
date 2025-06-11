"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AutoLoginProviderProps {
  children: React.ReactNode;
}

export function AutoLoginProvider({ children }: AutoLoginProviderProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    const checkAndAutoLogin = async () => {
      // Prevent multiple checks
      if (redirectAttempted.current) {
        setIsChecking(false);
        return;
      }

      try {
        console.log("AutoLogin: Checking for existing session...");

        const supabase = createClient();

        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn("AutoLogin: Session check error:", error);
          setIsChecking(false);
          return;
        }

        const currentPath = window.location.pathname;
        console.log("AutoLogin: Current path:", currentPath);

        if (session?.user) {
          console.log(
            "AutoLogin: Found valid session for user:",
            session.user.email
          );

          // Check both profile.is_admin and admin_users table for comprehensive admin detection
          const [profileResult, adminResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("onboarding_completed, is_admin")
              .eq("id", session.user.id)
              .single(),
            supabase
              .from("admin_users")
              .select("id, role")
              .eq("user_id", session.user.id)
              .single(),
          ]);

          const profile = profileResult.data;
          const adminUser = adminResult.data;
          const profileError = profileResult.error;
          const adminError = adminResult.error;

          console.log("AutoLogin: Profile check:", { profile, profileError });
          console.log("AutoLogin: Admin user check:", {
            adminUser,
            adminError,
          });

          // User is admin if EITHER is_admin is true OR they exist in admin_users table
          const isAdmin =
            profile?.is_admin === true || (adminUser && !adminError);

          let targetPath = null;

          // Handle redirects based on user type and current path
          if (isAdmin) {
            console.log(
              "AutoLogin: User is admin (via",
              profile?.is_admin ? "profile.is_admin" : "admin_users table",
              ")"
            );
            // Admin users: redirect to admin unless already on admin routes
            if (
              !currentPath.startsWith("/admin") &&
              !currentPath.startsWith("/dashboard")
            ) {
              targetPath = "/admin";
              console.log("AutoLogin: Admin user, redirecting to admin panel");
            }
          } else {
            console.log("AutoLogin: User is not admin");

            // Non-admin users: handle based on onboarding and current path
            if (currentPath.startsWith("/admin")) {
              // Non-admin trying to access admin - redirect to dashboard
              console.log(
                "AutoLogin: Non-admin user accessing admin route, redirecting to dashboard"
              );
              targetPath = "/dashboard";
            } else if (!profile?.onboarding_completed) {
              // User needs onboarding
              if (currentPath !== "/onboarding") {
                targetPath = "/onboarding";
                console.log("AutoLogin: User needs onboarding");
              }
            } else {
              // Completed user on auth pages - redirect to dashboard
              const authPages = ["/login", "/signup", "/auth"];
              const isOnAuthPage = authPages.some((page) =>
                currentPath.startsWith(page)
              );

              if (isOnAuthPage) {
                targetPath = "/dashboard";
                console.log(
                  "AutoLogin: Completed user on auth page, redirecting to dashboard"
                );
              }
            }
          }

          // Only redirect if we have a target and haven't redirected yet
          if (targetPath && !hasRedirected) {
            console.log(`AutoLogin: Redirecting to ${targetPath}`);
            redirectAttempted.current = true;
            setHasRedirected(true);
            router.push(targetPath);
            return; // Don't set isChecking to false yet
          }
        } else {
          console.log("AutoLogin: No session found");

          // Redirect unauthenticated users away from protected routes
          const publicPaths = ["/", "/login", "/signup", "/auth"];
          const isPublicPath = publicPaths.some((path) =>
            currentPath.startsWith(path)
          );

          if (!isPublicPath && !hasRedirected) {
            console.log("AutoLogin: Redirecting unauthenticated user to login");
            redirectAttempted.current = true;
            setHasRedirected(true);
            router.push("/login");
            return; // Don't set isChecking to false yet
          }
        }
      } catch (error) {
        console.error("AutoLogin: Error during auto-login check:", error);
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to ensure DOM is ready and prevent race conditions
    const timeoutId = setTimeout(checkAndAutoLogin, 200);

    return () => clearTimeout(timeoutId);
  }, [router, hasRedirected]);

  // Listen for auth state changes (but don't redirect immediately)
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "AutoLogin: Auth state changed:",
        event,
        session?.user?.email
      );

      if (event === "SIGNED_OUT") {
        // Reset state and redirect to login
        setHasRedirected(false);
        redirectAttempted.current = false;
        router.push("/login");
      }
      // Don't handle SIGNED_IN here to avoid conflicts with initial check
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Show loading spinner during initial check
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-4 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Loading Mylance
            </h2>
            <p className="text-sm text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
