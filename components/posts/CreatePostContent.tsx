"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Eye,
  AlertCircle,
  Brain,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubscriptionGuard } from "@/components/common/SubscriptionGuard";

interface PromptData {
  id: number;
  category: string;
  hook: string;
  prompt_text: string;
  pillar_description: string;
  pillar_number: number;
  scheduled_date: string;
}

interface PostFormData {
  title: string;
  hook: string;
  category: string;
  content: string;
  length: string;
  scheduledDate: string;
  manualMode: boolean;
}

interface CreatePostContentProps {
  userId: string;
  searchParams: {
    prompt?: string;
    edit?: string;
  };
  initialData?: {
    type: "prompt" | "edit";
    data: any;
  } | null;
}

// Map database categories to form categories (now using exact database values)
const mapCategory = (dbCategory: string): string => {
  // Return the exact database value as we now use them directly
  return dbCategory || "Educational how-to post";
};

// Get display name for post category
const getPostTypeDisplayName = (category: string): string => {
  const mapping: { [key: string]: string } = {
    "First-person anecdote": "Personal Story",
    "Educational how-to post": "Educational Guide",
    "Thought leadership/opinion piece": "Thought Leadership",
    "Case study/success story": "Case Study",
    "Listicle with a hook": "Listicle",
    "Engagement-driven question": "Engagement Question",
  };

  return mapping[category] || category;
};

