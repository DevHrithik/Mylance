"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface AuthPageGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthPageGuard({
  children,
  redirectTo = "/dashboard",
}: AuthPageGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSimpleAuth();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    // If user is authenticated, redirect them away from auth pages
    if (isAuthenticated) {
      console.log("Auth page guard: Redirecting authenticated user");
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show nothing (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  // If not authenticated, show the auth form
  return <>{children}</>;
}
