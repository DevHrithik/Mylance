import { Suspense } from "react";
import { getPromptLibraryData } from "@/lib/supabase/server-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PromptLibrarySkeleton } from "@/components/dashboard/skeletons/PromptLibrarySkeleton";
import { PromptLibraryContent } from "@/components/dashboard/PromptLibraryContent";

export default async function PromptLibraryPage() {
  const supabase = await createClient();

  // Get user authentication
      const {
    data: { user },
      } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <Suspense fallback={<PromptLibrarySkeleton />}>
        <PromptLibraryServerWrapper userId={user.id} />
      </Suspense>
    </div>
  );
}

async function PromptLibraryServerWrapper({ userId }: { userId: string }) {
  try {
    const data = await getPromptLibraryData(userId);

    return <PromptLibraryContent initialData={data} userId={userId} />;
  } catch (error) {
    console.error("Failed to fetch prompt library data:", error);
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load prompt library
        </h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }
}
