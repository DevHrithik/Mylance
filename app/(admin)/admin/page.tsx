"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AdminStatsCards from "@/components/admin/dashboard/AdminStatsCards";
import AdminOverview from "@/components/admin/dashboard/AdminOverview";
import AdminActivityFeed from "@/components/admin/dashboard/AdminActivityFeed";
import { Loader2, LogOut, Settings, User, Shield } from "lucide-react";
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

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPosts: number;
  activeUsers: number;
  newUsersThisWeek: number;
  promptsThisWeek: number;
  promptUsageRate: number;
}

interface WeeklyActivityData {
  name: string;
  posts: number;
  prompts: number;
}

interface SubscriptionBreakdown {
  name: string;
  value: number;
  color: string;
}

interface AdminActivity {
  id: number;
  action: string;
  target_user_id?: string;
  target_type?: string;
  target_id?: string;
  details: Record<string, any>;
  created_at: string;
  admin_users?: {
    id: string;
    user_id: string;
    role: "admin" | "super_admin";
  };
  profiles?: {
    id: string;
    first_name?: string;
    email: string;
  };
}

interface AdminUser {
  first_name?: string;
  email: string;
  role?: "admin" | "super_admin";
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>(
    []
  );
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<
    SubscriptionBreakdown[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
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

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Fetch admin user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, email")
          .eq("id", user.id)
          .single();

        if (profile) {
          setAdminUser({
            first_name: profile.first_name,
            email: profile.email,
            role: "admin", // You can fetch this from admin_users table if needed
          });
        }
      }

      // Calculate date ranges
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // First fetch basic stats
      const [
        { count: totalUsers },
        { count: totalPosts },
        { count: newUsersThisWeek },
        { count: activeSubscriptions },
        { count: totalPrompts },
        { count: promptsThisWeek },
        activityData,
      ] = await Promise.all([
        // Total users
        supabase.from("profiles").select("*", { count: "exact", head: true }),

        // Total posts
        supabase.from("posts").select("*", { count: "exact", head: true }),

        // New users this week
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekAgo.toISOString()),

        // Active subscriptions
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),

        // Total prompts generated
        supabase
          .from("content_prompts")
          .select("*", { count: "exact", head: true }),

        // Prompts generated this week
        supabase
          .from("content_prompts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekAgo.toISOString()),

        // Recent admin activity
        supabase
          .from("admin_activity_log")
          .select(
            `
            *,
            admin_users(id, user_id, role),
            profiles!admin_activity_log_target_user_id_fkey(id, first_name, email)
          `
          )
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      // Calculate active users (users with recent prompts or posts)
      const [
        { data: activePromptUsers },
        { data: activePostUsers },
        { data: usersWithPromptsData },
      ] = await Promise.all([
        supabase
          .from("content_prompts")
          .select("user_id")
          .gte("created_at", weekAgo.toISOString()),
        supabase
          .from("posts")
          .select("user_id")
          .gte("created_at", weekAgo.toISOString()),
        supabase.from("content_prompts").select("user_id").limit(1000), // Get a reasonable sample to calculate usage
      ]);

      // Get unique active users from this week
      const activeUserIds = new Set([
        ...(activePromptUsers?.map((p) => p.user_id) || []),
        ...(activePostUsers?.map((p) => p.user_id) || []),
      ]);
      const activeUsers = activeUserIds.size;

      // Get unique users who have ever used prompts
      const usersWithPromptsIds = new Set(
        usersWithPromptsData?.map((p) => p.user_id) || []
      );
      const usersWithPrompts = usersWithPromptsIds.size;

      // Calculate improved prompt usage rate (users who have used prompts / total users)
      const promptUsageRate =
        (totalUsers ?? 0) > 0 && usersWithPrompts > 0
          ? Math.round((usersWithPrompts / (totalUsers ?? 0)) * 100)
          : 0;

      // Debug logging
      console.log("Admin Dashboard Stats:", {
        totalUsers,
        activeUsers,
        usersWithPrompts,
        promptUsageRate,
        activeSubscriptions,
        newUsersThisWeek,
        promptsThisWeek,
        activePromptUsersCount: activePromptUsers?.length || 0,
        activePostUsersCount: activePostUsers?.length || 0,
      });

      const adminStats: AdminStats = {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalPosts: totalPosts || 0,
        activeUsers: activeUsers || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        promptsThisWeek: promptsThisWeek || 0,
        promptUsageRate: Math.min(promptUsageRate, 100), // Cap at 100%
      };

      setStats(adminStats);
      setActivities(activityData.data || []);

      // Fetch weekly activity data (posts and prompts by day)
      const fetchWeeklyActivity = async () => {
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const activityPromises = weekDays.map(async (day, index) => {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - (6 - index));
          dayStart.setHours(0, 0, 0, 0);

          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          const [postsResult, promptsResult] = await Promise.all([
            supabase
              .from("posts")
              .select("*", { count: "exact", head: true })
              .gte("created_at", dayStart.toISOString())
              .lt("created_at", dayEnd.toISOString()),
            supabase
              .from("content_prompts")
              .select("*", { count: "exact", head: true })
              .gte("created_at", dayStart.toISOString())
              .lt("created_at", dayEnd.toISOString()),
          ]);

          return {
            name: day,
            posts: postsResult.count || 0,
            prompts: promptsResult.count || 0,
          };
        });

        const weeklyData = await Promise.all(activityPromises);
        setWeeklyActivity(weeklyData);
      };

