"use client";

import { usePathname } from "next/navigation";
import { AdminUser } from "@/lib/types/admin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  X,
  Shield,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdminSidebarProps {
  adminUser: AdminUser;
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
];

export default function AdminSidebar({
  adminUser,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      // Still redirect even if there's an error
      router.push("/login");
    }
  };

  const handleExitAdmin = () => {
    router.push("/dashboard");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="admin-sidebar hidden lg:flex">
        <div className="flex flex-col w-64 h-screen bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center px-6 py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-teal-500">Mylance</h1>
                <p className="text-xs text-purple-600 font-medium">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Main Navigation */}
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative group",
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform translate-y-0"
                        : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 hover:shadow-md hover:transform hover:-translate-y-0.5"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isActive
                          ? "text-white"
                          : "text-purple-400 group-hover:text-purple-600"
                      )}
                    />
                    <span className="font-medium">{item.name}</span>
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute right-4 h-2 w-2 bg-white rounded-full" />
                    )}
                  </Button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-4 pb-6 space-y-2 border-t border-gray-200 pt-4">
              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-gray-400 hover:text-red-500" />
                <span className="font-medium">Log out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-teal-500">
                    Mylance
                  </h1>
                  <p className="text-xs text-purple-600 font-medium">
                    Admin Panel
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative group",
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform translate-y-0"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 hover:shadow-md hover:transform hover:-translate-y-0.5"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          isActive
                            ? "text-white"
                            : "text-purple-400 group-hover:text-purple-600"
                        )}
                      />
                      <span className="font-medium">{item.name}</span>
                      {/* Active indicator dot */}
                      {isActive && (
                        <div className="absolute right-4 h-2 w-2 bg-white rounded-full" />
                      )}
                    </Button>
                  );
                })}
              </nav>

              {/* Bottom Actions */}
              <div className="px-4 pb-6 space-y-2 border-t border-gray-200 pt-4">
                {/* Exit Admin Panel */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md hover:transform hover:-translate-y-0.5"
                  onClick={handleExitAdmin}
                >
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span className="font-medium">Exit Admin</span>
                </Button>

                {/* Logout */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 text-gray-400 hover:text-red-500" />
                  <span className="font-medium">Log out</span>
                </Button>
              </div>

              {/* User Info */}
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {adminUser.role === "super_admin" ? "SA" : "A"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Admin User
                    </p>
                    <p className="text-xs text-purple-600 capitalize font-medium">
                      {adminUser.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
