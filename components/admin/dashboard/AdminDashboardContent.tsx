"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminStatsCards from "@/components/admin/dashboard/AdminStatsCards";
import AdminOverview from "@/components/admin/dashboard/AdminOverview";
import AdminActivityFeed from "@/components/admin/dashboard/AdminActivityFeed";
import { LogOut, Settings, User, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminDashboardData } from "@/lib/supabase/admin-server-queries";

interface AdminUser {
  first_name?: string;
  full_name?: string;
  email: string;
  role: "admin" | "super_admin";
}

interface AdminDashboardContentProps {
  adminData: AdminDashboardData;
  adminUser: AdminUser;
}

export default function AdminDashboardContent({
  adminData,
  adminUser,
}: AdminDashboardContentProps) {
  const [greeting, setGreeting] = useState("");
  const router = useRouter();

  // Generate greeting based on time of day
  useEffect(() => {
    const generateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        return "Good morning";
      } else if (hour < 17) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    };
    setGreeting(generateGreeting());
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getDisplayName = () => {
    return (
      adminUser?.first_name ||
      adminUser?.full_name ||
      adminUser?.email?.split("@")[0] ||
      "Admin"
    );
  };

  // Transform server data for legacy components
  const transformedStats = {
    totalUsers: adminData.stats.totalUsers,
    activeSubscriptions: 0, // This would need to be added to the server query
    totalPosts: adminData.stats.totalPosts,
    activeUsers: adminData.stats.activeUsers,
    newUsersThisWeek: 0, // This would need to be calculated in server query
    promptsThisWeek: adminData.stats.postsThisWeek,
    promptUsageRate:
      adminData.stats.totalUsers > 0
        ? Math.round(
            (adminData.stats.promptsUsed / adminData.stats.totalUsers) * 100
          )
        : 0,
  };

  // Mock weekly activity data - this should be added to server queries
  const weeklyActivity = [
    { name: "Sun", posts: 0, prompts: 0 },
    { name: "Mon", posts: 5, prompts: 12 },
    { name: "Tue", posts: 8, prompts: 15 },
    { name: "Wed", posts: 6, prompts: 10 },
    { name: "Thu", posts: 10, prompts: 18 },
    { name: "Fri", posts: 7, prompts: 14 },
    { name: "Sat", posts: 3, prompts: 8 },
  ];

  // Mock subscription breakdown - this should be added to server queries
  const subscriptionBreakdown = [
    { name: "Free", value: adminData.stats.totalUsers, color: "#0088FE" },
    { name: "Monthly", value: 0, color: "#00C49F" },
  ];

  // Transform recent feedback to activity format
  const activities = adminData.recentFeedback.map((feedback, index) => {
    const baseActivity = {
      id: feedback.id,
      action: "respond_feedback",
      target_user_id: feedback.user_id,
      target_type: "feedback",
      target_id: feedback.id.toString(),
      details: {
        rating: feedback.rating,
        feedback_text: feedback.feedback_text,
        feedback_type: feedback.feedback_type,
        source: feedback.source,
      },
      created_at: feedback.created_at,
    };

    // Only add profiles if we have valid user email
    if (feedback.user_email) {
      const emailParts = feedback.user_email.split("@");
      return {
        ...baseActivity,
        profiles: {
          id: feedback.user_id,
          first_name: emailParts[0] || "Unknown",
          email: feedback.user_email,
        },
      };
    }

    return baseActivity;
  });

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {greeting}, {getDisplayName()}!
          </h1>
          <p className="text-gray-600 mt-1">Here&apos;s your admin overview</p>
        </div>

        {/* User Avatar and Dropdown */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
            <span className="flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              Admin Panel
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={getDisplayName()} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {adminUser?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {adminUser?.role === "super_admin"
                      ? "Super Admin"
                      : "Admin"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <User className="h-4 w-4 mr-2" />
                Exit Admin Panel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={transformedStats} />

      {/* Charts Section */}
      <div className="w-full">
        <AdminOverview
          stats={transformedStats}
          chartType="all"
          weeklyActivity={weeklyActivity}
          subscriptionBreakdown={subscriptionBreakdown}
        />
      </div>

      {/* Activity Feed */}
      <div className="w-full">
        <AdminActivityFeed activities={activities} />
      </div>

      {/* Recent Users Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
        <div className="space-y-3">
          {adminData.recentUsers.slice(0, 5).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">
                  {user.full_name || user.first_name || "Unnamed User"}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    user.onboarding_completed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.onboarding_completed ? "Complete" : "Onboarding"}
                </span>
                {user.is_admin && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Feedback Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Post Feedback</span>
              <span className="font-medium">
                {adminData.stats.totalPostFeedback}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User Feedback</span>
              <span className="font-medium">
                {adminData.stats.totalUserFeedback}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Post Rating</span>
              <span className="font-medium">
                {adminData.stats.avgPostRating}/5
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg User Rating</span>
              <span className="font-medium">
                {adminData.stats.avgUserRating}/5
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Content Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Prompts</span>
              <span className="font-medium">
                {adminData.stats.totalPrompts}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Prompts Used</span>
              <span className="font-medium">{adminData.stats.promptsUsed}</span>
            </div>
            <div className="flex justify-between">
              <span>Posts This Week</span>
              <span className="font-medium">
                {adminData.stats.postsThisWeek}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Usage Rate</span>
              <span className="font-medium">
                {adminData.stats.totalPrompts > 0
                  ? Math.round(
                      (adminData.stats.promptsUsed /
                        adminData.stats.totalPrompts) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 