"use client";

import { useState, useEffect, useMemo } from "react";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { CalendarLegend } from "@/components/dashboard/CalendarLegend";
import { ContentCalendar } from "@/components/dashboard/ContentCalendar";
import { ProfileLockedModal } from "@/components/dashboard/ProfileLockedModal";
import AILearningProgress from "@/components/dashboard/AILearningProgress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { DashboardData } from "@/lib/supabase/server-queries";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useFullProfile } from "@/lib/supabase/useFullProfile";

interface CalendarEvent {
  date: string;
  hasCompletedPost: boolean;
  hasAvailablePrompt: boolean;
  prompts: any[];
  posts: any[];
}

interface DashboardContentProps {
  initialData: DashboardData;
  userId: string;
}

export function DashboardContent({
  initialData,
  userId,
}: DashboardContentProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  const {
    profile: fullProfile,
    loading: profileLoading,
    error: profileError,
  } = useFullProfile(userId);

  // Check profile lock status
  useEffect(() => {
    const checkProfileLock = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("first_name, full_name, profile_locked")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
          return;
        }

        setUserProfile(profileData);
        setIsLocked(profileData?.profile_locked ?? true);
      } catch (err) {
        console.error("Error checking profile lock:", err);
      }
    };

    checkProfileLock();
  }, [userId, supabase]);

  // Manual refresh function
  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Trigger a manual refresh by calling the server action
      const response = await fetch(`/api/dashboard/refresh?userId=${userId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh data");
      }

      const newData = await response.json();
      setData(newData);
      toast.success("Dashboard refreshed");
    } catch (err) {
      console.error("Error refreshing dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh");
      toast.error("Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar data from posts and prompts
  const calendarData = useMemo(() => {
    const calendar: Record<string, CalendarEvent> = {};

    // Add recent posts to calendar
    data.recentPosts.forEach((post) => {
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

    // Add upcoming prompts to calendar
    data.upcomingPrompts.forEach((prompt) => {
      if (prompt.scheduled_date) {
        const dateKey = prompt.scheduled_date;
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
        calendar[dateKey].hasAvailablePrompt = true;
      }
    });

    return calendar;
  }, [data.recentPosts, data.upcomingPrompts]);

  const handleProfileUnlocked = () => {
    setIsLocked(false);
    toast.success("Welcome to Mylance! Your profile has been unlocked.");
  };

  // Get display name
  const displayName =
    userProfile?.first_name || userProfile?.full_name?.split(" ")[0] || "User";

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-800 font-medium">
                Error loading dashboard
              </h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`space-y-8 ${isLocked ? "blur-sm pointer-events-none" : ""}`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Hello {displayName}
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/content-calendar")}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="h-4 w-4" />
              <span>View Full Calendar</span>
            </Button>
          </div>
        </div>

        <StatsOverview
          stats={{
            completedPosts: data.stats.completedPosts,
            availablePrompts: data.stats.availablePrompts,
            completionRate: data.stats.completionRate,
            dayStreak: 1, // Mock for now
          }}
        />

        {/* Content Game Plan Accordion */}
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="game-plan">
            <AccordionTrigger className="text-lg font-semibold flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-pink-50 border-l-4 border-blue-400 rounded-t-xl shadow-sm hover:bg-blue-100 transition-colors duration-200">
              <span className="flex items-center gap-2">
                <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-1 mr-2 shadow-sm">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M12 19V5m0 0-7 7m7-7 7 7"
                    />
                  </svg>
                </span>
                Your Content Game Plan
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 bg-white border-x border-b border-blue-100 rounded-b-xl shadow-md transition-all duration-300 p-6">
              {profileLoading ? (
                <div className="text-center text-gray-500 py-4">
                  Loading your content game plan...
                </div>
              ) : profileError ? (
                <div className="text-center text-red-500 py-4">
                  Failed to load your content game plan.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          📋 Content Strategy
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {fullProfile?.content_strategy ||
                          "No content strategy set yet. Complete your profile to get a personalized strategy."}
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">👥 Ideal Customer</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {fullProfile?.ideal_target_client ||
                          "No ideal customer set yet."}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/profile")}
                    >
                      Update Strategy
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push("/analytics")}
                    >
                      View Analytics
                    </Button>
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {/* End Content Game Plan Accordion */}

        <div className="space-y-6">
          <CalendarLegend
            stats={{
              completedPosts: data.stats.completedPosts,
              availablePrompts: data.stats.availablePrompts,
              completionRate: data.stats.completionRate,
              dayStreak: 1,
            }}
          />
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
