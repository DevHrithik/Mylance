"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Bug,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type FeedbackType = "app" | "prompt" | "feature_request" | "bug_report";
type Priority = "low" | "medium" | "high" | "urgent";
type ContactPreference = "email" | "none" | "linkedin";

interface FeedbackForm {
  feedbackType: FeedbackType;
  subject: string;
  rating: number | null;
  feedbackText: string;
  improvementSuggestions: string;
  contactPreference: ContactPreference;
  priority: Priority;
}

export default function FeedbackPage() {
  const [form, setForm] = useState<FeedbackForm>({
    feedbackType: "app",
    subject: "",
    rating: null,
    feedbackText: "",
    improvementSuggestions: "",
    contactPreference: "none",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  const updateForm = (field: keyof FeedbackForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.feedbackText.trim()) {
      toast.error("Please provide your feedback");
      return;
    }

    if (!form.subject.trim()) {
      toast.error("Please provide a subject");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the existing feedback API route
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "prompt", // Use 'prompt' type for general feedback
          targetId: null, // Use null for general feedback
          rating: form.rating,
          feedbackText: form.feedbackText,
          improvementSuggestions: form.improvementSuggestions,
          contextInfo: {
            feedback_type: form.feedbackType,
            subject: form.subject,
            contact_preference: form.contactPreference,
            priority: form.priority,
            feedback_category: "general",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit feedback");
      }

      toast.success("Thank you for your feedback! We'll review it soon.");
      setSubmitted(true);

      // Reset form
      setForm({
        feedbackType: "app",
        subject: "",
        rating: null,
        feedbackText: "",
        improvementSuggestions: "",
        contactPreference: "none",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "app":
        return <MessageSquare className="h-4 w-4" />;
      case "prompt":
        return <Star className="h-4 w-4" />;
      case "feature_request":
        return <Lightbulb className="h-4 w-4" />;
      case "bug_report":
        return <Bug className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getFeedbackTypeColor = (type: FeedbackType) => {
    switch (type) {
      case "app":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "prompt":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "feature_request":
        return "bg-green-100 text-green-800 border-green-200";
      case "bug_report":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center shadow-lg">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You for Your Feedback!
            </h2>
            <p className="text-gray-600 mb-6">
              We appreciate you taking the time to help us improve Mylance. Your
              feedback has been received and will be reviewed by our team.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="mr-3"
              >
                Submit More Feedback
              </Button>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-left space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Share Your Feedback
        </h1>
        <p className="text-sm text-gray-600 max-w-xl">
          Help us improve Mylance! Your feedback is valuable to us and helps
          shape the future of our platform.
        </p>
      </div>

      {/* Full Width Form */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            <span>Feedback Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two column grid for all form fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Feedback Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Feedback Type</Label>
                  <Select
                    value={form.feedbackType}
                    onValueChange={(value: FeedbackType) =>
                      updateForm("feedbackType", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>General App Experience</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="prompt">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>AI Prompts & Content Quality</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="feature_request">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4" />
                          <span>Feature Request</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bug_report">
                        <div className="flex items-center space-x-2">
                          <Bug className="h-4 w-4" />
                          <span>Bug Report</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge
                    variant="outline"
                    className={getFeedbackTypeColor(form.feedbackType)}
                  >
                    {getFeedbackTypeIcon(form.feedbackType)}
                    <span className="ml-1 text-xs">
                      {form.feedbackType === "app" && "App Feedback"}
                      {form.feedbackType === "prompt" && "Prompt Feedback"}
                      {form.feedbackType === "feature_request" &&
                        "Feature Request"}
                      {form.feedbackType === "bug_report" && "Bug Report"}
                    </span>
                  </Badge>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => updateForm("subject", e.target.value)}
                    placeholder="Brief description of your feedback..."
                    className="w-full"
                    required
                  />
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Overall Rating (Optional)
                  </Label>
                  <RadioGroup
                    value={form.rating?.toString() || ""}
                    onValueChange={(value) =>
                      updateForm("rating", value ? parseInt(value) : null)
                    }
                    className="flex space-x-4"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-1">
                        <RadioGroupItem
                          value={rating.toString()}
                          id={`rating-${rating}`}
                        />
                        <Label
                          htmlFor={`rating-${rating}`}
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              form.rating && form.rating >= rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                          <span className="text-xs">{rating}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Contact Preference */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    How would you like us to follow up?
                  </Label>
                  <RadioGroup
                    value={form.contactPreference}
                    onValueChange={(value: ContactPreference) =>
                      updateForm("contactPreference", value)
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="contact-none" />
                      <Label
                        htmlFor="contact-none"
                        className="cursor-pointer text-sm"
                      >
                        No follow-up needed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="contact-email" />
                      <Label
                        htmlFor="contact-email"
                        className="cursor-pointer text-sm"
                      >
                        Email me with updates
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="linkedin" id="contact-linkedin" />
                      <Label
                        htmlFor="contact-linkedin"
                        className="cursor-pointer text-sm"
                      >
                        Contact me via LinkedIn
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Priority Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Priority Level
                  </Label>
                  <RadioGroup
                    value={form.priority}
                    onValueChange={(value: Priority) =>
                      updateForm("priority", value)
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="priority-low" />
                      <Label htmlFor="priority-low" className="cursor-pointer">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 text-xs"
                        >
                          Low
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="priority-medium" />
                      <Label
                        htmlFor="priority-medium"
                        className="cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 text-xs"
                        >
                          Medium
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="priority-high" />
                      <Label htmlFor="priority-high" className="cursor-pointer">
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 text-xs"
                        >
                          High
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="urgent" id="priority-urgent" />
                      <Label
                        htmlFor="priority-urgent"
                        className="cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 text-xs"
                        >
                          Urgent
                        </Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Feedback Text */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-sm font-semibold">
                    Your Feedback <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="feedback"
                    value={form.feedbackText}
                    onChange={(e) => updateForm("feedbackText", e.target.value)}
                    placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered..."
                    rows={6}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {form.feedbackText.length}/1000 characters
                  </p>
                </div>

                {/* Improvement Suggestions */}
                <div className="space-y-2">
                  <Label
                    htmlFor="suggestions"
                    className="text-sm font-semibold"
                  >
                    Suggestions for Improvement (Optional)
                  </Label>
                  <Textarea
                    id="suggestions"
                    value={form.improvementSuggestions}
                    onChange={(e) =>
                      updateForm("improvementSuggestions", e.target.value)
                    }
                    placeholder="How do you think we could improve this? Any specific ideas or recommendations?"
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - Full Width */}
            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !form.feedbackText.trim() ||
                  !form.subject.trim()
                }
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
