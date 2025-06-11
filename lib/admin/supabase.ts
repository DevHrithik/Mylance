import { createClient } from "@/lib/supabase/server";
import {
  UserWithDetails,
  AdminTableFilter,
  PaginationParams,
} from "@/lib/types/admin";
import { logAdminActivity } from "./auth";

/**
 * Admin-specific database operations using Supabase MCP
 */

/**
 * Get users with detailed information for admin panel
 */
export async function getAdminUsersList(
  filters: AdminTableFilter = {},
  pagination: PaginationParams = { page: 1, per_page: 20 }
): Promise<{
  users: UserWithDetails[];
  total: number;
  total_pages: number;
}> {
  const supabase = await createClient();

  let query = supabase.from("profiles").select(`
      *,
      subscriptions!inner(plan_type, status, current_period_end),
      posts(count),
      user_preferences(*)
    `);

  // Apply filters
  if (filters.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  if (filters.plan_type) {
    query = query.eq("subscriptions.plan_type", filters.plan_type);
  }

  if (filters.date_range) {
    query = query
      .gte("created_at", filters.date_range.start)
      .lte("created_at", filters.date_range.end);
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.per_page;
  const to = from + pagination.per_page - 1;

  // Get total count
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get paginated results with sorting
  if (pagination.sort_by) {
    query = query.order(pagination.sort_by, {
      ascending: pagination.sort_order === "asc",
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: users, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const total = count || 0;
  const total_pages = Math.ceil(total / pagination.per_page);

  // Transform data to match UserWithDetails interface
  const transformedUsers: UserWithDetails[] = (users || []).map((user) => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    linkedin_url: user.linkedin_url,
    company: user.company,
    company_size: user.company_size,
    department: user.department,
    job_title: user.job_title,
    industry: user.industry,
    location: user.location,
    timezone: user.timezone,
    experience_level: user.experience_level,
    role: user.role,
    onboarding_completed: user.onboarding_completed,
    created_at: user.created_at,
    updated_at: user.updated_at,
    subscription: user.subscriptions?.[0]
      ? {
          plan_type: user.subscriptions[0].plan_type,
          status: user.subscriptions[0].status,
          current_period_end: user.subscriptions[0].current_period_end,
        }
      : undefined,
    post_count: user.posts?.[0]?.count || 0,
    last_login: null, // This field will be available after migration
  }));

  return {
    users: transformedUsers,
    total,
    total_pages,
  };
}

/**
 * Get detailed user information for admin view
 */
export async function getAdminUserDetails(
  userId: string
): Promise<UserWithDetails | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      subscriptions(*),
      user_preferences(*),
      posts(count),
      generation_history(count),
      user_feedback(*)
    `
    )
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    linkedin_url: user.linkedin_url,
    company: user.company,
    company_size: user.company_size,
    department: user.department,
    job_title: user.job_title,
    industry: user.industry,
    location: user.location,
    timezone: user.timezone,
    experience_level: user.experience_level,
    role: user.role,
    onboarding_completed: user.onboarding_completed,
    created_at: user.created_at,
    updated_at: user.updated_at,
    subscription: user.subscriptions?.[0]
      ? {
          plan_type: user.subscriptions[0].plan_type,
          status: user.subscriptions[0].status,
          current_period_end: user.subscriptions[0].current_period_end,
        }
      : undefined,
    post_count: user.posts?.[0]?.count || 0,
    last_login: null, // This field will be available after migration
  };
}

/**
 * Update user profile (admin action)
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserWithDetails>,
  adminId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (!error) {
    // Log admin activity
    await logAdminActivity(adminId, "edit_user", userId, "user", userId, {
      updated_fields: Object.keys(updates),
    });
  }

  return !error;
}

/**
 * Get platform analytics for admin dashboard
 */
export async function getAdminAnalytics(): Promise<{
  totalUsers: number;
  activeSubscriptions: number;
  totalPosts: number;
  newUsersThisWeek: number;
  recentActivity: Array<{
    type: string;
    count: number;
    date: string;
  }>;
}> {
  const supabase = await createClient();

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get active subscriptions
  const { count: activeSubscriptions } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get total posts
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  // Get new users this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: newUsersThisWeek } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  // Get recent activity (simplified for now)
  const recentActivity = [
    {
      type: "new_users",
      count: newUsersThisWeek || 0,
      date: new Date().toISOString(),
    },
    { type: "new_posts", count: 0, date: new Date().toISOString() }, // TODO: Implement
    { type: "active_sessions", count: 0, date: new Date().toISOString() }, // TODO: Implement
  ];

  return {
    totalUsers: totalUsers || 0,
    activeSubscriptions: activeSubscriptions || 0,
    totalPosts: totalPosts || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    recentActivity,
  };
}

/**
 * Delete user account (admin action)
 */
export async function deleteUserAccount(
  userId: string,
  adminId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Log admin activity before deletion
  await logAdminActivity(adminId, "delete_user", userId, "user", userId, {
    reason: "Admin deletion",
  });

  // Delete user profile (cascade will handle related records)
  const { error } = await supabase.from("profiles").delete().eq("id", userId);

  return !error;
}

/**
 * Get content prompts for a user
 */
export async function getUserContentPrompts(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("content_prompts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Create content prompt for user (admin action)
 */
export async function createContentPrompt(
  promptData: {
    user_id: string;
    category: string;
    pillar_number: number;
    pillar_description: string;
    prompt_text: string;
    hook: string;
    scheduled_date?: string;
  },
  adminId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("content_prompts").insert({
    ...promptData,
    is_generated_by_admin: true,
    created_by_admin: adminId,
  });

  if (!error) {
    await logAdminActivity(
      adminId,
      "generate_prompts",
      promptData.user_id,
      "prompt",
      undefined,
      { category: promptData.category }
    );
  }

  return !error;
}

/**
 * Get user feedback for admin review
 */
export async function getUserFeedback(
  limit: number = 50,
  unresolved_only: boolean = false
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from("user_feedback")
    .select(
      `
      *,
      profiles(email, first_name),
      content_prompts(prompt_text, category)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unresolved_only) {
    query = query.eq("is_resolved", false);
  }

  const { data } = await query;
  return data || [];
}