      // Fetch subscription breakdown data
      const fetchSubscriptionBreakdown = async () => {
        const subscriptionCounts = await supabase
          .from("subscriptions")
          .select("plan_type")
          .eq("status", "active");

        // Count monthly (paid) subscriptions
        const monthlySubscriptions =
          subscriptionCounts.data?.filter(
            (sub: { plan_type: string }) => sub.plan_type === "monthly"
          ).length || 0;

        // Free users = total users - active monthly subscribers
        const freeUsers = Math.max(0, (totalUsers || 0) - monthlySubscriptions);

        const colors = ["#0088FE", "#00C49F"];
        const subscriptionData: SubscriptionBreakdown[] = [
          {
            name: "Free",
            value: freeUsers,
            color: colors[0] || "",
          },
          {
            name: "Monthly",
            value: monthlySubscriptions,
            color: colors[1] || "",
          },
        ];

        setSubscriptionBreakdown(subscriptionData);
      };

      // Execute the additional data fetching
      await Promise.all([fetchWeeklyActivity(), fetchSubscriptionBreakdown()]);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch admin data"
      );

      // Fallback to basic data if there's an error
      setStats({
        totalUsers: 0,
        activeSubscriptions: 0,
        totalPosts: 0,
        activeUsers: 0,
        newUsersThisWeek: 0,
        promptsThisWeek: 0,
        promptUsageRate: 0,
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getDisplayName = () => {
    return adminUser?.first_name || adminUser?.email?.split("@")[0] || "Admin";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600 mb-4">Error loading admin dashboard:</p>
          <p className="text-red-800 font-mono text-sm">{error}</p>
          <button
            onClick={fetchAdminData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

      {/* Error banner if there are issues */}
      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          Some data may be incomplete: {error}
        </div>
      )}

      {/* Stats Cards - 7 cards (4 + 3) */}
      {stats && <AdminStatsCards stats={stats} />}

      {/* Charts Section - Full Width */}
      <div className="w-full">
        {stats && (
          <AdminOverview
            stats={stats}
            chartType="all"
            weeklyActivity={weeklyActivity}
            subscriptionBreakdown={subscriptionBreakdown}
          />
        )}
      </div>

      {/* Activity Feed - Full Width Below */}
      <div className="w-full">
        <AdminActivityFeed activities={activities} />
      </div>
    </div>
  );
}
