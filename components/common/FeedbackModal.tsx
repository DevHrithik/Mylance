"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFeedback, type FeedbackData } from "@/hooks/useFeedback";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "prompt" | "post";
  targetId: number;
  title?: string;
  content?: string;
  generationHistoryId?: number;
  onSubmitSuccess?: () => void;
}

const ASPECT_OPTIONS = {
  prompt: [
    "Clarity",
    "Relevance",
    "Creativity",
    "Specificity",
    "Actionability",
    "Professional tone",
    "Engaging hook",
    "Target audience fit",
  ],
  post: [
    "Content quality",
    "Writing style",
    "Structure",
    "Engagement level",
    "Professional tone",
    "Accuracy",
    "Relevance",
    "Length",
  ],
};

export function FeedbackModal({
  isOpen,
  onClose,
  type,
  targetId,
  title,
  content,
  generationHistoryId,
  onSubmitSuccess,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [likedAspects, setLikedAspects] = useState<string[]>([]);
  const [dislikedAspects, setDislikedAspects] = useState<string[]>([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [wouldUse, setWouldUse] = useState<boolean | undefined>(undefined);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>(
    undefined
  );

  const { submitFeedback, isSubmitting } = useFeedback();

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    const feedbackData: FeedbackData = {
      type,
      targetId,
      rating,
      ...(feedbackText.trim() && { feedbackText: feedbackText.trim() }),
      ...(likedAspects.length > 0 && { likedAspects }),
      ...(dislikedAspects.length > 0 && { dislikedAspects }),
      ...(improvementSuggestions.trim() && {
        improvementSuggestions: improvementSuggestions.trim(),
      }),
      ...(wouldUse !== undefined && { wouldUse }),
      ...(wouldRecommend !== undefined && { wouldRecommend }),
      ...(generationHistoryId && { generationHistoryId }),
      contextInfo: {
        title,
        content_preview: content?.substring(0, 200),
      },
    };

    try {
      await submitFeedback(feedbackData);
      resetForm();
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      // Error handled in hook
      console.error(error);
    }
  };

  const resetForm = () => {
    setRating(0);
    setFeedbackText("");
    setLikedAspects([]);
    setDislikedAspects([]);
    setImprovementSuggestions("");
    setWouldUse(undefined);
    setWouldRecommend(undefined);
  };

  const handleAspectToggle = (aspect: string, isLiked: boolean) => {
    if (isLiked) {
      setLikedAspects((prev) =>
        prev.includes(aspect)
          ? prev.filter((a) => a !== aspect)
          : [...prev, aspect]
      );
      // Remove from disliked if it was there
      setDislikedAspects((prev) => prev.filter((a) => a !== aspect));
    } else {
      setDislikedAspects((prev) =>
        prev.includes(aspect)
          ? prev.filter((a) => a !== aspect)
          : [...prev, aspect]
      );
      // Remove from liked if it was there
      setLikedAspects((prev) => prev.filter((a) => a !== aspect));
    }
  };

  const aspectOptions = ASPECT_OPTIONS[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview */}
          {(title || content) && (
            <Card>
              <CardContent className="p-4">
                {title && (
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {type === "prompt" ? "Prompt" : "Post"}
                  </h4>
                )}
                {title && <p className="font-medium mb-2">{title}</p>}
                {content && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {content}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Aspects */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              What did you think about these aspects?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {aspectOptions.map((aspect) => (
                <div
                  key={aspect}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm">{aspect}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        likedAspects.includes(aspect) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleAspectToggle(aspect, true)}
                      className="h-8 px-3"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant={
                        dislikedAspects.includes(aspect)
                          ? "destructive"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleAspectToggle(aspect, false)}
                      className="h-8 px-3"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Intent */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="would-use"
                checked={wouldUse === true}
                onCheckedChange={(checked) => setWouldUse(checked === true)}
              />
              <label htmlFor="would-use" className="text-sm">
                I would use this {type}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="would-recommend"
                checked={wouldRecommend === true}
                onCheckedChange={(checked) =>
                  setWouldRecommend(checked === true)
                }
              />
              <label htmlFor="would-recommend" className="text-sm">
                I would recommend this to others
              </label>
            </div>
          </div>

          <Separator />

          {/* Written Feedback */}
          <div className="space-y-3">
            <label htmlFor="feedback-text" className="text-sm font-medium">
              Additional Comments
            </label>
            <Textarea
              id="feedback-text"
              placeholder="Share your thoughts, what worked well, what could be improved..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Improvement Suggestions */}
          <div className="space-y-3">
            <label htmlFor="improvements" className="text-sm font-medium">
              Suggestions for Improvement
            </label>
            <Textarea
              id="improvements"
              placeholder="How could we make this better?"
              value={improvementSuggestions}
              onChange={(e) => setImprovementSuggestions(e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
