import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePostSkeleton } from "@/components/posts/CreatePostSkeleton";
import { CreatePostContent } from "@/components/posts/CreatePostContent";

export const metadata: Metadata = {
  title: "Create Post | Mylance",
  description: "Create and edit LinkedIn posts with AI assistance",
};

interface CreatePostPageProps {
  searchParams: Promise<{
    prompt?: string;
    edit?: string;
  }>;
}

export default async function CreatePostPage({
  searchParams,
}: CreatePostPageProps) {
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
      <Suspense fallback={<CreatePostSkeleton />}>
        <CreatePostServerWrapper
          userId={user.id}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Create post page auth error:", error);
    redirect("/login");
  }
}

async function CreatePostServerWrapper({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: {
    prompt?: string;
    edit?: string;
  };
}) {
  try {
    const supabase = await createClient();
    let initialData: {
      type: "prompt" | "edit";
      data: any;
    } | null = null;

    // Pre-fetch data if needed
    if (searchParams.edit) {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", parseInt(searchParams.edit))
        .eq("user_id", userId)
        .single();

      if (postError) {
        console.error("Failed to fetch post for editing:", postError);
        return (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Post not found
            </h3>
            <p className="text-gray-600">
              The post you're trying to edit doesn't exist or you don't have
              permission to edit it.
            </p>
          </div>
        );
      }

      initialData = { type: "edit", data: postData };
    } else if (searchParams.prompt) {
      const { data: promptData, error: promptError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("id", parseInt(searchParams.prompt))
        .eq("user_id", userId)
        .single();

      if (promptError) {
        console.error("Failed to fetch prompt:", promptError);
        return (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Prompt not found
            </h3>
            <p className="text-gray-600">
              The prompt you're trying to use doesn't exist or you don't have
              access to it.
            </p>
          </div>
        );
      }

      initialData = { type: "prompt", data: promptData };
    }

    return (
      <CreatePostContent
        userId={userId}
        searchParams={searchParams}
        initialData={initialData}
      />
    );
  } catch (error) {
    console.error("Failed to load create post data:", error);
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load editor
        </h3>
        <p className="text-gray-600">Please try refreshing the page.</p>
      </div>
    );
  }
}
