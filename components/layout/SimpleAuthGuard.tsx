"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface SimpleAuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function SimpleAuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo,
}: SimpleAuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin } = useSimpleAuth();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // Reset redirect flag when loading starts
    if (!redirectAttempted.current) {
      redirectAttempted.current = false;
    }

    // Prevent multiple redirects
    if (redirectAttempted.current) return;

    const currentPath = window.location.pathname;

    // Handle authentication requirements
    if (requireAuth && !isAuthenticated) {
      const targetPath = redirectTo || "/login";
      if (currentPath !== targetPath) {
        console.log("Auth guard: Redirecting to login - not authenticated");
        redirectAttempted.current = true;
        router.push(targetPath);
      }
      return;
    }

    // Handle admin requirements
    if (requireAdmin && (!isAuthenticated || !isAdmin)) {
      const targetPath = redirectTo || "/dashboard";
      if (currentPath !== targetPath) {
        console.log("Auth guard: Redirecting to dashboard - not admin");
        redirectAttempted.current = true;
        router.push(targetPath);
      }
      return;
    }

    // Handle onboarding redirect for regular users
    if (isAuthenticated && !isAdmin && user && !user.onboarding_completed) {
      if (currentPath !== "/onboarding") {
        console.log("Auth guard: Redirecting to onboarding - incomplete");
        redirectAttempted.current = true;
        router.push("/onboarding");
      }
      return;
    }

    // Redirect admins away from dashboard to admin panel
    if (isAuthenticated && isAdmin && currentPath.startsWith("/dashboard")) {
      console.log("Auth guard: Redirecting admin to admin panel");
      redirectAttempted.current = true;
      router.push("/admin");
      return;
    }

    // If we get here, no redirect is needed
    redirectAttempted.current = false;
  }, [
    isLoading,
    isAuthenticated,
    isAdmin,
    user,
    requireAuth,
    requireAdmin,
    redirectTo,
    router,
  ]);

  // For auth-required pages, show nothing while loading or if not authenticated
  // This prevents flash of content before redirect
  if (requireAuth && (isLoading || !isAuthenticated)) {
    return null;
  }

  // For admin-required pages, show nothing while loading or if not admin
  if (requireAdmin && (isLoading || !isAuthenticated || !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
