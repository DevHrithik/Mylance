"use client";

import { useNetlifyAutoAuth } from "@/components/providers/NetlifyAutoAuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isAdmin, hasCompletedOnboarding } =
    useNetlifyAutoAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect users who haven't completed onboarding (except admins)
    if (!isAdmin && !hasCompletedOnboarding) {
      router.push("/onboarding");
      return;
    }

    // Note: We deliberately DO NOT redirect admins to /admin here
    // Let admins access dashboard if they want to
  }, [isAuthenticated, isLoading, isAdmin, hasCompletedOnboarding, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render content if user needs onboarding (except admins)
  if (!isAdmin && !hasCompletedOnboarding) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header /> */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
