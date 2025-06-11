import { createServerClient } from "@supabase/ssr";
import { unstable_cache } from "next/cache";

// Create a service role client for admin cached queries
function createAdminServiceClient() {
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

export interface AdminDashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalPostFeedback: number;
    totalUserFeedback: number;
    totalPrompts: number;
    postsThisWeek: number;
    promptsUsed: number;
    avgPostRating: number;
    avgUserRating: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    created_at: string;
    last_login_at: string | null;
    first_name: string;
    full_name: string;
    business_type: string;
    onboarding_completed: boolean;
    is_admin: boolean;
  }>;
  recentFeedback: Array<{
    id: number;
    user_id: string;
    rating: number;
    feedback_text: string;
    feedback_type: string;
    created_at: string;
    user_email: string;
    source: string;
  }>;
}

export interface AdminUserData {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_login_at: string;
  };
  profile: {
    id: string;
    first_name: string;
    full_name: string;
    linkedin_url: string;
    business_type: string;
    business_size: string;
    business_stage: string;
    primary_goal: string;
    content_pillars: any;
    target_audience: string;
    unique_value_proposition: string;
    onboarding_completed: boolean;
    is_admin: boolean;
  };
  stats: {
    totalPosts: number;
    completedPosts: number;
    totalPrompts: number;
    usedPrompts: number;
    postFeedbackCount: number;
    userFeedbackCount: number;
    avgPostRating: number;
    avgUserRating: number;
  };
}

// Cached admin dashboard data using optimized database function
export const getAdminDashboardData = unstable_cache(
  async (): Promise<AdminDashboardData> => {
    const supabase = createAdminServiceClient();

    try {
      // Use optimized database function
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");

      if (error) {
        console.error("Admin dashboard data fetch error:", error);
        throw new Error(
          `Failed to fetch admin dashboard data: ${error.message}`
        );
      }

      if (!data || data.length === 0) {
        return {
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            totalPosts: 0,
            totalPostFeedback: 0,
            totalUserFeedback: 0,
            totalPrompts: 0,
            postsThisWeek: 0,
            promptsUsed: 0,
            avgPostRating: 0,
            avgUserRating: 0,
          },
          recentUsers: [],
          recentFeedback: [],
        };
      }

      const result = data[0];

      return {
        stats: {
          totalUsers: result.total_users || 0,
          activeUsers: result.active_users || 0,
          totalPosts: result.total_posts || 0,
          totalPostFeedback: result.total_post_feedback || 0,
          totalUserFeedback: result.total_user_feedback || 0,
          totalPrompts: result.total_prompts || 0,
          postsThisWeek: result.posts_this_week || 0,
          promptsUsed: result.prompts_used || 0,
          avgPostRating: result.avg_post_rating || 0,
          avgUserRating: result.avg_user_rating || 0,
        },
        recentUsers: result.recent_users || [],
        recentFeedback: result.recent_feedback || [],
      };
    } catch (error) {
      console.error("Admin dashboard data fetch error:", error);
      throw error;
    }
  },
  ["admin-dashboard-data"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["admin-dashboard"],
  }
);

