"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Edit,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  BarChart3,
  CheckCircle,
  ExternalLink,
  Lock,
  PenTool,
  AlertTriangle,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share,
  MousePointer,
  StickyNote,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface Post {
  id: string;
  title: string | null;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  tone?: string | null;
  created_at: string;
  updated_at: string;
  posted_at?: string | null;
  scheduled_date?: string | null;
  hashtags?: string[] | null;
  topics?: string[] | null;
  linkedin_url?: string | null;
  ai_prompt_used?: string | null;
  generation_metadata?: any;
  hasAnalytics?: boolean;
  needsAnalytics?: boolean;
  analyticsData?:
    | {
        impressions: number;
        likes: number;
        comments: number;
        shares: number;
        engagement_rate: number;
      }
    | undefined;
}

interface PostsData {
  posts: Post[];
  stats: {
    totalPosts: number;
    draftPosts: number;
    publishedPosts: number;
    archivedPosts: number;
    postsNeedingAnalytics: number;
  };
  totalCount: number;
}

interface PostsContentProps {
  initialData: PostsData;
  userId: string;
  searchParams: {
    page?: string;
    status?: string;
    type?: string;
    search?: string;
    draft?: string;
    updated?: string;
  };
}

interface PostPerformance {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  notes?: string;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  used: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-orange-100 text-orange-700 border-orange-200",
};

