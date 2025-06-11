import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsData } from "@/lib/supabase/server-queries";
import { PostsContent } from "@/components/posts/PostsContent";
import { PostsSkeleton } from "@/components/posts/PostsSkeleton";

export const metadata: Metadata = {
  title: "Posts | Mylance",
  description: "Manage your LinkedIn content library",
};

interface PostsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    search?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  try {
    const supabase = await createClient();

    // Get user authentication with timeout
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), 5000)
    );

    const result = await Promise.race([userPromise, timeoutPromise]);
    const {
      data: { user },
    } = result as { data: { user: any } };

    if (!user) {
      redirect("/login");
    }

    const resolvedSearchParams = await searchParams;

    return (
      <Suspense fallback={<PostsSkeleton />}>
        <PostsServerWrapper
          userId={user.id}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Posts page auth error:", error);
    redirect("/login");
  }
}

async function PostsServerWrapper({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: {
    page?: string;
    status?: string;
    type?: string;
    search?: string;
  };
}) {
  try {
    const page = parseInt(searchParams.page || "1", 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    // Add timeout to data fetching to prevent hangs
    const dataPromise = getPostsData(userId, limit, offset);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Data fetch timeout")), 10000)
    );

    const data = (await Promise.race([dataPromise, timeoutPromise])) as Awaited<
      ReturnType<typeof getPostsData>
    >;

    return (
      <PostsContent
        initialData={data}
        userId={userId}
        searchParams={searchParams}
      />
    );
  } catch (error) {
    console.error("Failed to fetch posts data:", error);
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load posts data
        </h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }
}
