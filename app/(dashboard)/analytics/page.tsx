import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { getAnalyticsData } from "@/lib/supabase/server-queries";

export const metadata: Metadata = {
  title: "Analytics - Mylance",
  description: "Track your LinkedIn content performance and engagement",
};

export const revalidate = 600; // 10 minutes

async function AnalyticsWrapper() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pre-fetch analytics data on the server for better performance
  const analyticsData = await getAnalyticsData(user.id);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Track your LinkedIn content performance and get AI-powered insights
        </p>
      </div>

      <AnalyticsDashboard initialData={analyticsData} userId={user.id} />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsWrapper />
    </Suspense>
  );
}
