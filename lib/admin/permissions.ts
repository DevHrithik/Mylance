import { AdminAction, AdminPermissions } from "@/lib/types/admin";

/**
 * Default permission sets for different admin roles
 */
export const DEFAULT_PERMISSIONS = {
  admin: [
    "read",
    "write",
    "user_read",
    "user_write",
    "prompt_write",
    "analytics_read",
    "feedback_write",
  ],
  super_admin: [
    "super_admin", // This grants all permissions
    "read",
    "write",
    "delete",
    "user_read",
    "user_write",
    "user_delete",
    "prompt_write",
    "prompt_delete",
    "analytics_read",
    "feedback_write",
    "impersonate",
    "export",
    "system_admin",
  ],
} as const;

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS = {
  read: "View data and content",
  write: "Create and edit content",
  delete: "Delete content and data",
  user_read: "View user profiles and data",
  user_write: "Edit user profiles and settings",
  user_delete: "Delete user accounts",
  prompt_write: "Create and edit content prompts",
  prompt_delete: "Delete content prompts",
  analytics_read: "View analytics and reports",
  feedback_write: "Respond to user feedback",
  impersonate: "Impersonate users for support",
  export: "Export platform data",
  system_admin: "Access system configuration",
  super_admin: "Full administrative access",
} as const;

/**
 * Action permission requirements mapping
 */
export const ACTION_REQUIREMENTS: Record<AdminAction, string[]> = {
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

/**
 * Check if permissions allow a specific action
 */
export function hasPermissionForAction(
  userPermissions: string[],
  action: AdminAction
): boolean {
  // Super admin can do everything
  if (userPermissions.includes("super_admin")) {
    return true;
  }

  const requiredPermissions = ACTION_REQUIREMENTS[action] || [];
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Get admin capabilities from permissions array
 */
export function getCapabilitiesFromPermissions(
  permissions: string[]
): AdminPermissions {
  const isSuperAdmin = permissions.includes("super_admin");

  return {
    canViewUsers:
      isSuperAdmin || hasPermissionForAction(permissions, "view_user"),
    canEditUsers:
      isSuperAdmin || hasPermissionForAction(permissions, "edit_user"),
    canDeleteUsers:
      isSuperAdmin || hasPermissionForAction(permissions, "delete_user"),
    canGeneratePrompts:
      isSuperAdmin || hasPermissionForAction(permissions, "generate_prompts"),
    canViewAnalytics:
      isSuperAdmin || hasPermissionForAction(permissions, "view_analytics"),
    canManageFeedback:
      isSuperAdmin || hasPermissionForAction(permissions, "respond_feedback"),
    canImpersonateUsers:
      isSuperAdmin || hasPermissionForAction(permissions, "impersonate_user"),
    canAccessSystemSettings:
      isSuperAdmin || hasPermissionForAction(permissions, "system_config"),
  };
}

/**
 * Validate permission array
 */
export function validatePermissions(permissions: string[]): boolean {
  const validPermissions = Object.keys(PERMISSION_DESCRIPTIONS);
  return permissions.every((perm) => validPermissions.includes(perm));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    admin: "Administrator",
    super_admin: "Super Administrator",
  };

  return roleNames[role] || role;
}

/**
 * Get available permissions for role selection
 */
export function getAvailablePermissions(): Array<{
  value: string;
  label: string;
  description: string;
}> {
  return Object.entries(PERMISSION_DESCRIPTIONS).map(
    ([value, description]) => ({
      value,
      label: value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description,
    })
  );
}

/**
 * Check if user can manage another user's permissions
 */
export function canManageUserPermissions(
  adminPermissions: string[],
  targetUserPermissions: string[]
): boolean {
  const adminIsSuperAdmin = adminPermissions.includes("super_admin");
  const targetIsSuperAdmin = targetUserPermissions.includes("super_admin");

  // Super admin can manage anyone except other super admins (unless they are also super admin)
  if (adminIsSuperAdmin) {
    return true;
  }

  // Regular admin cannot manage super admins
  if (targetIsSuperAdmin) {
    return false;
  }

  // Regular admin can manage other regular users if they have system_admin permission
  return adminPermissions.includes("system_admin");
}
