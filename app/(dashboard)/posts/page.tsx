import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostList } from "@/components/posts/PostList";
import { PostsSkeleton } from "@/components/posts/PostsSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PenTool, Search, Filter, BarChart3 } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Posts | Mylance",
  description: "Manage your LinkedIn content library",
};

export const revalidate = 180; // Revalidate every 3 minutes

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

interface PostsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    search?: string;
  }>;
}

async function PostsPage({ searchParams }: PostsPageProps) {
  // Await searchParams for Next.js 15 compatibility
  const resolvedSearchParams = await searchParams;
  // Server-side authentication check
  const user = await getAuthenticatedUser();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your LinkedIn posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link href={ROUTES.CONTENT_CALENDAR}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PenTool className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts by title or content..."
            className="pl-10"
            defaultValue={resolvedSearchParams.search || ""}
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue={resolvedSearchParams.status || "all"}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="used">Posted</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue={resolvedSearchParams.type || "all"}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="thought-leadership">
                Thought Leadership
              </SelectItem>
              <SelectItem value="personal-story">Personal Story</SelectItem>
              <SelectItem value="industry-insight">Industry Insight</SelectItem>
              <SelectItem value="tips-advice">Tips & Advice</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Posts List with Rich UI */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  );
}

export default PostsPage;
