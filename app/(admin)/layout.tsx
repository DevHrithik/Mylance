"use client";

import { useNetlifyAutoAuth } from "@/components/providers/NetlifyAutoAuthProvider";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, isAdmin, user } = useNetlifyAutoAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect non-admin users to dashboard
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render content if not authenticated or not admin
  if (!isAuthenticated || !isAdmin || !user) {
    return null;
  }

  // Mock admin user for now - you can replace with actual admin user data
  const adminUser = {
    id: "admin-1",
    user_id: user.id,
    role: "admin" as const,
    permissions: ["view_users", "edit_users", "generate_prompts"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar
        adminUser={adminUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
