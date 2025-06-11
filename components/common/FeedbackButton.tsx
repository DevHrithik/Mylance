"use client";

import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./FeedbackModal";

interface FeedbackButtonProps {
  type: "prompt" | "post";
  targetId: number;
  title?: string;
  content?: string;
  generationHistoryId?: number;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  onFeedbackSubmitted?: () => void;
}

export function FeedbackButton({
  type,
  targetId,
  title,
  content,
  generationHistoryId,
  variant = "outline",
  size = "sm",
  className,
  children,
  onFeedbackSubmitted,
}: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    onFeedbackSubmitted?.();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        {children || (
          <>
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback
          </>
        )}
      </Button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        targetId={targetId}
        {...(title && { title })}
        {...(content && { content })}
        {...(generationHistoryId && { generationHistoryId })}
        onSubmitSuccess={handleSuccess}
      />
    </>
  );
}

// Quick rating component for inline feedback
interface QuickRatingProps {
  type: "prompt" | "post";
  targetId: number;
  onRatingSubmitted?: (rating: number) => void;
}

export function QuickRating({
  type,
  targetId,
  onRatingSubmitted,
}: QuickRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (rating: number) => {
    setSelectedRating(rating);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          targetId,
          rating,
        }),
      });

      if (response.ok) {
        onRatingSubmitted?.(rating);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setSelectedRating(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* <span className="text-xs text-muted-foreground mr-1">Rate:</span> */}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRating(star)}
          disabled={isSubmitting}
          className="hover:scale-110 transition-transform disabled:opacity-50"
        >
          <Star
            className={`h-4 w-4 ${
              star <= selectedRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
