import { createClient } from "@/lib/supabase/server";
import { createClient as createClientBrowser } from "@/lib/supabase/client";

/**
 * Development utility to set up admin users
 * This should only be used in development/testing environments
 */

export interface AdminSetupResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Get the appropriate Supabase client based on environment
 */
async function getSupabaseClient() {
  // Check if we're in a server environment
  if (typeof window === "undefined") {
    return await createClient();
  } else {
    return createClientBrowser();
  }
}

/**
 * Make an existing user an admin
 */
export async function makeUserAdmin(email: string): Promise<AdminSetupResult> {
  try {
    const supabase = await getSupabaseClient();

    // Call the database function to make user admin
    const { data, error } = await supabase.rpc("make_user_admin", {
      user_email: email,
    });

    if (error) {
      console.error("Error making user admin:", error);
      return {
        success: false,
        message: `Failed to make user admin: ${error.message}`,
      };
    }

    if (data === false) {
      return {
        success: false,
        message: `User with email ${email} not found. Please create an account first.`,
      };
    }

    return {
      success: true,
      message: `Successfully made ${email} an admin user with super_admin role`,
    };
  } catch (error) {
    console.error("Error in makeUserAdmin:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Check if a user is admin
 */
export async function checkAdminStatus(email: string): Promise<{
  isAdmin: boolean;
  role?: string;
  permissions?: string[];
}> {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.rpc("check_admin_status", {
      user_email: email,
    });

    if (error || !data || data.length === 0) {
      return { isAdmin: false };
    }

    const userData = data[0];
    return {
      isAdmin: userData.is_admin || false,
      role: userData.admin_role,
      permissions: userData.permissions,
    };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAdmin: false };
  }
}

/**
 * Development helper to ensure admin@mylance.co is set up
 * Call this in development to automatically set up the admin user
 */
export async function ensureAdminUser(): Promise<AdminSetupResult> {
  const adminEmail = "admin@mylance.co";

  // Check if already admin
  const status = await checkAdminStatus(adminEmail);
  if (status.isAdmin) {
    return {
      success: true,
      message: `${adminEmail} is already an admin with role: ${status.role}`,
    };
  }

  // Try to make them admin
  return await makeUserAdmin(adminEmail);
}

/**
 * List all admin users
 */
export async function listAdminUsers(): Promise<
  Array<{
    email: string;
    first_name: string;
    role: string;
    permissions: string[];
  }>
> {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        email,
        first_name,
        admin_users!inner(role, permissions)
      `
      )
      .eq("is_admin", true);

    if (error) {
      console.error("Error listing admin users:", error);
      return [];
    }

    return (data || []).map((user: any) => ({
      email: user.email,
      first_name: user.first_name || "Unknown",
      role:
        Array.isArray(user.admin_users) && user.admin_users.length > 0
          ? user.admin_users[0].role
          : "Unknown",
      permissions:
        Array.isArray(user.admin_users) && user.admin_users.length > 0
          ? user.admin_users[0].permissions || []
          : [],
    }));
  } catch (error) {
    console.error("Error in listAdminUsers:", error);
    return [];
  }
}
