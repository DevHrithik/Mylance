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

// Server-side posts data fetching with pagination
export async function getPostsData(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createServiceClient();

  console.log("Fetching posts for user ID:", userId);

  try {
    const [postsResponse, countResponse] = await Promise.all([
      supabase
        .from("posts")
        .select(
          `
          id, title, content, status, content_type, tone,
          created_at, updated_at, posted_at, scheduled_date,
          hashtags, topics, linkedin_url, ai_prompt_used,
          generation_metadata
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),

      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    console.log("Posts response:", postsResponse);
    console.log("Count response:", countResponse);

    if (postsResponse.error) {
      console.error("Posts query error:", postsResponse.error);
      throw new Error(`Posts query error: ${postsResponse.error.message}`);
    }

    if (countResponse.error) {
      console.error("Count query error:", countResponse.error);
      throw new Error(`Count query error: ${countResponse.error.message}`);
    }

    console.log("Returning posts data:", {
      posts: postsResponse.data?.length || 0,
      totalCount: countResponse.count || 0,
    });

    return {
      posts: postsResponse.data || [],
      totalCount: countResponse.count || 0,
    };
  } catch (error) {
    console.error("Posts data error:", error);
    throw error; // Re-throw instead of returning empty data
  }
}

// Server-side analytics data fetching
export const getAnalyticsData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    try {
      const [postsResponse, performanceResponse, insightsResponse] =
        await Promise.all([
          supabase
            .from("posts")
            .select(
              `
            id, title, content, posted_at, content_type, hashtags, status
          `
            )
            .eq("user_id", userId)
            .eq("status", "used")
            .not("posted_at", "is", null)
            .order("posted_at", { ascending: false })
            .limit(20),

          supabase
            .from("post_performance")
            .select(
              `
            post_id, impressions, likes, comments, shares, engagement_rate,
            posts!inner(user_id, title, content_type, posted_at)
          `
            )
            .eq("posts.user_id", userId)
            .order("recorded_at", { ascending: false }),

          supabase
            .from("ai_learning_insights")
            .select("*")
            .eq("user_id", userId)
            .single(),
        ]);

      if (postsResponse.error) {
        throw new Error(`Posts query error: ${postsResponse.error.message}`);
      }

      const posts = postsResponse.data || [];
      const performanceData = performanceResponse.data || [];
      const aiInsights = insightsResponse.data;

      // Calculate stats from performance data
      const totalPosts = posts.length;
      const totalImpressions = performanceData.reduce(
        (sum, perf) => sum + (perf.impressions || 0),
        0
      );
      const totalLikes = performanceData.reduce(
        (sum, perf) => sum + (perf.likes || 0),
        0
      );
      const totalComments = performanceData.reduce(
        (sum, perf) => sum + (perf.comments || 0),
        0
      );
      const totalShares = performanceData.reduce(
        (sum, perf) => sum + (perf.shares || 0),
        0
      );

      const averageEngagementRate =
        performanceData.length > 0
          ? performanceData.reduce(
              (sum, perf) => sum + (Number(perf.engagement_rate) || 0),
              0
            ) / performanceData.length
          : 0;

      // Find top performing posts
      const topPosts = performanceData
        .filter(
          (perf) => perf.engagement_rate && Number(perf.engagement_rate) > 0
        )
        .sort((a, b) => Number(b.engagement_rate) - Number(a.engagement_rate))
        .slice(0, 5)
        .map((perf: any) => ({
          id: perf.post_id,
          title: perf.posts?.title || "Untitled",
          content_type: perf.posts?.content_type || "post",
          posted_at: perf.posts?.posted_at,
          impressions: perf.impressions,
          likes: perf.likes,
          comments: perf.comments,
          shares: perf.shares,
          engagement_rate: Number(perf.engagement_rate),
        }));

      // Create insights data
      const insights = aiInsights
        ? [
            {
              id: aiInsights.id,
              insight_type: "ai_learning",
              insight_data: {
                total_edits: aiInsights.total_edits,
                improvement_score: Number(aiInsights.improvement_score),
                personalization_level: Number(aiInsights.personalization_level),
                learning_velocity: Number(aiInsights.learning_velocity),
                confidence_score: Number(aiInsights.confidence_score),
              },
              confidence_score: Number(aiInsights.confidence_score),
              performance_impact: Number(aiInsights.improvement_score),
              recommendations: [
                aiInsights.improvement_score > 0.7
                  ? "Your AI learning is performing well!"
                  : "Continue providing feedback to improve AI personalization",
                aiInsights.personalization_level > 0.5
                  ? "High personalization achieved"
                  : "More content needed for better personalization",
              ],
              is_active: true,
              created_at: aiInsights.created_at,
              updated_at: aiInsights.updated_at,
            },
          ]
        : [];

      return {
        stats: {
          totalPosts,
          totalImpressions,
          totalLikes,
          totalComments,
          totalShares,
          averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
        },
        topPosts,
        insights,
      };
    } catch (error) {
      console.error("Analytics data error:", error);
      // Return empty data instead of throwing
      return {
        stats: {
          totalPosts: 0,
          totalImpressions: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          averageEngagementRate: 0,
        },
        topPosts: [],
        insights: [],
      };
    }
  },
  ["analytics-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["analytics"],
  }
);

// Server-side content calendar data fetching
export const getContentCalendarData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const [promptsResponse, postsResponse] = await Promise.all([
      supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", userId)
        .eq("pushed_to_calendar", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (promptsResponse.error || postsResponse.error) {
      throw new Error("Failed to fetch content calendar data");
    }

    return {
      prompts: promptsResponse.data || [],
      posts: postsResponse.data || [],
    };
  },
  ["content-calendar"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["calendar", "prompts"],
  }
);

// Server-side prompt library data fetching
export const getPromptLibraryData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("content_prompts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch prompt library data");
    }

    return {
      prompts: data || [],
    };
  },
  ["prompt-library"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["prompts"],
  }
);

// Server-side user preferences data fetching
export const getUserPreferences = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error("Failed to fetch user preferences");
    }

    return data;
  },
  ["user-preferences"],
  {
    revalidate: 900, // Cache for 15 minutes
    tags: ["preferences"],
  }
);

// Server-side subscription data fetching
export const getSubscriptionData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const [profileResponse, subscriptionResponse] = await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", userId).single(),

      supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single(),
    ]);

    const isAdmin = profileResponse.data?.is_admin || false;
    const subscription = subscriptionResponse.data;

    // Check if user has access
    const hasAccess =
      isAdmin || (subscription && subscription.status === "active");

    return {
      isAdmin,
      subscription,
      hasAccess,
    };
  },
  ["subscription-data"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["subscription"],
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

export async function revalidatePosts() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("posts");
}

export async function revalidateAnalytics() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("analytics");
}

export async function revalidatePrompts() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("prompts");
}

export async function revalidateSubscription() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("subscription");
}

export async function revalidatePreferences() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("preferences");
}

// Additional billing data functions
export async function getBillingData(userId: string) {
  const supabase = createServiceClient();

  try {
    // Fetch subscription and profile data in parallel
    const [subscriptionResponse, profileResponse, usageResponse] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),

        supabase.from("profiles").select("is_admin").eq("id", userId).single(),

        // Get usage stats for this month
        supabase
          .from("posts")
          .select("id, created_at")
          .eq("user_id", userId)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ]);

    const subscription = subscriptionResponse.data;
    const profile = profileResponse.data;
    const usage = usageResponse.data || [];

    // Calculate monthly usage
    const monthlyStats = {
      postsCreated: usage.length,
      aiGenerations: usage.filter(
        (post) =>
          post.created_at >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ).length,
      weeklyPromptsDelivered: 4, // This would come from actual prompt delivery tracking
    };

    return {
      subscription,
      isAdmin: profile?.is_admin || false,
      hasAccess:
        subscription?.status === "active" || profile?.is_admin || false,
      monthlyStats,
    };
  } catch (error) {
    console.error("Error fetching billing data:", error);
    throw error;
  }
}

export async function getFeedbackData(userId: string) {
  const supabase = createServiceClient();

  try {
    const [feedbackResponse, repliesResponse] = await Promise.all([
      supabase
        .from("feedback")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("feedback_replies")
        .select("*, feedback_id")
        .in(
          "feedback_id",
          (
            await supabase.from("feedback").select("id").eq("user_id", userId)
          ).data?.map((f) => f.id) || []
        )
        .order("created_at", { ascending: true }),
    ]);

    if (feedbackResponse.error) throw feedbackResponse.error;
    if (repliesResponse.error) throw repliesResponse.error;

    // Group replies by feedback_id
    const repliesByFeedback = (repliesResponse.data || []).reduce(
      (acc, reply) => {
        if (!acc[reply.feedback_id]) acc[reply.feedback_id] = [];
        acc[reply.feedback_id].push(reply);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Attach replies to feedback
    const feedbackWithReplies = (feedbackResponse.data || []).map(
      (feedback) => ({
        ...feedback,
        replies: repliesByFeedback[feedback.id] || [],
      })
    );

    return {
      feedback: feedbackWithReplies,
    };
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    throw error;
  }
}
