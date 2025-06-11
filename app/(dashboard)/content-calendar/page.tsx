import { Suspense } from "react";
import { getContentCalendarData } from "@/lib/supabase/server-queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ContentCalendarSkeleton } from "@/components/dashboard/skeletons/ContentCalendarSkeleton";
import { ContentCalendarContent } from "@/components/dashboard/ContentCalendarContent";

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();

  // Get user authentication
      const {
    data: { user },
      } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;

  return (
    <div className="">
      <Suspense fallback={<ContentCalendarSkeleton />}>
        <ContentCalendarServerWrapper
          userId={user.id}
          {...(resolvedSearchParams.date && {
            selectedDate: resolvedSearchParams.date,
          })}
        />
      </Suspense>
    </div>
  );
}

async function ContentCalendarServerWrapper({
  userId,
  selectedDate,
}: {
  userId: string;
  selectedDate?: string | undefined;
}) {
  try {
    const data = await getContentCalendarData(userId);

    return (
      <ContentCalendarContent
        initialData={data}
        userId={userId}
        {...(selectedDate && { selectedDate })}
      />
    );
  } catch (error) {
    console.error("Failed to fetch content calendar data:", error);
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load calendar data
        </h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }
}
