"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/types/admin";
import AdminSidebar from "./AdminSidebar";
import AdminBreadcrumbs from "./AdminBreadcrumbs";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminUser: AdminUser;
}

export default function AdminLayout({ children, adminUser }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar
        adminUser={adminUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="admin-main">
        {/* Breadcrumbs */}
        <AdminBreadcrumbs />

        {/* Content */}
        <main className="admin-content">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
