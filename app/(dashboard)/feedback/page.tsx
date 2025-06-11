import { Suspense } from "react";
import { getFeedbackData } from "@/lib/supabase/server-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedbackSkeleton } from "@/components/dashboard/skeletons/FeedbackSkeleton";
import { FeedbackContent } from "@/components/dashboard/FeedbackContent";

export default async function FeedbackPage() {
  const supabase = await createClient();

  // Get user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<FeedbackSkeleton />}>
      <FeedbackServerWrapper userId={user.id} />
    </Suspense>
  );
}

async function FeedbackServerWrapper({ userId }: { userId: string }) {
  try {
    const data = await getFeedbackData(userId);

    return <FeedbackContent initialData={data} userId={userId} />;
    } catch (error) {
    console.error("Failed to fetch feedback data:", error);
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load feedback data
        </h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }
}
