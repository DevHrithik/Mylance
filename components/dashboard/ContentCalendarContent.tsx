"use client";

import { useState, useEffect } from "react";
import { PromptCalendar } from "@/components/dashboard/PromptCalendar";
import { PromptLibrary } from "@/components/dashboard/PromptLibrary";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

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

interface ContentCalendarData {
  prompts: any[];
  posts: any[];
}

interface ContentCalendarContentProps {
  initialData: ContentCalendarData;
  userId: string;
  selectedDate?: string;
}

export function ContentCalendarContent({
  initialData,
  userId,
  selectedDate,
}: ContentCalendarContentProps) {
  const [prompts, setPrompts] = useState<any[]>(initialData.prompts);
  const [posts, setPosts] = useState<GeneratedPost[]>(
    (initialData.posts || []).map((post: any) => ({
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
    }))
  );
  const [activeView, setActiveView] = useState<"calendar" | "library">(
    "calendar"
  );

  const supabase = createClient();

  const fetchData = async () => {
    try {
      // Fetch prompts - only those pushed to calendar
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", userId)
        .eq("pushed_to_calendar", true)
        .order("scheduled_date", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false });

      if (promptsError) {
        console.error("Prompts error:", promptsError);
        throw promptsError;
      }

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
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
    }
  };

  return (
    <div className="">
      {activeView === "calendar" ? (
        <PromptCalendar
          prompts={prompts}
          posts={posts}
          onPromptsChange={fetchData}
          selectedDate={selectedDate || null}
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
