import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";

// Create a service role client for cached queries (no cookies needed)
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role bypasses RLS
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

export interface DashboardData {
  stats: {
    completedPosts: number;
    availablePrompts: number;
    totalPosts: number;
    completionRate: number;
  };
  recentPosts: Array<{
    id: number;
    title: string | null;
    content: string;
    status: string;
    content_type: string;
    created_at: string;
    posted_at: string | null;
  }>;
  upcomingPrompts: Array<{
    id: number;
    category: string;
    hook: string;
    prompt_text: string;
    scheduled_date: string | null;
    pillar_number: number;
  }>;
  userPreferences: {
    primary_goal?: string;
    content_pillars?: any;
    writing_style_tone?: string;
    default_dashboard_view?: string;
  };
}

// Cached server-side dashboard data fetching
export const getDashboardData = unstable_cache(
  async (userId: string): Promise<DashboardData> => {
    const supabase = createServiceClient();

    // Use our optimized database function
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Dashboard data fetch error:", error);
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Return empty data structure if no results
      return {
        stats: {
          completedPosts: 0,
          availablePrompts: 0,
          totalPosts: 0,
          completionRate: 0,
        },
        recentPosts: [],
        upcomingPrompts: [],
        userPreferences: {},
      };
    }

    const result = data[0];
    const completionRate =
      result.total_posts > 0
        ? Math.round((result.completed_posts / result.total_posts) * 100)
        : 0;

    return {
      stats: {
        completedPosts: result.completed_posts || 0,
        availablePrompts: result.available_prompts || 0,
        totalPosts: result.total_posts || 0,
        completionRate,
      },
      recentPosts: result.recent_posts || [],
      upcomingPrompts: result.upcoming_prompts || [],
      userPreferences: result.user_preferences || {},
    };
  },
  ["dashboard-data"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["dashboard"],
  }
);

// Server-side calendar data fetching
export const getCalendarData = unstable_cache(
  async (userId: string, startDate: string, endDate: string) => {
    const supabase = createServiceClient();

    // Optimized query for calendar data
    const [postsResponse, promptsResponse] = await Promise.all([
      supabase
        .from("posts")
        .select("id, created_at, posted_at, status, title")
        .eq("user_id", userId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true }),

      supabase
        .from("content_prompts")
        .select("id, scheduled_date, hook, category, is_used")
        .eq("user_id", userId)
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .order("scheduled_date", { ascending: true }),
    ]);

    if (postsResponse.error || promptsResponse.error) {
      throw new Error("Failed to fetch calendar data");
    }

    return {
      posts: postsResponse.data || [],
      prompts: promptsResponse.data || [],
    };
  },
  ["calendar-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["calendar"],
  }
);

// Server-side user profile fetching
export const getUserProfile = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
  },
  ["user-profile"],
  {
    revalidate: 1800, // Cache for 30 minutes
    tags: ["profile"],
  }
);

// Revalidation helpers
export async function revalidateDashboard() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("dashboard");
}

export async function revalidateCalendar() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("calendar");
}

export async function revalidateProfile() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("profile");
}
