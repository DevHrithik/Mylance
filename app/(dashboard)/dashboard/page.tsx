"use client";

import { useState, useEffect, useMemo } from "react";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CalendarLegend } from "@/components/dashboard/CalendarLegend";
import { ContentCalendar } from "@/components/dashboard/ContentCalendar";
import { ProfileLockedModal } from "@/components/dashboard/ProfileLockedModal";
import AILearningProgress from "@/components/dashboard/AILearningProgress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GeneratedPost {
  id: number;
  title: string | null;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  posted_at: string | null;
  created_at: string;
  hashtags?: string[];
  performance?: {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface DashboardStats {
  completedPosts: number;
  availablePrompts: number;
  completionRate: number;
  dayStreak: number;
}

interface CalendarEvent {
  date: string;
  hasCompletedPost: boolean;
  hasAvailablePrompt: boolean;
  prompts: any[];
  posts: any[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    completedPosts: 0,
    availablePrompts: 0,
    completionRate: 0,
    dayStreak: 0,
  });
  const [calendarData, setCalendarData] = useState<
    Record<string, CalendarEvent>
  >({});
  const [availablePrompts, setAvailablePrompts] = useState<any[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Add a refresh trigger that changes when page becomes visible
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user like working pages do
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          // SimpleAuthGuard will handle redirect, just don't load data
          setLoading(false);
          return;
        }

        setUser(currentUser);

        console.log("Debug - User data:", {
          userId: currentUser.id,
          email: currentUser.email,
          userMetadata: currentUser.user_metadata,
        });

        // Fetch user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, full_name, profile_locked")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          });
          // Don't throw, just continue without profile data
          // This is expected for new users who may not have profile data yet
        } else if (profileData) {
          console.log("Profile data found:", profileData);
          setUserProfile(profileData);
        } else {
          console.log("No profile data found for user");
        }

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Posts error:", postsError);
          throw postsError;
        }

        // Fetch prompts - only those pushed to calendar for dashboard display
        const { data: promptsData, error: promptsError } = await supabase
          .from("content_prompts")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("pushed_to_calendar", true)
          .order("created_at", { ascending: false });

        if (promptsError) {
          console.error("Prompts error:", promptsError);
          throw promptsError;
        }

        // Format posts
        const formattedPosts: GeneratedPost[] = (postsData || []).map(
          (post: any) => ({
            id: parseInt(post.id),
            title: post.title,
            content: post.content,
            status: post.status,
            content_type: post.content_type || "",
            posted_at: post.posted_at,
            created_at: post.created_at,
            hashtags: post.hashtags || [],
            performance: {
              impressions: 0,
              likes: 0,
              comments: 0,
              shares: 0,
            },
          })
        );

        setPosts(formattedPosts);
        setAvailablePrompts(promptsData || []);

        // Calculate stats - based on prompts pushed to calendar
        const completedPosts = formattedPosts.filter(
          (post) => post.status === "used"
        ).length;
        const totalPromptsInCalendar = (promptsData || []).length;
        const availablePromptsCount = (promptsData || []).filter(
          (prompt: any) => !prompt.is_used
        ).length;
        const completionRate =
          totalPromptsInCalendar > 0
            ? Math.round((completedPosts / totalPromptsInCalendar) * 100)
            : 0;

        setStats({
          completedPosts,
          availablePrompts: availablePromptsCount,
          completionRate,
          dayStreak: 1, // Mock data for now
        });

        // Build calendar data
        const calendar: Record<string, CalendarEvent> = {};

        // Add posts to calendar
        formattedPosts.forEach((post) => {
          const dateKey = post.created_at.substring(0, 10);
          if (!calendar[dateKey]) {
            calendar[dateKey] = {
              date: dateKey,
              hasCompletedPost: false,
              hasAvailablePrompt: false,
              prompts: [],
              posts: [],
            };
          }
          calendar[dateKey].posts.push(post);
          if (post.status === "used") {
            calendar[dateKey].hasCompletedPost = true;
          }
        });

        // Add prompts to calendar - only those pushed to calendar with their scheduled dates
        (promptsData || []).forEach((prompt: any) => {
          // Use scheduled_date for prompts that are pushed to calendar
          const dateKey = prompt.scheduled_date;
          if (dateKey) {
            if (!calendar[dateKey]) {
              calendar[dateKey] = {
                date: dateKey,
                hasCompletedPost: false,
                hasAvailablePrompt: false,
                prompts: [],
                posts: [],
              };
            }
            calendar[dateKey].prompts.push(prompt);
            if (!prompt.is_used) {
              calendar[dateKey].hasAvailablePrompt = true;
            }
          }
        });

        setCalendarData(calendar);

        // Check profile lock status - use actual data from profile
        const isProfileLocked = profileData?.profile_locked ?? true;
        setIsLocked(isProfileLocked);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(errorMessage);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, refreshTrigger]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, trigger refresh
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const refetch = async () => {
    // Re-trigger the useEffect by setting loading and forcing re-render
    setLoading(true);
    setError(null);
    // The useEffect will handle the actual fetch
  };

  const handleProfileUnlocked = () => {
    setIsLocked(false);
    toast.success("Welcome to Mylance! Your profile has been unlocked.");
  };

  // Loading state - only show when we're actually loading data
  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-0 shadow-sm bg-white rounded-lg">
              <div className="p-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-800 font-medium">
                Error loading dashboard
              </h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get display name - prioritize profile first_name, fall back to user_metadata
  const displayName =
    userProfile?.first_name ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "User";

  // Normal Dashboard View
  return (
    <>
      <div
        className={`p-6 space-y-8 ${
          isLocked ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello {displayName}
          </h1>
          <Button
            onClick={() => router.push("/content-calendar")}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Calendar className="h-4 w-4" />
            <span>View Full Calendar</span>
          </Button>
        </div>

        <StatsOverview stats={stats} />

        <div className="space-y-6">
          <CalendarLegend stats={stats} />
          <ContentCalendar calendarData={calendarData} />
        </div>
        <AILearningProgress />
      </div>

      {/* Profile Locked Modal */}
      <ProfileLockedModal
        open={!!isLocked}
        onProfileUnlocked={handleProfileUnlocked}
      />
    </>
  );
}