// Cached admin user data
export const getAdminUserData = unstable_cache(
  async (userId: string): Promise<AdminUserData> => {
    const supabase = createAdminServiceClient();

    try {
      const [
        profileResponse,
        postsResponse,
        promptsResponse,
        postFeedbackResponse,
        userFeedbackResponse,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),

        supabase.from("posts").select("id, status").eq("user_id", userId),

        supabase
          .from("content_prompts")
          .select("id, is_used")
          .eq("user_id", userId),

        supabase
          .from("post_feedback")
          .select("id, rating")
          .eq("user_id", userId),

        supabase
          .from("user_feedback")
          .select("id, rating")
          .eq("user_id", userId),
      ]);

      if (profileResponse.error) {
        throw new Error("Failed to fetch user profile data");
      }

      const profile = profileResponse.data || {};
      const posts = postsResponse.data || [];
      const prompts = promptsResponse.data || [];
      const postFeedback = postFeedbackResponse.data || [];
      const userFeedback = userFeedbackResponse.data || [];

      const completedPosts = posts.filter(
        (p) => p.status === "published"
      ).length;
      const usedPrompts = prompts.filter((p) => p.is_used).length;

      const avgPostRating =
        postFeedback.length > 0
          ? postFeedback.reduce((acc, f) => acc + (f.rating || 0), 0) /
            postFeedback.length
          : 0;

      const avgUserRating =
        userFeedback.length > 0
          ? userFeedback.reduce((acc, f) => acc + (f.rating || 0), 0) /
            userFeedback.length
          : 0;

      return {
        user: {
          id: profile.id || "",
          email: profile.email || "",
          created_at: profile.created_at || "",
          last_login_at: profile.last_login_at || "",
        },
        profile: {
          id: profile.id || "",
          first_name: profile.first_name || "",
          full_name: profile.full_name || "",
          linkedin_url: profile.linkedin_url || "",
          business_type: profile.business_type || "",
          business_size: profile.business_size || "",
          business_stage: profile.business_stage || "",
          primary_goal: profile.primary_goal || "",
          content_pillars: profile.content_pillars || {},
          target_audience: profile.ideal_target_client || "",
          unique_value_proposition: profile.unique_value_proposition || "",
          onboarding_completed: profile.onboarding_completed || false,
          is_admin: profile.is_admin || false,
        },
        stats: {
          totalPosts: posts.length,
          completedPosts,
          totalPrompts: prompts.length,
          usedPrompts,
          postFeedbackCount: postFeedback.length,
          userFeedbackCount: userFeedback.length,
          avgPostRating: Math.round(avgPostRating * 10) / 10,
          avgUserRating: Math.round(avgUserRating * 10) / 10,
        },
      };
    } catch (error) {
      console.error("Admin user data fetch error:", error);
      throw error;
    }
  },
  ["admin-user-data"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["admin-user"],
  }
);

// Get all users with pagination and search
export const getAdminUsers = unstable_cache(
  async (page: number = 1, limit: number = 50, search?: string) => {
    const supabase = createAdminServiceClient();
    const offset = (page - 1) * limit;

    try {
      let query = supabase
        .from("profiles")
        .select(
          `
          id, email, first_name, full_name, created_at, 
          last_login_at, onboarding_completed, business_type,
          business_size, is_admin
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      let countQuery = supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      if (search) {
        const searchCondition = `email.ilike.%${search}%,first_name.ilike.%${search}%,full_name.ilike.%${search}%,business_type.ilike.%${search}%`;
        query = query.or(searchCondition);
        countQuery = countQuery.or(searchCondition);
      }

      const [usersResponse, countResponse] = await Promise.all([
        query,
        countQuery,
      ]);

      if (usersResponse.error || countResponse.error) {
        throw new Error("Failed to fetch users");
      }

      return {
        users: usersResponse.data || [],
        total: countResponse.count || 0,
        page,
        limit,
        totalPages: Math.ceil((countResponse.count || 0) / limit),
      };
    } catch (error) {
      console.error("Admin users fetch error:", error);
      throw error;
    }
  },
  ["admin-users"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["admin-users"],
  }
);

// Get user feedback (both post and user feedback)
export const getUserFeedback = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminServiceClient();

    try {
      const [postFeedbackResponse, userFeedbackResponse] = await Promise.all([
        supabase
          .from("post_feedback")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("user_feedback")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (postFeedbackResponse.error || userFeedbackResponse.error) {
        throw new Error("Failed to fetch user feedback");
      }

      const postFeedback = (postFeedbackResponse.data || []).map((f) => ({
        ...f,
        source: "post_feedback",
      }));

      const userFeedback = (userFeedbackResponse.data || []).map((f) => ({
        ...f,
        source: "user_feedback",
      }));

      // Combine and sort by created_at
      const allFeedback = [...postFeedback, ...userFeedback].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allFeedback;
    } catch (error) {
      console.error("User feedback fetch error:", error);
      throw error;
    }
  },
  ["user-feedback"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["user-feedback"],
  }
);

// Get user prompts
export const getUserPrompts = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminServiceClient();

    try {
      const { data, error } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error("Failed to fetch user prompts");
      }

      return data || [];
    } catch (error) {
      console.error("User prompts fetch error:", error);
      throw error;
    }
  },
  ["user-prompts"],
  {
    revalidate: 600, // Cache for 10 minutes
    tags: ["user-prompts"],
  }
);

// Revalidation helpers for admin
export async function revalidateAdminDashboard() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("admin-dashboard");
}

export async function revalidateAdminUsers() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("admin-users");
}

export async function revalidateUserData(userId: string) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`admin-user-${userId}`);
}

export async function revalidateUserFeedback(userId: string) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`user-feedback-${userId}`);
}

export async function revalidateUserPrompts(userId: string) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`user-prompts-${userId}`);
}
 