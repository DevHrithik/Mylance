import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PromptGeneratorWrapper from "@/components/admin/prompts/PromptGeneratorWrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  ideal_target_client?: string | null;
  client_pain_points?: string | null;
  unique_value_proposition?: string | null;
  proof_points?: string | null;
  energizing_topics?: string | null;
  decision_makers?: string | null;
  content_strategy?: string | null;
}

async function getUsersData(): Promise<{
  users: UserWithDetails[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      first_name,
      ideal_target_client,
      client_pain_points,
      unique_value_proposition,
      proof_points,
      energizing_topics,
      decision_makers,
      content_strategy
    `
    )
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return { users: [], error: error.message };
  }

  return { users: users || [], error: null };
}

export default async function PromptsPage() {
  const { users, error } = await getUsersData();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Prompt Management
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading users: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Prompt Management
          </h1>
          <p className="text-gray-600 mt-1">
            Generate and manage LinkedIn content prompts for users using AI
          </p>
        </div>
        <div className="text-sm text-gray-500">{users.length} total users</div>
      </div>

      {/* Prompt Generator */}
      <Suspense fallback={<PromptGeneratorSkeleton />}>
        <PromptGeneratorWrapper users={users} />
      </Suspense>
    </div>
  );
}

// Loading Skeleton
function PromptGeneratorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="bg-white rounded-lg border p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