export function CreatePostContent({
  userId,
  searchParams,
  initialData,
}: CreatePostContentProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    hook: "",
    category: "Educational how-to post",
    content: "",
    length: "medium",
    scheduledDate: "",
    manualMode: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [personalizationUsed, setPersonalizationUsed] = useState(false);
  const [improvementsApplied, setImprovementsApplied] = useState(0);
  const [originalGeneratedContent, setOriginalGeneratedContent] =
    useState<string>("");
  const [generationHistoryId, setGenerationHistoryId] = useState<number | null>(
    null
  );

  // Add debouncing for edit tracking
  const editTrackingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.type === "edit") {
        const postData = initialData.data;

        // Check if personalization was used in the original generation
        setPersonalizationUsed(
          postData.generation_metadata?.voice_personalization_used || false
        );

        // Extract category with optimized mapping
        let originalCategory =
          postData.generation_metadata?.original_category ||
          "Educational how-to post";

        // Simple category mapping for performance
        const categoryMapping: Record<string, string> = {
          educational: "Educational how-to post",
          "first-person-anecdote": "First-person anecdote",
          story: "First-person anecdote",
          listicle: "Listicle with a hook",
          "thought-leadership": "Thought leadership/opinion piece",
          "case-study": "Case study/success story",
          question: "Engagement-driven question",
          promotional: "Case study/success story",
          personal: "First-person anecdote",
        };

        // Use mapping if needed
        originalCategory =
          categoryMapping[originalCategory] || originalCategory;

        // Extract original hook efficiently
        const originalHook =
          postData.generation_metadata?.parameters?.hook ||
          postData.ai_prompt_used ||
          "";

        // Pre-fill form with existing post data
        setFormData({
          title: postData.title || "",
          hook: originalHook,
          category: originalCategory,
          content: postData.content || "",
          length: postData.generation_metadata?.parameters?.length || "medium",
          scheduledDate: postData.scheduled_date || "",
          manualMode: false,
        });
      } else if (initialData.type === "prompt") {
        const prompt = initialData.data;
        setFormData((prev) => ({
          ...prev,
          title: prompt.prompt_text,
          hook: prompt.hook,
          category: mapCategory(prompt.category),
          scheduledDate: prompt.scheduled_date || "",
        }));
      }
    }
  }, [initialData]);

  const handleAuthError = (error: any) => {
    console.error("Auth error:", error);
    toast.error("Authentication failed. Please log in again.");
    router.push("/login");
  };

  const handleGenerate = async () => {
    if (!formData.title || !formData.hook) {
      toast.error("Please fill in the title and hook fields");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/posts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId: searchParams.prompt,
          editPostId: searchParams.edit,
          title: formData.title,
          hook: formData.hook,
          category: formData.category,
          length: formData.length,
          scheduledDate: formData.scheduledDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Failed to generate content";
        throw new Error(errorMessage);
      }

      setPersonalizationUsed(data.personalizationUsed || false);
      setImprovementsApplied(data.improvements_applied || 0);
      setFormData((prev) => ({
        ...prev,
        content: data.content,
        manualMode: false,
      }));

      // Store the original generated content for edit tracking
      setOriginalGeneratedContent(data.content);
      setGenerationHistoryId(data.generationHistoryId || null);

      if (searchParams.edit) {
        const message =
          data.improvements_applied > 0
            ? `Post regenerated with ${data.improvements_applied} AI improvements applied!`
            : "Post regenerated successfully!";
        toast.success(message);
      } else {
        const message =
          data.improvements_applied > 0
            ? `Post drafted with ${data.improvements_applied} AI improvements applied!`
            : "Post drafted successfully!";
        toast.success(message);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate content"
      );
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartManual = () => {
    setFormData((prev) => ({
      ...prev,
      content: prev.hook + "\n\n", // Pre-fill with hook and some space
      manualMode: true,
    }));
    toast.success(
      "Manual mode activated. The hook has been added to get you started!"
    );
  };

  const handleSaveDraft = async () => {
    if (!formData.content) {
      toast.error("Please add some content first");
      return;
    }

    if (isSaving) {
      console.log("Save already in progress, ignoring duplicate request");
      return;
    }

    setIsSaving(true);
    try {
      // Track content edits in background (non-blocking) if content was modified
      if (
        originalGeneratedContent &&
        formData.content !== originalGeneratedContent
      ) {
        // Fire and forget - don't wait for edit tracking to complete
        handleContentEdit(formData.content).catch((error) => {
          console.error("Background edit tracking failed:", error);
          // Don't show error to user since this is background tracking
        });
      }

      if (searchParams.edit) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update({
            title: formData.title,
            content: formData.content,
            scheduled_date: formData.scheduledDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(searchParams.edit));

        if (error) throw error;

        router.push(`/posts?updated=${searchParams.edit}`);
      } else {
        // For new posts, we need to save the draft to database first
        const { data: newPost, error } = await supabase
          .from("posts")
          .insert({
            user_id: userId,
            title: formData.title || "Untitled Post",
            content: formData.content,
            content_type: "post",
            status: "draft",
            tone: "professional",
            topics: [],
            hashtags: [],
            scheduled_date: formData.scheduledDate || null,
            ai_prompt_used: formData.hook,
            generation_metadata: {
              original_category: formData.category,
              saved_manually: formData.manualMode,
              parameters: {
                category: formData.category,
                length: formData.length,
                hook: formData.hook,
              },
              saved_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (error) throw error;

        router.push(`/posts?draft=${newPost.id}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  // Debounce edit tracking to avoid excessive API calls
  const [editTrackingTimeout, setEditTrackingTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [lastTrackedContent, setLastTrackedContent] = useState<string>("");

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (editTrackingTimeoutRef.current) {
        clearTimeout(editTrackingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Track content edits when user modifies AI-generated content
    if (
      field === "content" &&
      originalGeneratedContent &&
      value !== originalGeneratedContent &&
      value !== lastTrackedContent // Don't track if we already tracked this exact content
    ) {
      // Clear previous timeout
      if (editTrackingTimeout) {
        clearTimeout(editTrackingTimeout);
        setEditTrackingTimeout(null);
      }

      // Set new timeout to track edit after user stops typing for 3 seconds
      const timeoutId = setTimeout(() => {
        // Double-check that content hasn't been tracked already
        if (value !== lastTrackedContent) {
          console.log(
            "Tracking edit - original:",
            originalGeneratedContent?.substring(0, 100)
          );
          console.log("Tracking edit - new:", value?.substring(0, 100));
          setLastTrackedContent(value); // Mark this content as tracked
          handleContentEdit(value);
        }
      }, 3000);

      setEditTrackingTimeout(timeoutId);
    }
  };

  const handleContentEdit = async (newContent: string) => {
    console.log("handleContentEdit called with:", {
      hasUser: !!userId,
      hasOriginalContent: !!originalGeneratedContent,
      contentChanged: newContent !== originalGeneratedContent,
      generationHistoryId,
    });

    if (
      !userId ||
      !originalGeneratedContent ||
      newContent === originalGeneratedContent
    ) {
      console.log("Edit tracking skipped - conditions not met");
      return;
    }

    // Clear previous timeout to debounce rapid edits
    if (editTrackingTimeoutRef.current) {
      clearTimeout(editTrackingTimeoutRef.current);
    }

    // Make this completely non-blocking with debouncing
    editTrackingTimeoutRef.current = setTimeout(() => {
      fetch("/api/posts/track-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: searchParams.edit ? parseInt(searchParams.edit) : null,
          original_content: originalGeneratedContent,
          edited_content: newContent,
          edit_type: "other",
          edit_significance:
            Math.abs(newContent.length - originalGeneratedContent.length) > 200
              ? "major"
              : "minor",
          generation_history_id: generationHistoryId,
          edit_reason: "user_modification",
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("Edit tracking response:", result);
        })
        .catch((error) => {
          console.error("Failed to track edit:", error);
          // Don't show error to user since this is background tracking
        });
    }, 3000); // Increased debounce delay to 3 seconds to reduce API calls
  };

  return (
    <SubscriptionGuard>
      <div className="h-[90vh] bg-gray-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {searchParams.edit ? "Edit Post" : "Create Post"}
                </h1>
                {initialData?.type === "edit" && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600">
                      Editing existing post
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {initialData.data.status}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* AI Draft Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.title || !formData.hook}
                className="bg-[#537FFF] hover:bg-[#4366E6] text-white font-semibold"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Draft
                  </>
                )}
              </Button>

              {/* Manual Writing Button */}
              {!formData.content && (
                <Button
                  variant="outline"
                  onClick={handleStartManual}
                  disabled={!formData.hook}
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Write Manually</span>
                </Button>
              )}

              {/* Save Button */}
              {formData.content && (
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>
                        {searchParams.edit ? "Save Changes" : "View in Posts"}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 py-2">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Content Area */}
            <div className="flex-1 p-6 min-h-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Post Content
                  </h3>
                  {formData.content && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveDraft}
                        className="flex items-center space-x-2"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Save Post</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-0">
                  {formData.content ? (
                    <div className="h-full flex flex-col space-y-3">
                      {/* Manual Mode Notice */}
                      {formData.manualMode && !personalizationUsed && (
                        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800 mb-1">
                              Writing manually
                            </p>
                            <p className="text-xs text-green-700">
                              You are writing this post from scratch. Take your
                              time and craft something authentic!
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Personalization Notice */}
                      {personalizationUsed && !formData.manualMode && (
                        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                          <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-purple-800 mb-1">
                              Drafted using your personal writing profile
                            </p>
                            <p className="text-xs text-purple-700">
                              Make edits to finalize — your changes will help
                              future posts sound even more like you.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Improvements Applied Notice */}
                      {improvementsApplied > 0 && !formData.manualMode && (
                        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800 mb-1">
                              {improvementsApplied} AI improvements applied
                            </p>
                            <p className="text-xs text-green-700">
                              This content was automatically improved based on
                              your past editing patterns. The AI is learning
                              your style!
                            </p>
                          </div>
                        </div>
                      )}

                      <Textarea
                        value={formData.content}
                        onChange={(e) =>
                          handleInputChange("content", e.target.value)
                        }
                        className="w-full flex-1 resize-none text-gray-900 leading-relaxed"
                        placeholder={
                          formData.manualMode
                            ? "Continue writing your post here..."
                            : "Your generated content will appear here and be immediately editable..."
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="text-center space-y-4">
                        <Sparkles className="h-12 w-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-lg font-medium mb-2">
                            Ready to create your post?
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            Choose how you would like to create your content
                          </p>
                          <div className="space-y-2 text-xs text-gray-500">
                            <p>
                              <strong>AI Draft:</strong> Let AI write a complete
                              post based on your inputs
                            </p>
                            <p>
                              <strong>Write Manually:</strong> Start with your
                              hook and write the post yourself
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col border-b">
            <div className="flex-1 px-6 pt-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Pillar Content Display - Moved to top */}
                {initialData?.type === "prompt" &&
                  initialData.data.pillar_description &&
                  initialData.data.pillar_description !==
                    `Pillar ${initialData.data.pillar_number}` && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Content Pillar
                      </Label>
                      <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {initialData.data.pillar_description}
                        </p>
                      </div>
                    </div>
                  )}

                <div>
                  <Label
                    htmlFor="title"
                    className="text-sm font-medium text-gray-700"
                  >
                    Prompt *
                  </Label>
                  <Textarea
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="What's this post about?"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="hook"
                    className="text-sm font-medium text-gray-700"
                  >
                    Hook/Opening *
                  </Label>
                  <Textarea
                    id="hook"
                    value={formData.hook}
                    onChange={(e) => handleInputChange("hook", e.target.value)}
                    placeholder="Start with something engaging..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Post Format
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select post format..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First-person anecdote">
                        First-Person Anecdote
                      </SelectItem>
                      <SelectItem value="Listicle with a hook">
                        Listicle with a Hook
                      </SelectItem>
                      <SelectItem value="Educational how-to post">
                        Educational How-To Post
                      </SelectItem>
                      <SelectItem value="Thought leadership/opinion piece">
                        Thought Leadership/Opinion Piece
                      </SelectItem>
                      <SelectItem value="Case study/success story">
                        Case Study/Success Story
                      </SelectItem>
                      <SelectItem value="Engagement-driven question">
                        Engagement-Driven Question
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Post Length
                  </Label>
                  <Select
                    value={formData.length}
                    onValueChange={(value) =>
                      handleInputChange("length", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">
                        Short (100-200 words)
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium (200-400 words)
                      </SelectItem>
                      <SelectItem value="long">Long (400+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="scheduledDate"
                    className="text-sm font-medium text-gray-700"
                  >
                    Schedule Date (Optional)
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      handleInputChange("scheduledDate", e.target.value)
                    }
                    className="mt-1"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When do you plan to publish this post?
                  </p>
                </div>

                {/* Generate Button */}
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.title || !formData.hook}
                    className="w-full h-12 bg-[#537FFF] hover:bg-[#4366E6] text-white font-semibold text-base"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-3" />
                        Draft Post
                      </>
                    )}
                  </Button>

                  {/* Personalization Help Text */}
                  {!personalizationUsed && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      💡 Complete your{" "}
                      <button
                        onClick={() => router.push("/profile/writing-profile")}
                        className="text-purple-600 hover:text-purple-700 font-medium underline"
                      >
                        Writing Profile
                      </button>{" "}
                      for personalized content
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubscriptionGuard>
  );
}
