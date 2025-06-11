import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/supabase/server-queries";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export const revalidate = 300; // Revalidate every 5 minutes

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

async function DashboardPage() {
  // Server-side authentication check
  const user = await getAuthenticatedUser();

  // Pre-fetch dashboard data on the server
  let dashboardData;
  try {
    dashboardData = await getDashboardData(user.id);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Redirect to error page or show error component
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent initialData={dashboardData} userId={user.id} />
      </Suspense>
    </div>
  );
}

export default DashboardPage;
