"use client";

import { useState, useEffect } from "react";
import { PromptCalendar } from "@/components/dashboard/PromptCalendar";
import { PromptLibrary } from "@/components/dashboard/PromptLibrary";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface GeneratedPost {
  id: number;
  title: string | null;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  posted_at: string | null;
  created_at: string;
  hashtags?: string[];
  performance?: {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export default function ContentCalendarPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"calendar" | "library">(
    "calendar"
  );

  const supabase = createClient();
  const searchParams = useSearchParams();

  // Get date from URL params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Fetch prompts - only those pushed to calendar
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("pushed_to_calendar", true)
        .order("created_at", { ascending: false });

      if (promptsError) {
        console.error("Prompts error:", promptsError);
        throw promptsError;
      }

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Posts error:", postsError);
        throw postsError;
      }

      // Format posts
      const formattedPosts: GeneratedPost[] = (postsData || []).map(
        (post: any) => ({
          id: parseInt(post.id),
          title: post.title,
          content: post.content,
          status: post.status,
          content_type: post.content_type || "",
          posted_at: post.posted_at,
          created_at: post.created_at,
          hashtags: post.hashtags || [],
          performance: {
            impressions: 0,
            likes: 0,
            comments: 0,
            shares: 0,
          },
        })
      );

      setPrompts(promptsData || []);
      setPosts(formattedPosts);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="">
      {activeView === "calendar" ? (
        <PromptCalendar
          prompts={prompts}
          posts={posts}
          onPromptsChange={fetchData}
          selectedDate={selectedDate}
          activeView={activeView}
          onViewChange={setActiveView}
          onMakeDefault={() => {
            // This method is no longer used in the new structure
          }}
        />
      ) : (
        <PromptLibrary
          prompts={prompts}
          onPromptsChange={fetchData}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      )}
    </div>
  );
}
