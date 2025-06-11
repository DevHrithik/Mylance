"use client";

import { useState, useEffect, useCallback, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Clock,
  Filter,
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface UserFeedback {
  id: number;
  user_id: string;
  feedback_type: string;
  rating: number | null;
  feedback_text: string | null;
  prompt_id: number | null;
  post_id: number | null;
  is_resolved: boolean;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  improvement_suggestions: string | null;
  liked_aspects: string[] | null;
  disliked_aspects: string[] | null;
  context_info: any;
  is_flagged: boolean;
  admin_notes: string | null;
  admin_tags: string[] | null;
}

interface PostFeedback {
  id: number;
  user_id: string;
  post_id: number;
  rating: number | null;
  feedback_type: string;
  feedback_text: string | null;
  liked_aspects: string[] | null;
  disliked_aspects: string[] | null;
  improvement_suggestions: string | null;
  would_use: boolean | null;
  would_recommend: boolean | null;
  context_info: any;
  admin_response: string | null;
  is_resolved: boolean;
  is_flagged: boolean;
  admin_notes: string | null;
  admin_tags: string[] | null;
  created_at: string;
}

interface ContentPromptFeedback {
  id: number;
  user_id: string;
  category: string;
  pillar_number: number | null;
  pillar_description: string | null;
  prompt_text: string;
  hook: string;
  feedback_rating: number | null;
  feedback_text: string | null;
  improvement_suggestions: string | null;
  feedback_given_at: string | null;
  created_at: string;
}

// Combined feedback type with source
type CombinedFeedback =
  | (UserFeedback & { source: "user" })
  | (PostFeedback & { source: "post" })
  | (ContentPromptFeedback & {
      source: "prompt";
      rating: number | null;
      is_resolved: boolean;
    });

// Type guards
const isUserFeedback = (
  feedback: CombinedFeedback
): feedback is UserFeedback & { source: "user" } => {
  return feedback.source === "user";
};

const isPostFeedback = (
  feedback: CombinedFeedback
): feedback is PostFeedback & { source: "post" } => {
  return feedback.source === "post";
};

const isPromptFeedback = (
  feedback: CombinedFeedback
): feedback is ContentPromptFeedback & {
  source: "prompt";
  rating: number | null;
  is_resolved: boolean;
} => {
  return feedback.source === "prompt";
};

export default function UserFeedbacksPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([]);
  const [postFeedbacks, setPostFeedbacks] = useState<PostFeedback[]>([]);
  const [promptFeedbacks, setPromptFeedbacks] = useState<
    ContentPromptFeedback[]
  >([]);
  const [user, setUser] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState("all");

  const fetchUserData = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (userError) throw userError;
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user data");
    }
  }, [resolvedParams.id]);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user feedbacks
      const { data: userFeedbackData, error: userFeedbackError } =
        await supabase
          .from("user_feedback")
          .select("*")
          .eq("user_id", resolvedParams.id)
          .order("created_at", { ascending: false });

      if (userFeedbackError) throw userFeedbackError;

      // Fetch post feedbacks
      const { data: postFeedbackData, error: postFeedbackError } =
        await supabase
          .from("post_feedback")
          .select("*")
          .eq("user_id", resolvedParams.id)
          .order("created_at", { ascending: false });

      if (postFeedbackError) throw postFeedbackError;

      // Fetch content prompt feedbacks (prompts with feedback)
      const { data: promptFeedbackData, error: promptFeedbackError } =
        await supabase
          .from("content_prompts")
          .select("*")
          .eq("user_id", resolvedParams.id)
          .not("feedback_rating", "is", null)
          .order("feedback_given_at", { ascending: false });

      if (promptFeedbackError) throw promptFeedbackError;

      setUserFeedbacks(userFeedbackData || []);
      setPostFeedbacks(postFeedbackData || []);
      setPromptFeedbacks(promptFeedbackData || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchUserData();
    fetchFeedbacks();
  }, [fetchUserData, fetchFeedbacks]);

  const handleResolve = async (feedbackType: string, feedbackId: number) => {
    try {
      const table = feedbackType === "user" ? "user_feedback" : "post_feedback";

      const { error } = await supabase
        .from(table)
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", feedbackId);

      if (error) throw error;

      toast.success("Feedback marked as resolved");
      fetchFeedbacks();
    } catch (error) {
      console.error("Error resolving feedback:", error);
      toast.error("Failed to resolve feedback");
    }
  };

  const handleAddAdminResponse = async (
    feedbackType: string,
    feedbackId: number,
    response: string
  ) => {
    try {
      const table = feedbackType === "user" ? "user_feedback" : "post_feedback";

      const { error } = await supabase
        .from(table)
        .update({
          admin_response: response,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId);

      if (error) throw error;

      toast.success("Admin response added");
      fetchFeedbacks();
    } catch (error) {
      console.error("Error adding admin response:", error);
      toast.error("Failed to add admin response");
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return "N/A";
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const getFilteredFeedbacks = (): CombinedFeedback[] => {
    const allFeedbacks: CombinedFeedback[] = [
      ...userFeedbacks.map((f) => ({ ...f, source: "user" as const })),
      ...postFeedbacks.map((f) => ({ ...f, source: "post" as const })),
      ...promptFeedbacks.map((f) => ({
        ...f,
        source: "prompt" as const,
        rating: f.feedback_rating,
        is_resolved: false, // Prompt feedbacks don't have resolution status
      })),
    ];

    return allFeedbacks.filter((feedback) => {
      // Search filter
      const searchMatch =
        !searchTerm ||
        feedback.feedback_text
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        feedback.improvement_suggestions
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Type filter
      const typeMatch =
        feedbackTypeFilter === "all" || feedback.source === feedbackTypeFilter;

      // Rating filter
      const ratingMatch =
        ratingFilter === "all" ||
        (ratingFilter === "high" && feedback.rating && feedback.rating >= 4) ||
        (ratingFilter === "medium" &&
          feedback.rating &&
          feedback.rating === 3) ||
        (ratingFilter === "low" && feedback.rating && feedback.rating <= 2);

      // Resolved filter - only applicable to user and post feedbacks
      const resolvedMatch =
        resolvedFilter === "all" ||
        (resolvedFilter === "resolved" &&
          (isPromptFeedback(feedback) || feedback.is_resolved)) ||
        (resolvedFilter === "unresolved" &&
          !isPromptFeedback(feedback) &&
          !feedback.is_resolved);

      return searchMatch && typeMatch && ratingMatch && resolvedMatch;
    });
  };

  const filteredFeedbacks = getFilteredFeedbacks();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const userName =
    user?.first_name || user?.email?.split("@")[0] || "Unknown User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/${resolvedParams.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userName}&apos;s Feedbacks
            </h1>
            <p className="text-gray-600">
              {filteredFeedbacks.length} feedback
              {filteredFeedbacks.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search feedback text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={feedbackTypeFilter}
                onValueChange={setFeedbackTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">User Feedback</SelectItem>
                  <SelectItem value="post">Post Feedback</SelectItem>
                  <SelectItem value="prompt">Prompt Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="high">High (4-5 ⭐)</SelectItem>
                  <SelectItem value="medium">Medium (3 ⭐)</SelectItem>
                  <SelectItem value="low">Low (1-2 ⭐)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No feedbacks found</p>
                <p className="text-sm text-gray-500">
                  {searchTerm ||
                  feedbackTypeFilter !== "all" ||
                  ratingFilter !== "all" ||
                  resolvedFilter !== "all"
                    ? "Try adjusting your filters"
                    : "This user hasn't provided any feedback yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFeedbacks.map((feedback, index) => (
            <Card
              key={`${feedback.source}-${feedback.id}`}
              className="relative"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        feedback.source === "user"
                          ? "default"
                          : feedback.source === "post"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {feedback.source === "user"
                        ? "User Feedback"
                        : feedback.source === "post"
                        ? "Post Feedback"
                        : "Prompt Feedback"}
                    </Badge>

                    {feedback.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {feedback.rating}/5
                        </span>
                      </div>
                    )}

                    {!isPromptFeedback(feedback) && (
                      <div className="flex items-center gap-1">
                        {feedback.is_resolved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {feedback.is_resolved ? "Resolved" : "Unresolved"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {new Date(
                      isPromptFeedback(feedback)
                        ? feedback.feedback_given_at || feedback.created_at
                        : feedback.created_at
                    ).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {feedback.feedback_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Feedback Text
                    </h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {feedback.feedback_text}
                    </p>
                  </div>
                )}

                {feedback.improvement_suggestions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Improvement Suggestions
                    </h4>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {feedback.improvement_suggestions}
                    </p>
                  </div>
                )}

                {(isUserFeedback(feedback) || isPostFeedback(feedback)) &&
                  feedback.liked_aspects &&
                  feedback.liked_aspects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Liked Aspects
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.liked_aspects.map(
                          (aspect: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              {aspect}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {(isUserFeedback(feedback) || isPostFeedback(feedback)) &&
                  feedback.disliked_aspects &&
                  feedback.disliked_aspects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Disliked Aspects
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.disliked_aspects.map(
                          (aspect: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-red-100 text-red-800"
                            >
                              {aspect}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {isPromptFeedback(feedback) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Related Prompt
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        {feedback.category} - Pillar {feedback.pillar_number}
                      </p>
                      <p className="text-gray-900">{feedback.prompt_text}</p>
                      {feedback.hook && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Hook: {feedback.hook}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(isUserFeedback(feedback) || isPostFeedback(feedback)) &&
                  feedback.admin_response && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Admin Response
                      </h4>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                        {feedback.admin_response}
                      </p>
                    </div>
                  )}

                {!isPromptFeedback(feedback) && (
                  <div className="flex gap-2 pt-4 border-t">
                    {!feedback.is_resolved && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleResolve(feedback.source, feedback.id)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {feedback.admin_response
                            ? "Update Response"
                            : "Add Response"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Admin Response</DialogTitle>
                        </DialogHeader>
                        <AdminResponseForm
                          feedbackId={feedback.id}
                          feedbackType={feedback.source}
                          currentResponse={feedback.admin_response || ""}
                          onSubmit={handleAddAdminResponse}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AdminResponseForm({
  feedbackId,
  feedbackType,
  currentResponse,
  onSubmit,
}: {
  feedbackId: number;
  feedbackType: string;
  currentResponse: string;
  onSubmit: (type: string, id: number, response: string) => Promise<void>;
}) {
  const [response, setResponse] = useState(currentResponse);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(feedbackType, feedbackId, response);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter your response to this feedback..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={4}
      />
      <Button
        onClick={handleSubmit}
        disabled={!response.trim() || submitting}
        className="w-full"
      >
        {submitting
          ? "Saving..."
          : currentResponse
          ? "Update Response"
          : "Add Response"}
      </Button>
    </div>
  );
}
