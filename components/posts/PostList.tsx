"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "used" | "archived";
  contentType: string;
  createdAt: string;
  scheduledDate?: string | undefined;
  postedDate?: string | undefined;
  engagement?: string | undefined;
  linkedinUrl?: string | undefined;
  hashtags?: string[] | undefined;
  topics?: string[] | undefined;
  hasAnalytics?: boolean | undefined;
  needsAnalytics?: boolean | undefined;
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

interface PostPerformance {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  notes?: string;
}

// Map database status to display status
const mapStatus = (dbStatus: string): "draft" | "used" | "archived" => {
  switch (dbStatus) {
    case "draft":
      return "draft";
    case "used":
      return "used";
    case "archived":
      return "archived";
    default:
      return "draft";
  }
};

// Map database content_type to display content type
const mapContentType = (dbContentType: string): string => {
  switch (dbContentType.toLowerCase()) {
    case "educational":
      return "Educational";
    case "story":
      return "Personal Story";
    case "question":
      return "Question";
    case "promotional":
      return "Promotional";
    case "personal":
      return "Personal";
    case "post":
      return "Post";
    default:
      return dbContentType || "Post";
  }
};

const statusColors = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  used: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-orange-100 text-orange-700 border-orange-200",
};

// Check if a post needs analytics (posted 5+ days ago without analytics)
const checkNeedsAnalytics = (post: any): boolean => {
  if (post.status !== "used" || !post.posted_at || post.hasAnalytics) {
    return false;
  }

  const postedDate = new Date(post.posted_at);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysDiff >= 5;
};

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [dateEditDialogOpen, setDateEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(
    null
  );
  const [toastShown, setToastShown] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<PostPerformance>({
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    notes: "",
  });

  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Count posts needing analytics
  const postsNeedingAnalytics = useMemo(() => {
    return posts.filter((post) => post.needsAnalytics).length;
  }, [posts]);

  // Sort posts: upcoming drafts first, then regular drafts (newest), then posted (newest)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const now = new Date();

      // Check if posts are upcoming scheduled drafts
      const aIsUpcomingDraft =
        a.status === "draft" &&
        a.scheduledDate &&
        new Date(a.scheduledDate) > now;
      const bIsUpcomingDraft =
        b.status === "draft" &&
        b.scheduledDate &&
        new Date(b.scheduledDate) > now;

      // 1. Upcoming drafts first (sorted by scheduled date, nearest first)
      if (aIsUpcomingDraft && !bIsUpcomingDraft) return -1;
      if (!aIsUpcomingDraft && bIsUpcomingDraft) return 1;
      if (aIsUpcomingDraft && bIsUpcomingDraft) {
        return (
          new Date(a.scheduledDate!).getTime() -
          new Date(b.scheduledDate!).getTime()
        );
      }

      // 2. Then drafts vs posted content
      if (a.status === "draft" && b.status === "used") return -1;
      if (a.status === "used" && b.status === "draft") return 1;

      // 3. Within same status, prioritize posts needing analytics
      if (a.needsAnalytics && !b.needsAnalytics) return -1;
      if (!a.needsAnalytics && b.needsAnalytics) return 1;

      // 4. Finally, sort by date (newest first)
      // For posted content, use posted date if available, otherwise created date
      const aDate =
        a.status === "used" && a.postedDate ? a.postedDate : a.createdAt;
      const bDate =
        b.status === "used" && b.postedDate ? b.postedDate : b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [posts]);

  // Check for highlighted post from URL params
  useEffect(() => {
    const draftId = searchParams.get("draft");
    const updatedId = searchParams.get("updated");

    if ((draftId || updatedId) && !toastShown) {
      const postId = draftId || updatedId;
      setHighlightedPostId(postId);
      setToastShown(true);

      // Show success message based on action
      if (draftId) {
        toast.success("Your draft has been saved! You can find it below.", {
          duration: 5000,
        });
      } else if (updatedId) {
        toast.success(
          "Post updated successfully! You can see your changes below.",
          {
            duration: 5000,
          }
        );
      }

      // Scroll to highlighted post after posts are loaded
      setTimeout(() => {
        const highlightedElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 500);

      // Remove highlight after 10 seconds
      setTimeout(() => {
        setHighlightedPostId(null);
        // Clean up URL
        router.replace("/posts", { scroll: false });
      }, 10000);
    }
  }, [searchParams, router, toastShown]);

  // Fetch posts from Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch posts with their performance data
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(
            `
            *,
            post_performance (
              impressions,
              likes,
              comments,
              shares
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsError) {
          throw postsError;
        }

        // Transform database posts to component format
        const transformedPosts: Post[] = (postsData || []).map(
          (post: any): Post => {
            const hasAnalytics =
              post.post_performance && post.post_performance.length > 0;
            const needsAnalytics = checkNeedsAnalytics({
              ...post,
              hasAnalytics,
            });

            // Calculate engagement rate if analytics exist
            let analyticsData = undefined;
            if (hasAnalytics && post.post_performance[0]) {
              const perf = post.post_performance[0];
              const totalEngagements =
                (perf.likes || 0) + (perf.comments || 0) + (perf.shares || 0);
              const engagementRate =
                perf.impressions > 0
                  ? (totalEngagements / perf.impressions) * 100
                  : 0;
              analyticsData = {
                impressions: perf.impressions || 0,
                likes: perf.likes || 0,
                comments: perf.comments || 0,
                shares: perf.shares || 0,
                engagement_rate: engagementRate,
              };
            }

            return {
              id: post.id.toString(),
              title:
                post.title ||
                `${post.content?.substring(0, 50) || "Untitled Post"}...`,
              content: post.content || "",
              status: mapStatus(post.status),
              contentType: mapContentType(post.content_type),
              createdAt: post.created_at,
              scheduledDate: post.scheduled_date,
              postedDate: post.posted_at,
              linkedinUrl: post.linkedin_url,
              hashtags: post.hashtags || [],
              topics: post.topics || [],
              hasAnalytics,
              needsAnalytics,
              analyticsData,
            };
          }
        );

        setPosts(transformedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, supabase]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: Post["status"], needsAnalytics?: boolean) => {
    if (needsAnalytics) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">
          ⚠️ Needs Analytics
        </Badge>
      );
    }

    switch (status) {
      case "draft":
        return <Badge className={statusColors.draft}>Draft</Badge>;
      case "used":
        return <Badge className={statusColors.used}>✓ Posted</Badge>;
      case "archived":
        return <Badge className={statusColors.archived}>Archived</Badge>;
      default:
        return <Badge className={statusColors.draft}>Draft</Badge>;
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const handleMarkAsPosted = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "used",
          posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (error) throw error;

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: "used" as const,
                postedDate: new Date().toISOString(),
              }
            : post
        )
      );

      toast.success("Post marked as posted!");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post status");
    }
  };

  const handleEdit = (post: Post) => {
    router.push(`/posts/create?edit=${post.id}`);
  };

  const handlePostClick = (post: Post) => {
    // If post is already used/posted, just show content instead of editing
    if (post.status === "used") {
      // For posted content, could expand inline or show analytics
      return;
    }
    // For drafts, allow editing
    handleEdit(post);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleSaveAnalytics = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase.from("post_performance").insert({
        post_id: parseInt(selectedPost.id),
        impressions: analyticsData.impressions,
        likes: analyticsData.likes,
        comments: analyticsData.comments,
        shares: analyticsData.shares,
      });

      if (error) throw error;

      // Update local state
      setPosts(
        posts.map((post) =>
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
        )
      );

      setAnalyticsDialogOpen(false);
      setSelectedPost(null);
      setAnalyticsData({
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        notes: "",
      });

      toast.success("Analytics saved successfully!");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics");
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

  const handleDateEdit = async (post: Post) => {
    setSelectedPost(post);
    setSelectedDate(post.scheduledDate || "");
    setDateEditDialogOpen(true);
  };

  const handleSaveDate = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          scheduled_date: selectedDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(selectedPost.id));

      if (error) throw error;

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? ({
                ...post,
                scheduledDate: selectedDate || undefined,
              } as Post)
            : post
        )
      );

      setDateEditDialogOpen(false);
      setSelectedPost(null);
      setSelectedDate("");

      toast.success(selectedDate ? "Schedule updated!" : "Schedule cleared!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const renderPostCard = (post: Post) => {
    const isHighlighted = highlightedPostId === post.id;

    return (
      <Card
        key={post.id}
        data-post-id={post.id}
        className={`hover:shadow-lg transition-all duration-500 ${
          post.status === "used" ? "cursor-default" : "cursor-pointer"
        } group h-full ${
          post.needsAnalytics ? "ring-2 ring-red-200 border-red-200" : ""
        } ${
          post.hasAnalytics ? "ring-1 ring-green-200 border-green-200" : ""
        } ${
          isHighlighted
            ? "ring-4 ring-blue-400 border-blue-400 shadow-xl scale-105 bg-blue-50"
            : ""
        }`}
        onClick={() => handlePostClick(post)}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {isHighlighted && (
                <Badge className="text-xs bg-blue-600 text-white animate-pulse">
                  ✨ New
                </Badge>
              )}
              {getStatusBadge(post.status, post.needsAnalytics)}
              <Badge variant="outline" className="text-xs">
                {post.contentType}
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
            {post.title}
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
                    {post.analyticsData.impressions}
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
              {post.status === "used" && post.postedDate ? (
                <span>Posted {formatDate(post.postedDate)}</span>
              ) : post.scheduledDate ? (
                <span className="text-blue-600">
                  📅 Scheduled {formatDate(post.scheduledDate)}
                </span>
              ) : (
                <span>Created {formatDate(post.createdAt)}</span>
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
                    <div className="flex flex-col space-y-0.5">
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {post.status !== "used" && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(post);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {post.scheduledDate ? (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateEdit(post);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateEdit(post);
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

                  {post.linkedinUrl && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(post.linkedinUrl, "_blank");
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Notification Banner */}
      {postsNeedingAnalytics > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <TrendingUp className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>
              {postsNeedingAnalytics} post{postsNeedingAnalytics > 1 ? "s" : ""}
            </strong>{" "}
            {postsNeedingAnalytics > 1 ? "have" : "has"} been posted for 5+ days
            without analytics data. Adding performance data helps our AI learn
            what content works best for your audience!
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

      {/* Enhanced Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Add Post Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              💡 <strong>Pro tip:</strong> Adding analytics helps our AI
              understand what content resonates with your audience and improve
              future suggestions!
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="impressions"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4 text-gray-500" />
                  Impressions
                </Label>
                <Input
                  id="impressions"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={analyticsData.impressions}
                  onChange={(e) =>
                    setAnalyticsData({
                      ...analyticsData,
                      impressions: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="likes" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-500" />
                  Likes
                </Label>
                <Input
                  id="likes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={analyticsData.likes}
                  onChange={(e) =>
                    setAnalyticsData({
                      ...analyticsData,
                      likes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  Comments
                </Label>
                <Input
                  id="comments"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={analyticsData.comments}
                  onChange={(e) =>
                    setAnalyticsData({
                      ...analyticsData,
                      comments: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shares" className="flex items-center gap-2">
                  <Share className="h-4 w-4 text-gray-500" />
                  Shares
                </Label>
                <Input
                  id="shares"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={analyticsData.shares}
                  onChange={(e) =>
                    setAnalyticsData({
                      ...analyticsData,
                      shares: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Live Engagement Rate Calculation */}
            {analyticsData.impressions > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <span className="font-medium">Engagement Rate: </span>
                  {(
                    ((analyticsData.likes +
                      analyticsData.comments +
                      analyticsData.shares) /
                      analyticsData.impressions) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-gray-500" />
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="What worked well? Any insights about this post's performance..."
                value={analyticsData.notes}
                onChange={(e) =>
                  setAnalyticsData({
                    ...analyticsData,
                    notes: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setAnalyticsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAnalytics}
                disabled={analyticsData.impressions === 0}
              >
                Save Analytics
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Edit Dialog */}
      <Dialog open={dateEditDialogOpen} onOpenChange={setDateEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-date">Scheduled Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to clear the schedule date
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDateEditDialogOpen(false);
                  setSelectedPost(null);
                  setSelectedDate("");
                }}
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