// PostContentPreview component with Read More functionality
function PostContentPreview({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 150; // Characters to show before "Read more"

  const shouldShowReadMore = content.length > maxLength;
  const displayContent =
    isExpanded || !shouldShowReadMore
      ? content
      : content.substring(0, maxLength) + "...";

  return (
    <div className="text-sm text-gray-600 mb-3 flex-grow">
      <p className={`${isExpanded ? "" : "line-clamp-3"}`}>{displayContent}</p>
      {shouldShowReadMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1 transition-colors"
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export function PostsContent({
  initialData,
  userId,
  searchParams,
}: PostsContentProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState(initialData.posts);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [dateEditDialogOpen, setDateEditDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [analyticsData, setAnalyticsData] = useState<PostPerformance>({
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    notes: "",
  });
  const [postToArchive, setPostToArchive] = useState<Post | null>(null);

  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(
    null
  );

  // Debug log whenever highlightedPostId changes
  useEffect(() => {
    console.log("🎯 HIGHLIGHT STATE CHANGED:", highlightedPostId);
  }, [highlightedPostId]);

  const [searchTerm, setSearchTerm] = useState(searchParams.search || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.status || "all"
  );
  const [typeFilter, setTypeFilter] = useState(searchParams.type || "all");
  const [needsAnalyticsFilter, setNeedsAnalyticsFilter] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Helper function to handle auth errors
  const handleAuthError = (error: any) => {
    console.error("Auth error:", error);
    if (
      error?.message?.includes("timeout") ||
      error?.message?.includes("session")
    ) {
      router.push("/login");
      return;
    }
  };

  useEffect(() => {
    console.log("🔥 USEEFFECT TRIGGERED - Starting highlight logic");
    const draftId = searchParams.draft;
    const updatedId = searchParams.updated;

    console.log("PostsContent: searchParams:", {
      draftId,
      updatedId,
      searchParams,
      allSearchParams: Object.keys(searchParams),
    });

    // Check localStorage as fallback
    let targetId = draftId || updatedId;
    let highlightType = draftId ? "draft" : updatedId ? "updated" : null;

    if (!targetId) {
      try {
        const stored = localStorage.getItem("highlightPost");
        if (stored) {
          const highlight = JSON.parse(stored);
          // Only use if within last 30 seconds
          if (Date.now() - highlight.timestamp < 30000) {
            targetId = highlight.id;
            highlightType = highlight.type;
            console.log(
              "PostsContent: Using localStorage highlight:",
              highlight
            );
          }
          // Clean up localStorage
          localStorage.removeItem("highlightPost");
        }
      } catch (error) {
        console.error("Error reading localStorage highlight:", error);
      }
    }

    if (targetId) {
      console.log(
        "PostsContent: Setting highlighted post ID:",
        targetId,
        "type:",
        typeof targetId
      );
      // Ensure targetId is a string for consistent comparison
      const targetIdStr = String(targetId);
      setHighlightedPostId(targetIdStr);

      const message =
        highlightType === "draft"
          ? "✨ Post saved as draft successfully! You can find it below."
          : "✨ Post updated successfully! You can see your changes below.";
      toast.success(message, {
        duration: 4000,
      });

      // Only refresh if the post is not found in current data
      const postExists = data.posts.some((post) => post.id === targetId);
      console.log("PostsContent: Post exists in current data:", postExists);

      if (highlightType === "draft" && !postExists) {
        console.log("PostsContent: Post not found, refreshing data...");
        // Use a timeout to call refresh after component initialization
        setTimeout(async () => {
          try {
            const response = await fetch(
              `/api/posts/refresh?userId=${userId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to refresh posts");
            }

            const refreshedData = await response.json();
            setData(refreshedData);
          } catch (error) {
            console.error("Failed to refresh posts after creation:", error);
          }
        }, 100);
      }

      // Scroll to highlighted post after a brief delay
      const scrollToPost = () => {
        const highlightedElement = document.querySelector(
          `[data-post-id="${targetId}"]`
        );
        console.log(
          "PostsContent: Looking for element with data-post-id:",
          targetId,
          highlightedElement
        );
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          // If not found, try again after a short delay
          setTimeout(scrollToPost, 200);
        }
      };

      setTimeout(scrollToPost, 300);

      // Remove highlight and URL params after 8 seconds
      setTimeout(() => {
        console.log("PostsContent: Removing highlight for:", targetId);
        setHighlightedPostId(null);
        // Clean up URL without triggering navigation
        const url = new URL(window.location.href);
        url.searchParams.delete("draft");
        url.searchParams.delete("updated");
        window.history.replaceState({}, "", url.toString());
      }, 8000);
    }
  }, [searchParams.draft, searchParams.updated, data.posts]);

  useEffect(() => {
    let filtered = data.posts;

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (needsAnalyticsFilter) {
      // Filter for posts that need analytics (used posts without analytics)
      filtered = filtered.filter((post) => post.needsAnalytics === true);
    } else if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((post) => post.content_type === typeFilter);
    }

    setFilteredPosts(filtered);
  }, [data.posts, searchTerm, statusFilter, typeFilter, needsAnalyticsFilter]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      // Always put highlighted post at the very top
      if (highlightedPostId) {
        const highlightIdStr = String(highlightedPostId);
        if (String(a.id) === highlightIdStr) return -1;
        if (String(b.id) === highlightIdStr) return 1;
      }

      // Get the most relevant date for each post for sorting
      // Priority: scheduled_date > posted_at > updated_at > created_at
      const getRelevantDate = (post: Post) => {
        if (post.scheduled_date) return new Date(post.scheduled_date);
        if (post.posted_at) return new Date(post.posted_at);
        if (post.updated_at) return new Date(post.updated_at);
        return new Date(post.created_at);
      };

      const aDate = getRelevantDate(a);
      const bDate = getRelevantDate(b);

      // Sort from furthest in the future to the past (reverse chronological)
      return bDate.getTime() - aDate.getTime();
    });
  }, [filteredPosts, highlightedPostId]);

  const refetch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh posts");
      }

      const refreshedData = await response.json();
      setData(refreshedData);
      toast.success("Posts refreshed successfully");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh posts");
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Check if it's a date-only string (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // For date-only strings, parse as local date to avoid timezone shifts
      const [yearStr, monthStr, dayStr] = dateString.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (
        !isNaN(year) &&
        !isNaN(month) &&
        !isNaN(day) &&
        yearStr &&
        monthStr &&
        dayStr
      ) {
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } else {
        return dateString; // fallback to raw string if invalid
      }
    } else {
      // For ISO datetime strings, handle normally
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusBadge = (
    status: Post["status"],
    needsAnalytics?: boolean,
    isScheduled?: boolean
  ) => {
    const colors = statusColors[status];
    const className = `text-xs font-medium px-2 py-1 rounded-full border ${colors}`;

    if (status === "used" && needsAnalytics) {
      return (
        <Badge className="text-xs bg-red-50 text-red-700 border-red-200">
          📊 Needs Analytics
        </Badge>
      );
    }

    if (status === "draft" && isScheduled) {
      return (
        <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          📅 SCHEDULED
        </Badge>
      );
    }

    return <Badge className={className}>{status.toUpperCase()}</Badge>;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handleMarkAsPosted = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "used",
          posted_at: new Date().toISOString(),
        })
        .eq("id", parseInt(postId));

      if (error) throw error;

      // Revalidate the posts cache to ensure data persists
      await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
      });

      setData((prevData) => ({
        ...prevData,
        posts: prevData.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: "used" as const,
                posted_at: new Date().toISOString(),
                needsAnalytics: true,
              }
            : post
        ),
        stats: {
          ...prevData.stats,
          draftPosts: prevData.stats.draftPosts - 1,
          publishedPosts: prevData.stats.publishedPosts + 1,
        },
      }));

      toast.success("Post marked as posted!");
    } catch (error) {
      console.error("Error marking post as posted:", error);
      toast.error("Failed to mark post as posted");
    }
  };

  const handleEdit = (post: Post) => {
    window.location.href = `/posts/edit/${post.id}`;
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", parseInt(postId));

      if (error) throw error;

      // Revalidate the posts cache to ensure data persists
      await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
      });

      setData((prevData) => ({
        ...prevData,
        posts: prevData.posts.filter((post) => post.id !== postId),
        stats: {
          ...prevData.stats,
          totalPosts: prevData.stats.totalPosts - 1,
          draftPosts:
            prevData.posts.find((p) => p.id === postId)?.status === "draft"
              ? prevData.stats.draftPosts - 1
              : prevData.stats.draftPosts,
          publishedPosts:
            prevData.posts.find((p) => p.id === postId)?.status === "used"
              ? prevData.stats.publishedPosts - 1
              : prevData.stats.publishedPosts,
          archivedPosts:
            prevData.posts.find((p) => p.id === postId)?.status === "archived"
              ? prevData.stats.archivedPosts - 1
              : prevData.stats.archivedPosts,
        },
      }));

      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleArchive = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "archived" })
        .eq("id", parseInt(postId));

      if (error) throw error;

      // Revalidate the posts cache to ensure data persists
      await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
      });

      setData((prevData) => {
        const currentPost = prevData.posts.find((p) => p.id === postId);
        const currentStatus = currentPost?.status;

        return {
          ...prevData,
          posts: prevData.posts.map((post) =>
            post.id === postId ? { ...post, status: "archived" as const } : post
          ),
          stats: {
            ...prevData.stats,
            archivedPosts: prevData.stats.archivedPosts + 1,
            draftPosts:
              currentStatus === "draft"
                ? prevData.stats.draftPosts - 1
                : prevData.stats.draftPosts,
            publishedPosts:
              currentStatus === "used"
                ? prevData.stats.publishedPosts - 1
                : prevData.stats.publishedPosts,
          },
        };
      });

      // Close the modal
      setArchiveDialogOpen(false);
      setPostToArchive(null);

      toast.success("Post archived successfully!");
    } catch (error) {
      console.error("Error archiving post:", error);
      toast.error("Failed to archive post");
    }
  };

  const handleUnarchive = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "draft" })
        .eq("id", parseInt(postId)); // Convert string ID to integer

      if (error) throw error;

      // Revalidate the posts cache to ensure data persists
      await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
      });

      setData((prevData) => ({
        ...prevData,
        posts: prevData.posts.map((post) =>
          post.id === postId ? { ...post, status: "draft" as const } : post
        ),
        stats: {
          ...prevData.stats,
          archivedPosts: prevData.stats.archivedPosts - 1,
          draftPosts: prevData.stats.draftPosts + 1,
        },
      }));

      toast.success("Post unarchived and moved to drafts!");
    } catch (error) {
      console.error("Error unarchiving post:", error);
      toast.error("Failed to unarchive post");
    }
  };

  const handleSaveAnalytics = async () => {
    if (!selectedPost) return;

    try {
      const engagementRate =
        analyticsData.impressions > 0
          ? ((analyticsData.likes +
              analyticsData.comments +
              analyticsData.shares) /
              analyticsData.impressions) *
            100
          : 0;

      const { error } = await supabase.from("post_analytics").upsert({
        post_id: selectedPost.id,
        user_id: userId,
        impressions: analyticsData.impressions,
        likes: analyticsData.likes,
        comments: analyticsData.comments,
        shares: analyticsData.shares,
        engagement_rate: engagementRate,
        notes: analyticsData.notes || null,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      setData((prevData) => ({
        ...prevData,
        posts: prevData.posts.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                hasAnalytics: true,
                needsAnalytics: false,
                analyticsData: {
                  impressions: analyticsData.impressions,
                  likes: analyticsData.likes,
                  comments: analyticsData.comments,
                  shares: analyticsData.shares,
                  engagement_rate: engagementRate,
                },
              }
            : post
        ),
        stats: {
          ...prevData.stats,
          postsNeedingAnalytics: Math.max(
            0,
            prevData.stats.postsNeedingAnalytics - 1
          ),
        },
      }));

      setAnalyticsData({
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        notes: "",
      });
      setAnalyticsDialogOpen(false);
      setSelectedPost(null);
      toast.success("Analytics saved successfully!");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics");
      handleAuthError(error);
    }
  };

  const openAnalyticsDialog = (post: Post) => {
    setSelectedPost(post);
    setAnalyticsData({
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      notes: "",
    });
    setAnalyticsDialogOpen(true);
  };

  const handleSaveDate = async () => {
    if (!selectedPost) return;

    try {
      setLoading(true);

      let scheduleDate = null;

      // Only process date if selectedDate has a value
      if (selectedDate && selectedDate.trim()) {
        try {
          // Validate the date format (should be YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(selectedDate)) {
            throw new Error("Invalid date format");
          }

          // For date-only fields, just use the YYYY-MM-DD format directly
          scheduleDate = selectedDate;
        } catch (dateError) {
          console.error("Date conversion error:", dateError);
          toast.error("Please enter a valid date");
          return;
        }
      }

      // ONLY update scheduled_date - DO NOT touch status or other fields
      const updateData: { scheduled_date: string | null } = {
        scheduled_date: scheduleDate,
      };

      const { error, data } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", parseInt(selectedPost.id)) // Ensure ID is converted to integer
        .select("id, scheduled_date, status");

      if (error) throw error;

      // Revalidate the posts cache to ensure fresh data on next refresh
      try {
        await fetch(`/api/posts/refresh?userId=${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (cacheError) {
        console.warn("Failed to revalidate cache:", cacheError);
        // Don't fail the operation if cache revalidation fails
      }

      // Update local state with the exact value from database
      setData((prevData) => ({
        ...prevData,
        posts: prevData.posts.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                scheduled_date: scheduleDate,
                // Explicitly preserve status to ensure it doesn't change
                status: post.status,
              }
            : post
        ),
      }));

      // Close dialog and reset state
      setDateEditDialogOpen(false);
      setSelectedPost(null);
      setSelectedDate("");

      const message = scheduleDate
        ? `Post scheduled for ${formatDate(scheduleDate)}`
        : "Schedule removed from post";
      toast.success(message);
    } catch (error) {
      console.error("❌ Error updating schedule:", error);
      toast.error("Failed to update schedule. Please try again.");
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post: Post) => {
    if (post.status === "used") {
      // For used posts, open analytics dialog if they don't have analytics
      if (!post.hasAnalytics) {
        openAnalyticsDialog(post);
      } else {
        // Show a toast indicating the post is published and has analytics
        toast.success("This post has been published and has analytics data!");
      }
      return;
    }
    handleEdit(post);
  };

  const handleStatsCardClick = (filterType: string) => {
    // Reset special filters when clicking regular status filters
    setNeedsAnalyticsFilter(false);

    // Toggle filter - if clicking the same filter, reset to "all"
    if (statusFilter === filterType) {
      setStatusFilter("all");
    } else {
      setStatusFilter(filterType);
    }
  };

  const handleSpecialFilterClick = (filterType: "needsAnalytics") => {
    if (filterType === "needsAnalytics") {
      // Toggle the needs analytics filter
      const newNeedsAnalyticsFilter = !needsAnalyticsFilter;
      setNeedsAnalyticsFilter(newNeedsAnalyticsFilter);

      // Reset status filter when enabling needs analytics filter
      if (newNeedsAnalyticsFilter) {
        setStatusFilter("all");
      }
    }
  };

  const renderPostCard = (post: Post) => {
    // Ensure both IDs are strings for comparison
    const postIdStr = String(post.id);
    const highlightIdStr = highlightedPostId ? String(highlightedPostId) : null;
    const isHighlighted = highlightIdStr === postIdStr;

    console.log(
      `🎨 RENDERING POST: ${postIdStr}, highlighted: ${isHighlighted}, highlightedPostId: ${highlightIdStr}, types: post.id(${typeof post.id}), highlighted(${typeof highlightedPostId})`
    );

    if (isHighlighted) {
      console.log("🔥 POST IS HIGHLIGHTED! Should show blue glow and badge");
    }

    return (
      <Card
        key={post.id}
        data-post-id={post.id}
        className={`hover:shadow-lg transition-all duration-500 cursor-pointer group h-full p-6 ${
          post.needsAnalytics ? "ring-2 ring-red-200 border-red-200" : ""
        } ${
          post.hasAnalytics ? "ring-1 ring-green-200 border-green-200" : ""
        } ${
          isHighlighted
            ? "ring-4 ring-blue-500 border-blue-500 bg-blue-100 shadow-lg transform scale-105 z-10 relative border-4"
            : ""
        }`}
        style={
          isHighlighted
            ? {
                backgroundColor: "#dbeafe",
                borderColor: "#3b82f6",
                boxShadow: "0 10px 15px rgba(59, 130, 246, 0.3)",
                position: "relative",
                zIndex: 10,
              }
            : {}
        }
        onClick={() => handlePostClick(post)}
      >
        {isHighlighted && (
          <div className="mb-3 flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 text-sm font-medium px-3 py-1 animate-bounce">
              {(() => {
                // Check URL params first
                if (searchParams.draft) return "✨ Just Created!";
                if (searchParams.updated) return "✨ Just Updated!";

                // Fallback to localStorage check
                try {
                  const stored = localStorage.getItem("highlightPost");
                  if (stored) {
                    const highlight = JSON.parse(stored);
                    return highlight.type === "draft"
                      ? "✨ Just Created!"
                      : "✨ Just Updated!";
                  }
                } catch (error) {
                  console.error("Error reading localStorage for badge:", error);
                }

                return "✨ Recent Post!";
              })()}
            </Badge>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
          </div>
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(
              post.status,
              post.needsAnalytics,
              post.scheduled_date !== null
            )}
            <Badge variant="outline" className="text-xs">
              {post.content_type || "Post"}
            </Badge>
            {post.hasAnalytics && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-300"
              >
                📊 Analytics
              </Badge>
            )}
          </div>

          {post.status === "used" && post.hasAnalytics && (
            <BarChart3 className="h-4 w-4 text-green-600" />
          )}
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title || post.content.substring(0, 100) + "..."}
        </h3>

        <PostContentPreview content={post.content} />

        {post.hasAnalytics && post.analyticsData && (
          <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-700">
                  {post.analyticsData.impressions.toLocaleString()}
                </div>
                <div className="text-green-600">Views</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">
                  {post.analyticsData.likes}
                </div>
                <div className="text-green-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">
                  {post.analyticsData.comments}
                </div>
                <div className="text-green-600">Comments</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">
                  {post.analyticsData.engagement_rate.toFixed(1)}%
                </div>
                <div className="text-green-600">Engagement</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {post.status === "used" && post.posted_at ? (
              <span>Posted {formatDate(post.posted_at)}</span>
            ) : post.scheduled_date ? (
              <span className="text-blue-600">
                📅 Scheduled {formatDate(post.scheduled_date)}
              </span>
            ) : (
              <span>Created {formatDate(post.created_at)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(post.content);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy content to clipboard</p>
              </TooltipContent>
            </Tooltip>

            {post.status === "draft" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsPosted(post.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as posted</p>
                </TooltipContent>
              </Tooltip>
            ) : post.status === "used" && !post.hasAnalytics ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAnalyticsDialog(post);
                    }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ${
                      post.needsAnalytics
                        ? "border-red-300 bg-red-50 hover:bg-red-100"
                        : ""
                    }`}
                  >
                    <BarChart3
                      className={`h-3 w-3 ${
                        post.needsAnalytics ? "text-red-600" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add analytics</p>
                </TooltipContent>
              </Tooltip>
            ) : post.status === "used" && post.hasAnalytics ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <BarChart3 className="h-3 w-3 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View analytics</p>
                </TooltipContent>
              </Tooltip>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(post)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>

                {post.scheduled_date ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                      // If it's already in YYYY-MM-DD format, use it directly
                      if (
                        post.scheduled_date &&
                        /^\d{4}-\d{2}-\d{2}$/.test(post.scheduled_date)
                      ) {
                        setSelectedDate(post.scheduled_date);
                      } else if (post.scheduled_date) {
                        // Convert ISO datetime to YYYY-MM-DD format
                        const dateOnly =
                          post.scheduled_date.split("T")[0] ?? "";
                        setSelectedDate(dateOnly);
                      } else {
                        setSelectedDate("");
                      }
                      setDateEditDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Edit Schedule
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(post);
                      setSelectedDate("");
                      setDateEditDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Post
                  </DropdownMenuItem>
                )}

                {post.status === "draft" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsPosted(post.id);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Posted
                  </DropdownMenuItem>
                )}

                {post.status === "used" && !post.hasAnalytics && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      openAnalyticsDialog(post);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Add Analytics
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(post.content);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </DropdownMenuItem>

                {post.linkedin_url && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(post.linkedin_url || "", "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on LinkedIn
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {post.status !== "archived" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostToArchive(post);
                      setArchiveDialogOpen(true);
                    }}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Post
                  </DropdownMenuItem>
                )}

                {post.status === "archived" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchive(post.id);
                    }}
                    className="text-green-600 focus:text-green-600"
                  >
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive Post
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(post.id);
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  };

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
          {/* <Button
            onClick={() => {
              console.log("🧪 MANUAL TEST: Setting highlight to first post");
              const firstPost = data.posts[0];
              if (firstPost) {
                setHighlightedPostId(firstPost.id);
                toast.success("Test highlight activated!");
                setTimeout(() => {
                  setHighlightedPostId(null);
                  toast.info("Test highlight removed");
                }, 5000);
              }
            }}
            variant="outline"
            size="sm"
            className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            🧪 Test Highlight
          </Button> */}

          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  statusFilter === "all"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleStatsCardClick("all")}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.stats.totalPosts}
                  </div>
                  <div className="text-sm text-gray-600">Total Posts</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to show all posts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  statusFilter === "draft"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleStatsCardClick("draft")}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.stats.draftPosts}
                  </div>
                  <div className="text-sm text-gray-600">Drafts</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to filter draft posts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  statusFilter === "used"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleStatsCardClick("used")}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.stats.publishedPosts}
                  </div>
                  <div className="text-sm text-gray-600">Published</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to filter published posts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  statusFilter === "archived"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleStatsCardClick("archived")}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.stats.archivedPosts}
                  </div>
                  <div className="text-sm text-gray-600">Archived</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to filter archived posts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                  needsAnalyticsFilter
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSpecialFilterClick("needsAnalytics")}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.stats.postsNeedingAnalytics}
                  </div>
                  <div className="text-sm text-gray-600">Need Analytics</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to filter posts needing analytics</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search posts by title or content..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setNeedsAnalyticsFilter(false); // Reset special filter when using dropdown
            }}
          >
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
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

      {data.stats.postsNeedingAnalytics > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <TrendingUp className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>
              {data.stats.postsNeedingAnalytics} post
              {data.stats.postsNeedingAnalytics > 1 ? "s" : ""}
            </strong>{" "}
            {data.stats.postsNeedingAnalytics > 1 ? "have" : "has"} been posted
            for 5+ days without analytics data. Adding performance data helps
            our AI learn what content works best for your audience!
          </AlertDescription>
        </Alert>
      )}

      {sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <PenTool className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first LinkedIn post to get started
          </p>
          <Button onClick={() => router.push("/content-calendar")}>
            <PenTool className="h-4 w-4 mr-2" />
            Create Your First Post
          </Button>
        </div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPosts.map(renderPostCard)}
          </div>
        </TooltipProvider>
      )}

      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Post Analytics</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="impressions">Impressions</Label>
              <Input
                id="impressions"
                type="number"
                value={analyticsData.impressions}
                onChange={(e) =>
                  setAnalyticsData((prev) => ({
                    ...prev,
                    impressions: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="likes">Likes</Label>
              <Input
                id="likes"
                type="number"
                value={analyticsData.likes}
                onChange={(e) =>
                  setAnalyticsData((prev) => ({
                    ...prev,
                    likes: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Input
                id="comments"
                type="number"
                value={analyticsData.comments}
                onChange={(e) =>
                  setAnalyticsData((prev) => ({
                    ...prev,
                    comments: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="shares">Shares</Label>
              <Input
                id="shares"
                type="number"
                value={analyticsData.shares}
                onChange={(e) =>
                  setAnalyticsData((prev) => ({
                    ...prev,
                    shares: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={analyticsData.notes}
                onChange={(e) =>
                  setAnalyticsData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Any additional notes about this post's performance..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setAnalyticsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAnalytics}>Save Analytics</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dateEditDialogOpen}
        onOpenChange={(open) => {
          setDateEditDialogOpen(open);
          if (!open) {
            setSelectedPost(null);
            setSelectedDate("");
          }
        }}
        key={selectedPost?.id}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPost?.scheduled_date ? "Edit Schedule" : "Schedule Post"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule-date">Scheduled Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  placeholder="Select a date to schedule this post"
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to remove the schedule
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDateEditDialogOpen(false);
                    setSelectedPost(null);
                    setSelectedDate("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSaveDate();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : selectedDate ? (
                    "Save Schedule"
                  ) : (
                    "Remove Schedule"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={archiveDialogOpen}
        onOpenChange={(open) => {
          setArchiveDialogOpen(open);
          if (!open) {
            setPostToArchive(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-600" />
              Archive Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to archive this post? It will be moved to
              your archived posts and hidden from the main view.
            </p>

            {postToArchive && (
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Post Content Preview:
                </div>
                <div className="text-sm text-gray-600 line-clamp-3">
                  {postToArchive.content.substring(0, 150)}
                  {postToArchive.content.length > 150 ? "..." : ""}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setArchiveDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (postToArchive) {
                    handleArchive(postToArchive.id);
                  }
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
