import { useState } from "react";
import { toast } from "sonner";

export interface FeedbackData {
  type: "prompt" | "post";
  targetId: number;
  rating?: number;
  feedbackText?: string;
  likedAspects?: string[];
  dislikedAspects?: string[];
  improvementSuggestions?: string;
  wouldUse?: boolean;
  wouldRecommend?: boolean;
  contextInfo?: Record<string, any>;
  generationHistoryId?: number;
}

export interface FeedbackItem {
  id: number;
  user_id: string;
  rating?: number;
  feedback_text?: string;
  liked_aspects?: string[];
  disliked_aspects?: string[];
  improvement_suggestions?: string;
  would_use?: boolean;
  would_recommend?: boolean;
  context_info?: Record<string, any>;
  is_resolved: boolean;
  admin_response?: string;
  created_at: string;
  updated_at: string;
  feedback_category?: "prompt" | "post";
}

export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitFeedback = async (feedbackData: FeedbackData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit feedback");
      }

      const result = await response.json();

      toast.success("Thank you for your feedback! It helps us improve.");

      return result.feedback;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback"
      );
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedback = async (
    type: "prompt" | "post",
    targetId: number
  ): Promise<FeedbackItem[]> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/feedback?type=${type}&targetId=${targetId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch feedback");
      }

      const result = await response.json();
      return result.feedback || [];
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitFeedback,
    getFeedback,
    isSubmitting,
    isLoading,
  };
}

// Admin feedback hook
export function useAdminFeedback() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getAdminFeedback = async (
    params: {
      type?: "all" | "post" | "prompt";
      userId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params.type) searchParams.set("type", params.type);
      if (params.userId) searchParams.set("userId", params.userId);
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());

      const response = await fetch(`/api/admin/feedback?${searchParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch feedback");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching admin feedback:", error);
      toast.error("Failed to load feedback data");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedback = async (params: {
    feedbackId: number;
    type: "prompt" | "post";
    adminResponse?: string;
    isResolved?: boolean;
  }) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update feedback");
      }

      const result = await response.json();

      toast.success("Feedback has been successfully updated.");

      return result.feedback;
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update feedback"
      );
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    getAdminFeedback,
    updateFeedback,
    isLoading,
    isUpdating,
  };
}
