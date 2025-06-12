"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { usePathname, useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import {
  BarChart3,
  FileText,
  Settings,
  User,
  TrendingUp,
  CreditCard,
  Brain,
  Calendar,
  MessageSquare,
  BookOpen,
  Loader2,
  // BookOpen,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: BarChart3,
  },
  // {
  //   name: "Prompt Library",
  //   href: ROUTES.PROMPT_LIBRARY,
  //   icon: BookOpen,
  // },
  {
    name: "Content Calendar",
    href: ROUTES.CONTENT_CALENDAR,
    icon: Calendar,
  },
  {
    name: "Posts",
    href: ROUTES.POSTS,
    icon: FileText,
  },
  {
    name: "Analytics",
    href: ROUTES.ANALYTICS,
    icon: TrendingUp,
  },
  {
    name: "Profile",
    href: ROUTES.PROFILE,
    icon: User,
  },
];

const voiceSection = [
  {
    name: "Writing Profile",
    href: ROUTES.WRITING_PROFILE,
    icon: Brain,
    description: "Voice Personalization",
  },
];

const bottomNavigation = [
  {
    name: "Resources",
    href: "/resources",
    icon: BookOpen,
  },
  {
    name: "Feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
  // {
  //   name: "Settings",
  //   href: ROUTES.SETTINGS,
  //   icon: Settings,
  // },
  {
    name: "Billing",
    href: ROUTES.BILLING,
    icon: CreditCard,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useSimpleAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double clicks

    setIsLoggingOut(true);
    try {
      await logout();
      // Force navigation after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-white border-r border-gray-200",
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center px-6 py-6">
        <h1 className="text-xl font-semibold text-teal-500">Mylance</h1>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative group",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg transform translate-y-0"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:transform hover:-translate-y-0.5"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600"
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

          {/* Voice Personalization Section */}
          <div className="pt-6 pb-4">
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Personalization
              </h3>
            </div>
            {voiceSection.map((item) => {
              const isActive = pathname === item.href;
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
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.name}</span>
                    <span
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-purple-100"
                          : "text-gray-400 group-hover:text-purple-500"
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute right-4 h-2 w-2 bg-white rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 pb-6 space-y-2">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 relative group",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg transform translate-y-0"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:transform hover:-translate-y-0.5"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600"
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

          {/* Logout button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium rounded-lg transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Logging out...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium">Log out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
