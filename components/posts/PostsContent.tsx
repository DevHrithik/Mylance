"use client";

import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Edit,
  Trash2,
  Calendar,
  BarChart3,
  CheckCircle,
  PenTool,
  AlertTriangle,
  Eye,
  Heart,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string | undefined;
  posted_at?: string;
  hashtags?: string[];
  topics?: string[];
  linkedin_url?: string;
  tone?: string;
  ai_prompt_used?: string;
  generation_metadata?: any;
}

interface PostsContentProps {
  initialData: {
    posts: any[];
    totalCount: number;
  };
  userId: string;
  searchParams: {
    page?: string;
    status?: string;
    type?: string;
    search?: string;
  };
}

export function PostsContent({
  initialData,
  userId,
  searchParams,
}: PostsContentProps) {
  const [posts, setPosts] = useState<Post[]>(
    initialData.posts.map((post) => ({
      ...post,
      id: post.id.toString(),
    }))
  );
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"analytics" | "edit" | null>(
    null
  );
  const [analyticsData, setAnalyticsData] = useState({
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    notes: "",
  });
  const [editDate, setEditDate] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // Filter and search posts client-side for instant feedback
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // Filter by status
    if (searchParams.status && searchParams.status !== "all") {
      filtered = filtered.filter((post) => post.status === searchParams.status);
    }

    // Filter by search term
    if (searchParams.search) {
      const search = searchParams.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(search) ||
          post.content.toLowerCase().includes(search)
      );
    }

    // Sort posts: upcoming drafts first, then by creation date
    return filtered.sort((a, b) => {
      const now = new Date();
      const aIsUpcoming =
        a.status === "draft" &&
        a.scheduled_date &&
        new Date(a.scheduled_date) > now;
      const bIsUpcoming =
        b.status === "draft" &&
        b.scheduled_date &&
        new Date(b.scheduled_date) > now;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      if (aIsUpcoming && bIsUpcoming) {
        return (
          new Date(a.scheduled_date!).getTime() -
          new Date(b.scheduled_date!).getTime()
        );
      }

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [posts, searchParams]);

  const postsNeedingAnalytics = useMemo(() => {
    return posts.filter((post) => {
      if (post.status !== "used" || !post.posted_at) return false;
      const daysSincePosted = Math.floor(
        (Date.now() - new Date(post.posted_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return daysSincePosted >= 5;
    }).length;
  }, [posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: Post["status"], needsAnalytics?: boolean) => {
    if (needsAnalytics) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          Needs Analytics
        </Badge>
      );
    }

    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "used":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Posted
          </Badge>
        );
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const handleEdit = (post: Post) => {
    router.push(`/posts/create?edit=${post.id}`);
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
        .eq("id", parseInt(postId));

      if (error) throw error;

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                status: "used" as const,
                posted_at: new Date().toISOString(),
              }
            : post
        )
      );

      toast.success("Post marked as posted!");
    } catch (error) {
      console.error("Error marking post as posted:", error);
      toast.error("Failed to mark post as posted");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", parseInt(postId));

      if (error) throw error;

      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const openAnalyticsDialog = (post: Post) => {
    setSelectedPost(post);
    setDialogType("analytics");
    // Reset analytics data since we don't store it in the post anymore
    setAnalyticsData({
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setDialogType("edit");
    setEditDate(post.scheduled_date?.split("T")[0] || "");
    setDialogOpen(true);
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

      // Store analytics in separate post_performance table
      const { error } = await supabase.from("post_performance").upsert({
        post_id: parseInt(selectedPost.id),
        impressions: analyticsData.impressions,
        likes: analyticsData.likes,
        comments: analyticsData.comments,
        shares: analyticsData.shares,
        engagement_rate: engagementRate,
        recorded_at: new Date().toISOString(),
      });

      if (error) throw error;

      // No need to update posts state since analytics are stored separately

      setDialogOpen(false);
      toast.success("Analytics saved successfully!");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics");
    }
  };

  const handleSaveDate = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          scheduled_date: editDate ? new Date(editDate).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(selectedPost.id));

      if (error) throw error;

      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                scheduled_date: editDate
                  ? new Date(editDate).toISOString()
                  : undefined,
              }
            : post
        )
      );

      setDialogOpen(false);
      toast.success("Schedule updated successfully!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>{filteredPosts.length} posts</span>
          <span>
            {filteredPosts.filter((p) => p.status === "draft").length} drafts
          </span>
          <span>
            {filteredPosts.filter((p) => p.status === "used").length} posted
          </span>
        </div>
        {postsNeedingAnalytics > 0 && (
          <Alert className="w-auto p-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {postsNeedingAnalytics} posts need analytics data
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const needsAnalytics =
              post.status === "used" &&
              post.posted_at &&
              Math.floor(
                (Date.now() - new Date(post.posted_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) >= 5;

            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {post.title || post.content.substring(0, 100) + "..."}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(post.created_at)}</span>
                        <span>•</span>
                        <span className="capitalize">{post.content_type}</span>
                        {post.scheduled_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.scheduled_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(post.status, Boolean(needsAnalytics))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCopy(post.content)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Content
                          </DropdownMenuItem>
                          {post.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPosted(post.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Posted
                            </DropdownMenuItem>
                          )}
                          {post.status === "used" && (
                            <DropdownMenuItem
                              onClick={() => openAnalyticsDialog(post)}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Add Analytics
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openEditDialog(post)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {/* Analytics display removed since data is in separate table */}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(post.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchParams.search || searchParams.status !== "all"
              ? "Try adjusting your filters or search terms."
              : "Start creating content to see your posts here."}
          </p>
          <Button onClick={() => router.push("/content-calendar")}>
            <PenTool className="h-4 w-4 mr-2" />
            Create Your First Post
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "analytics"
                ? "Add Analytics Data"
                : "Edit Schedule"}
            </DialogTitle>
          </DialogHeader>

          {dialogType === "analytics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impressions">Impressions</Label>
                  <Input
                    id="impressions"
                    type="number"
                    value={analyticsData.impressions}
                    onChange={(e) =>
                      setAnalyticsData({
                        ...analyticsData,
                        impressions: parseInt(e.target.value) || 0,
                      })
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
                      setAnalyticsData({
                        ...analyticsData,
                        likes: parseInt(e.target.value) || 0,
                      })
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
                      setAnalyticsData({
                        ...analyticsData,
                        comments: parseInt(e.target.value) || 0,
                      })
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
                      setAnalyticsData({
                        ...analyticsData,
                        shares: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={analyticsData.notes}
                  onChange={(e) =>
                    setAnalyticsData({
                      ...analyticsData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Add any notes about this post's performance..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAnalytics}>Save Analytics</Button>
              </div>
            </div>
          )}

          {dialogType === "edit" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule-date">Scheduled Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDate}>Update Schedule</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
