"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

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
  pillar_number: number;
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

export function useDashboardData(): UseDashboardDataReturn {
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

  const { user } = useAuth();
  const supabase = createClient();

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch prompts (only user-specific prompts that are pushed to calendar)
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", user.id)
        .eq("pushed_to_calendar", true)
        .order("scheduled_date", { ascending: true });

      if (promptsError) throw promptsError;

      setPosts(postsData || []);
      setPrompts(promptsData || []);

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
            (currentDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
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
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

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

  const availablePrompts = useMemo(() => {
    return prompts.filter((prompt) => !prompt.is_used);
  }, [prompts]);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return {
    stats,
    calendarData,
    recentPosts,
    availablePrompts,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
