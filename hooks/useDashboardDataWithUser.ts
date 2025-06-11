"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  completedPosts: number;
  availablePrompts: number;
  completionRate: number;
  dayStreak: number;
}

export interface CalendarEvent {
  date: string;
  hasCompletedPost: boolean;
  hasAvailablePrompt: boolean;
  prompts: PromptData[];
  posts: PostData[];
}

export interface PromptData {
  id: number;
  category: string;
  hook: string;
  prompt_text: string;
  is_used: boolean;
  scheduled_date: string | null;
  pushed_to_calendar: boolean;
}

export interface PostData {
  id: number;
  title: string | null;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  posted_at: string | null;
  created_at: string;
}

export interface UseDashboardDataReturn {
  stats: DashboardStats;
  calendarData: Record<string, CalendarEvent>;
  recentPosts: PostData[];
  availablePrompts: PromptData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  user_metadata?: any;
  first_name?: string | null;
  onboarding_completed?: boolean;
}

export function useDashboardDataWithUser(
  user: User | null
): UseDashboardDataReturn {
  const [stats, setStats] = useState<DashboardStats>({
    completedPosts: 0,
    availablePrompts: 0,
    completionRate: 0,
    dayStreak: 0,
  });
  const [posts, setPosts] = useState<PostData[]>([]);
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when user changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log(
        "useDashboardDataWithUser useEffect triggered with user:",
        user
      );

      if (!user?.id) {
        console.log("No user or user.id:", user);
        setLoading(false);
        return;
      }

      try {
        console.log(
          "useDashboardDataWithUser: Starting data fetch for user:",
          user.id
        );
        setLoading(true);
        setError(null);

        const supabase = createClient();

        console.log("Fetching dashboard data for user:", {
          userId: user.id,
          userEmail: user.email,
        });

        // Fetch posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        console.log("Posts query result:", {
          data: postsData,
          error: postsError,
          userId: user.id,
        });

        if (postsError) {
          console.error("Posts error:", postsError);
          throw postsError;
        }

        // Fetch prompts (only user-specific prompts)
        const { data: promptsData, error: promptsError } = await supabase
          .from("content_prompts")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_date", { ascending: true });

        console.log("Prompts query result:", {
          data: promptsData,
          error: promptsError,
          userId: user.id,
        });

        if (promptsError) {
          console.error("Prompts error:", promptsError);
          throw promptsError;
        }

        setPosts(postsData || []);
        setPrompts(promptsData || []);

        console.log("Final data set:", {
          postsCount: postsData?.length || 0,
          promptsCount: promptsData?.length || 0,
        });

        // Calculate stats
        const completedPosts =
          postsData?.filter((post: any) => post.status === "used").length || 0;
        const availablePrompts =
          promptsData?.filter((prompt: any) => !prompt.is_used).length || 0;
        const totalPosts = postsData?.length || 0;
        const completionRate =
          totalPosts > 0 ? Math.round((completedPosts / totalPosts) * 100) : 0;

        // Calculate day streak (simplified - count consecutive days with posts)
        let dayStreak = 0;
        if (postsData && postsData.length > 0) {
          const today = new Date();
          const usedPosts = postsData
            .filter((post: any) => post.status === "used" && post.posted_at)
            .sort(
              (a: any, b: any) =>
                new Date(b.posted_at!).getTime() -
                new Date(a.posted_at!).getTime()
            );

          let currentDate = today;
          for (const post of usedPosts) {
            const postDate = new Date(post.posted_at!);
            const daysDiff = Math.floor(
              (currentDate.getTime() - postDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysDiff <= dayStreak + 1) {
              dayStreak++;
              currentDate = postDate;
            } else {
              break;
            }
          }
        }

        setStats({
          completedPosts,
          availablePrompts,
          completionRate,
          dayStreak,
        });

        console.log(
          "useDashboardDataWithUser: Data fetch completed successfully"
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Generate calendar data from posts and prompts
  const calendarData = useMemo(() => {
    const calendar: Record<string, CalendarEvent> = {};

    // Add prompts to calendar
    prompts.forEach((prompt) => {
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
        if (!prompt.is_used) {
          calendar[dateKey].hasAvailablePrompt = true;
        }
      }
    });

    // Add posts to calendar
    posts.forEach((post) => {
      const dateToUse = post.posted_at || post.created_at;
      const dateKey = new Date(dateToUse).toISOString().substring(0, 10);

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

    return calendar;
  }, [posts, prompts]);

  const recentPosts = useMemo(() => {
    return posts.slice(0, 5); // Get latest 5 posts
  }, [posts]);

  return {
    stats,
    calendarData,
    recentPosts,
    availablePrompts: prompts,
    loading,
    error,
    refetch: async () => {
      console.log("Manual refetch triggered");
      // Trigger re-fetch by updating a dependency or calling the fetch directly
      if (user?.id) {
        setLoading(true);
        // The useEffect will handle the actual fetch
      }
    },
  };
}
