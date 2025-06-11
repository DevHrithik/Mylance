import { Suspense } from "react";
import { getProfileData } from "@/lib/supabase/server-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileSkeleton } from "@/components/dashboard/skeletons/ProfileSkeleton";
import { ProfileContent } from "@/components/dashboard/ProfileContent";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileServerWrapper userId={user.id} />
    </Suspense>
  );
}

async function ProfileServerWrapper({ userId }: { userId: string }) {
  try {
    const data = await getProfileData(userId);

    return <ProfileContent initialData={data} userId={userId} />;
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="shadow-2xl border-0 bg-white/90 backdrop-blur p-8 text-center rounded-lg">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Failed to load profile
          </h2>
          <p className="text-slate-600">
            Unable to load your profile information. Please try refreshing the
            page.
          </p>
        </div>
      </div>
    );
  }
}
