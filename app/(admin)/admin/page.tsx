import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/lib/supabase/admin-server-queries";
import AdminDashboardContent from "@/components/admin/dashboard/AdminDashboardContent";
import { Suspense } from "react";
import AdminDashboardSkeleton from "@/components/admin/dashboard/AdminDashboardSkeleton";

export default async function AdminPage() {
  // Server-side authentication check
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email, first_name, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  // Pre-fetch admin dashboard data on server
  let adminData;
  try {
    adminData = await getAdminDashboardData();
  } catch (error) {
    console.error("Failed to fetch admin dashboard data:", error);
    adminData = {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboardContent
          adminData={adminData}
          adminUser={{
            first_name: profile.first_name,
            full_name: profile.full_name,
            email: profile.email,
            role: "admin",
          }}
        />
      </Suspense>
    </div>
  );
}
