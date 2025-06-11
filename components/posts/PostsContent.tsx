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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [analyticsData, setAnalyticsData] = useState<PostPerformance>({
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    notes: "",
  });

  // Local filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.status || "all"
  );
  const [typeFilter, setTypeFilter] = useState(searchParams.type || "all");

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

  // Apply filters to posts
  useEffect(() => {
    let filtered = data.posts;

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((post) => post.content_type === typeFilter);
    }

    setFilteredPosts(filtered);
  }, [data.posts, searchTerm, statusFilter, typeFilter]);

  // Sort posts: upcoming drafts first, then regular drafts (newest), then posted (newest)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const now = new Date();

      // Check if posts are upcoming scheduled drafts
      const aIsUpcomingDraft =
        a.status === "draft" &&
        a.scheduled_date &&
        new Date(a.scheduled_date) > now;
      const bIsUpcomingDraft =
        b.status === "draft" &&
        b.scheduled_date &&
        new Date(b.scheduled_date) > now;

      // 1. Upcoming drafts first (sorted by scheduled date, nearest first)
      if (aIsUpcomingDraft && !bIsUpcomingDraft) return -1;
      if (!aIsUpcomingDraft && bIsUpcomingDraft) return 1;
      if (aIsUpcomingDraft && bIsUpcomingDraft) {
        return (
          new Date(a.scheduled_date!).getTime() -
          new Date(b.scheduled_date!).getTime()
        );
      }

      // 2. Then drafts vs posted content
      if (a.status === "draft" && b.status !== "draft") return -1;
      if (a.status !== "draft" && b.status === "draft") return 1;

      // 3. Within same status, sort by creation date (newest first)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [filteredPosts]);

  // Manual refresh function
  const refetch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/refresh?userId=${userId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh data");
      }

      const newData = await response.json();
      setData(newData);
      toast.success("Posts refreshed");
    } catch (error) {
      console.error("Error refreshing posts:", error);
      toast.error("Failed to refresh posts");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Post["status"], needsAnalytics?: boolean) => {
    if (needsAnalytics) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Needs Analytics
        </Badge>
      );
    }

    const labels = {
      draft: "Draft",
      used: "Posted",
      archived: "Archived",
    };

    return <Badge className={statusColors[status]}>{labels[status]}</Badge>;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  const handleMarkAsPosted = async (postId: string) => {
    try {
      const updatePromise = supabase
        .from("posts")
        .update({
          status: "used",
          posted_at: new Date().toISOString(),
        })
        .eq("id", postId);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Update timeout")), 10000)
      );

      const result = await Promise.race([updatePromise, timeoutPromise]);
      const { error } = result as { error: any };

      if (error) throw error;

      // Update local state
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: "used" as const,
                posted_at: new Date().toISOString(),
              }
            : post
        ),
      }));

      toast.success("Post marked as posted");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  const handleEdit = (post: Post) => {
    router.push(`/posts/edit/${post.id}`);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      // Update local state
      setData((prev) => ({
        ...prev,
        posts: prev.posts.filter((post) => post.id !== postId),
        stats: {
          ...prev.stats,
          totalPosts: prev.stats.totalPosts - 1,
        },
      }));

      toast.success("Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleSaveAnalytics = async () => {
    if (!selectedPost) return;

    try {
      // Convert post_id to integer to match database schema
      const postId = parseInt(selectedPost.id, 10);

      const { error } = await supabase.from("post_performance").upsert(
        {
          post_id: postId,
          impressions: analyticsData.impressions,
          likes: analyticsData.likes,
          comments: analyticsData.comments,
          shares: analyticsData.shares,
          clicks: 0, // Default clicks to 0
          performance_notes: analyticsData.notes || null, // Map to correct field name
          recorded_at: new Date().toISOString(),
        },
        {
          onConflict: "post_id", // Handle duplicates by post_id
          ignoreDuplicates: false, // Update if exists
        }
      );

      if (error) throw error;

      // Update local state
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((post) =>
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
                  engagement_rate:
                    analyticsData.impressions > 0
                      ? ((analyticsData.likes +
                          analyticsData.comments +
                          analyticsData.shares) /
                          analyticsData.impressions) *
                        100
                      : 0,
                },
              }
            : post
        ),
      }));

      setAnalyticsDialogOpen(false);
      setAnalyticsData({
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        notes: "",
      });
      toast.success("Analytics saved successfully");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics");
    }
  };

  const openAnalyticsDialog = (post: Post) => {
    setSelectedPost(post);
    setAnalyticsData({
      impressions: post.analyticsData?.impressions || 0,
      likes: post.analyticsData?.likes || 0,
      comments: post.analyticsData?.comments || 0,
      shares: post.analyticsData?.shares || 0,
      notes: "",
    });
    setAnalyticsDialogOpen(true);
  };

  const handleSaveDate = async () => {
    if (!selectedPost || !selectedDate) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({ posted_at: selectedDate })
        .eq("id", selectedPost.id);

      if (error) throw error;

      // Update local state
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, posted_at: selectedDate }
            : post
        ),
      }));

      setDateEditDialogOpen(false);
      setSelectedDate("");
      toast.success("Date updated successfully");
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update date");
    }
  };

  const handlePostClick = (post: Post) => {
    // If post is already used/posted, just show content instead of editing
    if (post.status === "used") {
      return;
    }
    // For drafts, allow editing
    handleEdit(post);
  };

  const renderPostCard = (post: Post) => (
    <Card
      key={post.id}
      className={`hover:shadow-lg transition-all duration-500 ${
        post.status === "used" ? "cursor-default" : "cursor-pointer"
      } group h-full ${
        post.needsAnalytics ? "ring-2 ring-red-200 border-red-200" : ""
      } ${post.hasAnalytics ? "ring-1 ring-green-200 border-green-200" : ""}`}
      onClick={() => handlePostClick(post)}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(post.status, post.needsAnalytics)}
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

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title || post.content.substring(0, 100) + "..."}
        </h3>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-3 flex-grow">
          {post.content}
        </p>

        {/* Analytics Preview */}
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

        {/* Actions */}
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
            {/* Copy Button */}
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

            {/* Mark as Posted / Analytics Button */}
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
                      // Could open analytics view dialog here
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

            {/* More Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <StickyNote className="h-3 w-3" />
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
                      setSelectedDate(post.scheduled_date || "");
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
      </CardContent>
    </Card>
  );

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {data.stats.totalPosts}
            </div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.draftPosts}
            </div>
            <div className="text-sm text-gray-600">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.stats.publishedPosts}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.stats.archivedPosts}
            </div>
            <div className="text-sm text-gray-600">Archived</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {data.stats.postsNeedingAnalytics}
            </div>
            <div className="text-sm text-gray-600">Need Analytics</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {/* Analytics Alert */}
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

      {/* Posts Grid */}
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

      {/* Analytics Dialog */}
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

      {/* Date Edit Dialog */}
      <Dialog open={dateEditDialogOpen} onOpenChange={setDateEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-date">Posted Date</Label>
              <Input
                id="post-date"
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDateEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveDate}>Save Date</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
