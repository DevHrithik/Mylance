import { createClient } from "@/lib/supabase/server";
import { AdminUser, AdminPermissions, AdminAction } from "@/lib/types/admin";

/**
 * Check if a user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return data?.is_admin || false;
}

/**
 * Get admin user details
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}

/**
 * Get admin permissions for a user
 */
export async function getAdminPermissions(userId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("admin_users")
    .select("permissions")
    .eq("user_id", userId)
    .single();

  return data?.permissions || [];
}

/**
 * Check if user has specific admin permission
 */
export async function hasAdminPermission(
  userId: string,
  action: AdminAction
): Promise<boolean> {
  const permissions = await getAdminPermissions(userId);

  // Super admins can do everything
  if (permissions.includes("super_admin")) {
    return true;
  }

  // Map actions to required permissions
  const permissionMap: Record<AdminAction, string[]> = {
    view_user: ["read", "user_read"],
    edit_user: ["write", "user_write"],
    delete_user: ["delete", "user_delete"],
    generate_prompts: ["write", "prompt_write"],
    edit_prompt: ["write", "prompt_write"],
    delete_prompt: ["delete", "prompt_delete"],
    view_analytics: ["read", "analytics_read"],
    respond_feedback: ["write", "feedback_write"],
    impersonate_user: ["impersonate"],
    export_data: ["export"],
    system_config: ["system_admin"],
  };

  const requiredPerms = permissionMap[action] || [];
  return requiredPerms.some((perm) => permissions.includes(perm));
}

/**
 * Create an admin user
 */
export async function createAdminUser(
  userId: string,
  role: "admin" | "super_admin" = "admin",
  permissions: string[] = ["read", "write"]
): Promise<AdminUser | null> {
  const supabase = await createClient();

  // First mark user as admin in profiles
  await supabase.from("profiles").update({ is_admin: true }).eq("id", userId);

  // Create admin_users record
  const { data } = await supabase
    .from("admin_users")
    .insert({
      user_id: userId,
      role,
      permissions,
    })
    .select()
    .single();

  return data;
}

/**
 * Log admin activity
 */
export async function logAdminActivity(
  adminId: string,
  action: string,
  targetUserId?: string,
  targetType?: string,
  targetId?: string,
  details: Record<string, any> = {}
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("admin_activity_log").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    target_type: targetType,
    target_id: targetId,
    details,
  });
}

/**
 * Check if current session user is admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  const adminUser = await getAdminUser(user.id);
  if (!adminUser) {
    throw new Error("Admin access required");
  }

  return adminUser;
}

/**
 * Get admin capabilities based on role and permissions
 */
export async function getAdminCapabilities(
  userId: string
): Promise<AdminPermissions> {
  const permissions = await getAdminPermissions(userId);
  const isSuperAdmin = permissions.includes("super_admin");

  return {
    canViewUsers:
      isSuperAdmin ||
      permissions.includes("read") ||
      permissions.includes("user_read"),
    canEditUsers:
      isSuperAdmin ||
      permissions.includes("write") ||
      permissions.includes("user_write"),
    canDeleteUsers:
      isSuperAdmin ||
      permissions.includes("delete") ||
      permissions.includes("user_delete"),
    canGeneratePrompts:
      isSuperAdmin ||
      permissions.includes("write") ||
      permissions.includes("prompt_write"),
    canViewAnalytics:
      isSuperAdmin ||
      permissions.includes("read") ||
      permissions.includes("analytics_read"),
    canManageFeedback:
      isSuperAdmin ||
      permissions.includes("write") ||
      permissions.includes("feedback_write"),
    canImpersonateUsers: isSuperAdmin || permissions.includes("impersonate"),
    canAccessSystemSettings:
      isSuperAdmin || permissions.includes("system_admin"),
  };
}
