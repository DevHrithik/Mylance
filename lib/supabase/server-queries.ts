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

    try {
      // Use our optimized database function
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Dashboard data fetch error:", error);

        // If the database function fails, fallback to manual queries
        console.log("Falling back to manual queries...");
        return await getFallbackDashboardData(userId);
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
    } catch (err: any) {
      console.error("Dashboard data fetch failed:", err);
      // Fallback to manual queries if database function fails
      return await getFallbackDashboardData(userId);
    }
  },
  ["dashboard-data"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["dashboard"],
  }
);

// Fallback function for dashboard data when the database function fails
async function getFallbackDashboardData(
  userId: string
): Promise<DashboardData> {
  const supabase = createServiceClient();

  try {
    console.log("Using fallback dashboard data queries...");

    // Get basic stats with manual queries
    const [postsQuery, promptsQuery, preferencesQuery] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "id, title, content, status, content_type, created_at, posted_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("content_prompts")
        .select(
          "id, category, hook, prompt_text, scheduled_date, pillar_number"
        )
        .eq("user_id", userId)
        .eq("is_used", false)
        .order("scheduled_date", { ascending: true })
        .limit(5),

      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);

    const posts = postsQuery.data || [];
    const prompts = promptsQuery.data || [];
    const preferences = preferencesQuery.data || {};

    // Calculate stats manually
    const completedPosts = posts.filter((p) => p.status === "used").length;
    const totalPosts = posts.length;
    const availablePrompts = prompts.length;
    const completionRate =
      totalPosts > 0 ? Math.round((completedPosts / totalPosts) * 100) : 0;

    return {
      stats: {
        completedPosts,
        availablePrompts,
        totalPosts,
        completionRate,
      },
      recentPosts: posts,
      upcomingPrompts: prompts,
      userPreferences: preferences || {},
    };
  } catch (fallbackError: any) {
    console.error("Fallback dashboard data failed:", fallbackError);

    // Return empty data as last resort
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
}

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

// Server-side posts data fetching with pagination and caching
export const getPostsData = unstable_cache(
  async (userId: string, limit: number = 50, offset: number = 0) => {
    const supabase = createServiceClient();

    try {
      const [postsResponse, countResponse, performanceResponse] =
        await Promise.all([
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

          // Also fetch performance data for user's posts using proper join
          supabase
            .from("post_performance")
            .select(
              `
            post_id, impressions, likes, comments, shares, engagement_rate,
            recorded_at,
            posts!inner(user_id)
          `
            )
            .eq("posts.user_id", userId)
            .order("recorded_at", { ascending: false }),
        ]);

      if (postsResponse.error) {
        throw new Error(`Posts query error: ${postsResponse.error.message}`);
      }

      if (countResponse.error) {
        throw new Error(`Count query error: ${countResponse.error.message}`);
      }

      const posts = postsResponse.data || [];
      const performanceData = performanceResponse.data || [];

      // Enhance posts with performance data and analytics flags
      const enhancedPosts = posts.map((post) => {
        const performance = performanceData.find(
          (p) => String(p.post_id) === String(post.id)
        );
        const hasAnalytics = !!performance;

        // Check if post needs analytics (posted 5+ days ago without analytics)
        const needsAnalytics =
          post.status === "used" &&
          post.posted_at &&
          !hasAnalytics &&
          new Date().getTime() - new Date(post.posted_at).getTime() >
            5 * 24 * 60 * 60 * 1000;

        return {
          ...post,
          hasAnalytics,
          needsAnalytics,
          analyticsData: performance
            ? {
                impressions: performance.impressions || 0,
                likes: performance.likes || 0,
                comments: performance.comments || 0,
                shares: performance.shares || 0,
                engagement_rate: performance.engagement_rate || 0,
              }
            : undefined,
        };
      });

      // Calculate summary stats
      const stats = {
        totalPosts: countResponse.count || 0,
        draftPosts: enhancedPosts.filter((p) => p.status === "draft").length,
        publishedPosts: enhancedPosts.filter((p) => p.status === "used").length,
        archivedPosts: enhancedPosts.filter((p) => p.status === "archived")
          .length,
        postsNeedingAnalytics: enhancedPosts.filter((p) => p.needsAnalytics)
          .length,
      };

      return {
        posts: enhancedPosts,
        stats,
        totalCount: countResponse.count || 0,
      };
    } catch (error) {
      console.error("Posts data error:", error);
      throw error;
    }
  },
  ["posts-data"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["posts"],
  }
);

