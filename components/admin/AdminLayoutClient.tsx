"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  BarChart3,
  Settings,
  Home,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    first_name?: string;
    email: string;
  };
}

// Admin Navigation Component
function AdminSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo Section */}
      <div className="flex items-center px-6 py-6">
        <h1 className="text-xl font-semibold text-teal-500">Mylance</h1>
        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
          Admin
        </span>
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
                    ? "bg-purple-600 text-white shadow-lg transform translate-y-0"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:transform hover:-translate-y-0.5"
                )}
                asChild
              >
                <Link href={item.href}>
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
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// Admin Header Component
function AdminHeader({ user }: { user: AdminLayoutClientProps["user"] }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="border-b bg-white lg:hidden">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-xl font-semibold text-teal-500">Mylance</h1>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
            Admin
          </span>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {user?.first_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user?.first_name || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="relative flex w-full max-w-xs flex-col bg-white h-full shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <h2 className="text-lg font-semibold text-teal-500">
                Mylance Admin
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {[
                { name: "Dashboard", href: "/admin", icon: Home },
                { name: "Users", href: "/admin/users", icon: Users },
                {
                  name: "Feedback",
                  href: "/admin/feedback",
                  icon: MessageSquare,
                },
                {
                  name: "Analytics",
                  href: "/admin/analytics",
                  icon: BarChart3,
                },
                { name: "Settings", href: "/admin/settings", icon: Settings },
              ].map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminLayoutClient({
  children,
  user,
}: AdminLayoutClientProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <AdminHeader user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
