import { Suspense } from "react";
import { getWritingProfileData } from "@/lib/supabase/server-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WritingProfileSkeleton } from "@/components/dashboard/skeletons/WritingProfileSkeleton";
import { WritingProfileContent } from "@/components/dashboard/WritingProfileContent";

export default async function WritingProfilePage() {
  const supabase = await createClient();

  // Get user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id; // Extract userId to ensure it's not null

  async function ServerWrapper() {
    try {
      const data = await getWritingProfileData(userId);
      return <WritingProfileContent initialData={data} userId={userId} />;
    } catch (error) {
      console.error("Failed to fetch writing profile data:", error);
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Error Loading Writing Profile
              </h1>
              <p className="text-slate-600">
              There was an error loading your writing profile. Please try again.
              </p>
          </div>
        </div>
      );
    }
  }

  return (
    <Suspense fallback={<WritingProfileSkeleton />}>
      <ServerWrapper />
    </Suspense>
  );
}