// Server-side analytics data fetching
export const getAnalyticsData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    try {
      // Parallel data fetching with faster timeouts
      const timeoutPromise = (ms: number) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), ms)
        );

      const [postsResponse, performanceResponse, insightsResponse] =
        await Promise.allSettled([
          Promise.race([
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
            timeoutPromise(3000),
          ]),

          Promise.race([
            supabase
              .from("post_performance")
              .select(
                `
                post_id, impressions, likes, comments, shares, engagement_rate,
                posts!inner(user_id, title, content, content_type, posted_at)
              `
              )
              .eq("posts.user_id", userId)
              .order("recorded_at", { ascending: false }),
            timeoutPromise(3000),
          ]),

          Promise.race([
            supabase
              .from("ai_insights")
              .select("*")
              .eq("user_id", userId)
              .eq("is_active", true)
              .order("confidence_score", { ascending: false }),
            timeoutPromise(2000),
          ]),
        ]);

      // Handle results with proper error checking
      const posts =
        postsResponse.status === "fulfilled" &&
        !(postsResponse.value as any).error
          ? (postsResponse.value as any).data || []
          : [];

      const performanceData =
        performanceResponse.status === "fulfilled" &&
        !(performanceResponse.value as any).error
          ? (performanceResponse.value as any).data || []
          : [];

      const aiInsights =
        insightsResponse.status === "fulfilled" &&
        !(insightsResponse.value as any).error
          ? (insightsResponse.value as any).data || []
          : [];

      // Log any errors for debugging
      if (postsResponse.status === "rejected") {
        console.error("Posts query failed:", postsResponse.reason);
      }
      if (performanceResponse.status === "rejected") {
        console.error("Performance query failed:", performanceResponse.reason);
      }
      if (insightsResponse.status === "rejected") {
        console.error("Insights query failed:", insightsResponse.reason);
      }

      // Calculate stats from performance data
      const totalPosts = posts.length;
      const totalImpressions = performanceData.reduce(
        (sum: number, perf: any) => sum + (perf.impressions || 0),
        0
      );
      const totalLikes = performanceData.reduce(
        (sum: number, perf: any) => sum + (perf.likes || 0),
        0
      );
      const totalComments = performanceData.reduce(
        (sum: number, perf: any) => sum + (perf.comments || 0),
        0
      );
      const totalShares = performanceData.reduce(
        (sum: number, perf: any) => sum + (perf.shares || 0),
        0
      );

      const averageEngagementRate =
        performanceData.length > 0
          ? performanceData.reduce(
              (sum: number, perf: any) =>
                sum + (Number(perf.engagement_rate) || 0),
              0
            ) / performanceData.length
          : 0;

      // Find top performing posts
      const topPosts = performanceData
        .filter(
          (perf: any) =>
            perf.engagement_rate && Number(perf.engagement_rate) > 0
        )
        .sort(
          (a: any, b: any) =>
            Number(b.engagement_rate) - Number(a.engagement_rate)
        )
        .slice(0, 5)
        .map((perf: any) => ({
          id: perf.post_id,
          title: perf.posts?.title || "Untitled",
          content: perf.posts?.content || "",
          content_type: perf.posts?.content_type || "post",
          posted_at: perf.posts?.posted_at,
          impressions: perf.impressions,
          likes: perf.likes,
          comments: perf.comments,
          shares: perf.shares,
          engagement_rate: Number(perf.engagement_rate),
        }));

      // Transform real AI insights from database
      const insights = aiInsights.map((insight: any) => ({
        id: insight.id,
        insight_type: insight.insight_type,
        insight_data: insight.insight_data,
        confidence_score: Number(insight.confidence_score),
        performance_impact: Number(insight.performance_impact),
        recommendations: insight.recommendations,
        is_active: insight.is_active,
        created_at: insight.created_at,
        updated_at: insight.updated_at,
      }));

      // If no insights exist, generate some based on the data we have
      if (insights.length === 0 && performanceData.length > 0) {
        console.log("No insights found, generating basic content analysis...");

        // Analyze content types
        const contentTypeAnalysis = performanceData.reduce(
          (acc: any, perf: any) => {
            const type = (perf.posts as any)?.content_type || "general";
            if (!acc[type]) {
              acc[type] = { count: 0, totalEngagement: 0, totalImpressions: 0 };
            }
            acc[type].count++;
            acc[type].totalEngagement += Number(perf.engagement_rate) || 0;
            acc[type].totalImpressions += perf.impressions || 0;
            return acc;
          },
          {}
        );

        const bestContentType = Object.entries(contentTypeAnalysis).reduce(
          (best: any, [type, data]: any) => {
            const avgEngagement = data.totalEngagement / data.count;
            return !best || avgEngagement > best.avgEngagement
              ? {
                  type,
                  avgEngagement,
                  count: data.count,
                  impressions: data.totalImpressions,
                }
              : best;
          },
          null
        );

        // Generate insights based on actual data
        if (bestContentType && bestContentType.count >= 2) {
          insights.push({
            id: Date.now(),
            insight_type: "content_performance",
            insight_data: {
              best_content_type: bestContentType.type,
              avg_engagement: bestContentType.avgEngagement.toFixed(1),
              post_count: bestContentType.count,
              total_impressions: bestContentType.impressions,
            },
            confidence_score: 0.85,
            performance_impact: bestContentType.avgEngagement * 5,
            recommendations: [
              `Your ${
                bestContentType.type
              } content performs best with ${bestContentType.avgEngagement.toFixed(
                1
              )}% engagement`,
              `Create more ${bestContentType.type} content - you have ${bestContentType.count} high-performing posts`,
              `Focus on ${bestContentType.type} formats to maximize reach and engagement`,
            ],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Engagement depth analysis
        const totalEngagements = totalLikes + totalComments + totalShares;
        const commentRatio =
          totalImpressions > 0 ? (totalComments / totalImpressions) * 100 : 0;
        const likeRatio =
          totalImpressions > 0 ? (totalLikes / totalImpressions) * 100 : 0;

        if (totalImpressions > 0) {
          insights.push({
            id: Date.now() + 1,
            insight_type: "engagement_analysis",
            insight_data: {
              comment_rate: commentRatio.toFixed(2),
              like_rate: likeRatio.toFixed(2),
              total_engagements: totalEngagements,
              engagement_depth:
                commentRatio < likeRatio * 0.15 ? "shallow" : "good",
            },
            confidence_score: 0.78,
            performance_impact: commentRatio < likeRatio * 0.15 ? 20 : 10,
            recommendations:
              commentRatio < likeRatio * 0.15
                ? [
                    "Ask direct questions in your posts to encourage comments",
                    "Share personal experiences to spark conversations",
                    "Create controversial but thoughtful takes to drive discussion",
                    "Always respond to comments to build community engagement",
                  ]
                : [
                    "Great comment engagement! Keep asking questions",
                    "Your audience loves interacting - maintain this approach",
                    "Consider creating more discussion-based content",
                  ],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

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
      .order("scheduled_date", { ascending: true, nullsFirst: false })
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

// Server-side feedback data fetching
export const getFeedbackData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    try {
      // Check if feedback table exists by trying to query it
      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist or other error, return empty feedback
        console.log("Feedback table not available:", error.message);
        return {
          feedback: [],
        };
      }

      return {
        feedback: feedbackData || [],
      };
    } catch (error) {
      console.log("Error in getFeedbackData:", error);
      // Return empty feedback instead of throwing error
      return {
        feedback: [],
      };
    }
  },
  ["feedback-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["feedback"],
  }
);

// Server-side profile data fetching
export const getProfileData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error("Failed to fetch profile data");
    }

    return {
      profile: data,
    };
  },
  ["profile-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["profile"],
  }
);

// Server-side writing profile data fetching
export const getWritingProfileData = unstable_cache(
  async (userId: string) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error("Failed to fetch writing profile data");
    }

    return {
      preferences: data || null,
      hasPreferences: !!data,
    };
  },
  ["writing-profile-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["writing-profile", "preferences"],
  }
);
