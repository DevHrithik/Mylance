"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Brain,
  Save,
  Sparkles,
  Type,
  MessageSquare,
  Settings,
  TrendingUp,
  Edit3,
  Target,
  Zap,
  Palette,
  Volume2,
  BarChart3,
  Heart,
  MessageCircle,
  Share,
  Eye,
  PlusCircle,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { revalidatePreferences } from "@/lib/supabase/server-queries";
import { CreateWritingProfileModal } from "@/components/common/CreateWritingProfileModal";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { WhatWorksInsights } from "./WhatWorksInsights";

interface UserPreferences {
  id: number;
  user_id: string;
  frequently_used_words: string[];
  industry_jargon: string[];
  signature_expressions: string[];
  emoji_usage_preference: string;
  average_sentence_length: string;
  content_length_preference: string;
  structural_patterns: string[];
  tone_markers: any;
  formatting_preferences: any;
  post_type_preferences: any;
  editing_patterns: any;
  never_use_phrases: string[];
  preferred_hooks: string[];
  cta_preferences: any;
  storytelling_style: string;
  humor_usage: string;
  question_usage: string;
  directness_level: number;
  confidence_level: number;
  energy_level: number;
  voice_attributes: string[];
  writing_style_tone: string;
  writing_style_formality: number;
  personalization_data: any;
  content_goals?: string[];
  primary_goal?: string;
  target_audience?: any;
  preferred_content_types?: string[];
  email_notifications?: boolean;
  content_reminders?: boolean;
  weekly_insights?: boolean;
  marketing_emails?: boolean;
  onboarding_data?: any;
  content_pillars?: any;
  default_dashboard_view?: string;
  sample_posts?: any[];
  created_at: string;
  updated_at: string;
}

interface WritingProfileData {
  preferences: UserPreferences | null;
  hasPreferences: boolean;
}

interface WritingProfileContentProps {
  initialData: WritingProfileData;
  userId: string;
}

export function WritingProfileContent({
  initialData,
  userId,
}: WritingProfileContentProps) {
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(
    initialData.preferences
  );
  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences | null>(initialData.preferences);
  const [newSamplePost, setNewSamplePost] = useState("");
  const [analyzingPost, setAnalyzingPost] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(
    !initialData.hasPreferences
  );
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    postContent: "",
    impressions: "",
    likes: "",
    comments: "",
    shares: "",
    linkedinUrl: "",
    postDate: "",
  });
  const [whatWorksData, setWhatWorksData] = useState<any>(null);
  const [whatWorksLoading, setWhatWorksLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createClient();

  const fetchPreferences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
        return;
      }

      if (data) {
        console.log("Fetched data sample_posts:", data.sample_posts);
        setPreferences(data);
        setLocalPreferences(data);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, [userId, supabase]);

  // Update local state when preferences change - simple sync
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const currentPreferences = editMode ? localPreferences : preferences;

  const handleSave = async () => {
    if (!localPreferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          frequently_used_words: localPreferences.frequently_used_words,
          industry_jargon: localPreferences.industry_jargon,
          signature_expressions: localPreferences.signature_expressions,
          emoji_usage_preference: localPreferences.emoji_usage_preference,
          average_sentence_length: localPreferences.average_sentence_length,
          content_length_preference: localPreferences.content_length_preference,
          structural_patterns: localPreferences.structural_patterns,
          tone_markers: localPreferences.tone_markers,
          formatting_preferences: localPreferences.formatting_preferences,
          post_type_preferences: localPreferences.post_type_preferences,
          editing_patterns: localPreferences.editing_patterns,
          never_use_phrases: localPreferences.never_use_phrases,
          preferred_hooks: localPreferences.preferred_hooks,
          cta_preferences: localPreferences.cta_preferences,
          storytelling_style: localPreferences.storytelling_style,
          humor_usage: localPreferences.humor_usage,
          question_usage: localPreferences.question_usage,
          directness_level: localPreferences.directness_level,
          confidence_level: localPreferences.confidence_level,
          energy_level: localPreferences.energy_level,
          voice_attributes: localPreferences.voice_attributes,
          writing_style_tone: localPreferences.writing_style_tone,
          writing_style_formality: localPreferences.writing_style_formality,
          personalization_data: localPreferences.personalization_data,
          sample_posts: localPreferences.sample_posts || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", localPreferences.id);

      if (error) {
        console.error("Error updating preferences:", error);
        toast.error("Failed to save writing profile");
        return;
      }

      toast.success("Writing profile updated successfully!");
      setEditMode(false);

      // Update the main preferences state with saved data
      setPreferences(localPreferences);

      // Revalidate server cache (but don't immediately fetch to avoid overwriting)
      try {
        await revalidatePreferences();
      } catch (revalidationError) {
        console.warn("Cache revalidation failed:", revalidationError);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save writing profile");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UserPreferences, value: any) => {
    if (!localPreferences) return;
    setLocalPreferences((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const addToArray = (field: keyof UserPreferences, value: string) => {
    if (!value.trim() || !localPreferences) return;
    const currentArray = (localPreferences[field] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      updateField(field, [...currentArray, value.trim()]);
    }
  };

  const removeFromArray = (field: keyof UserPreferences, value: string) => {
    if (!localPreferences) return;
    const currentArray = (localPreferences[field] as string[]) || [];
    updateField(
      field,
      currentArray.filter((item) => item !== value)
    );
  };

  const handleAddPostsClick = async () => {
    if (!newSamplePost.trim()) {
      // If textarea is empty, just focus it
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    // If there's content, add the post
    await addSamplePost();
  };

  // Add analytics functionality
  const handleCollectAnalytics = () => {
    setAnalyticsData({
      postContent: newSamplePost,
      impressions: "",
      likes: "",
      comments: "",
      shares: "",
      linkedinUrl: "",
      postDate: "",
    });
    setShowAnalyticsDialog(true);
  };

  const resetAnalyticsData = () => {
    setAnalyticsData({
      postContent: "",
      impressions: "",
      likes: "",
      comments: "",
      shares: "",
      linkedinUrl: "",
      postDate: "",
    });
  };

  const addSamplePostWithAnalytics = async () => {
    if (!analyticsData.postContent.trim() || !localPreferences) return;

    setAnalyzingPost(true);
    try {
      const engagement_rate =
        analyticsData.impressions && parseInt(analyticsData.impressions) > 0
          ? ((parseInt(analyticsData.likes || "0") +
              parseInt(analyticsData.comments || "0") +
              parseInt(analyticsData.shares || "0")) /
              parseInt(analyticsData.impressions)) *
            100
          : 0;

      console.log("Sending analytics data:", {
        postContent: analyticsData.postContent.substring(0, 100) + "...",
        impressions: analyticsData.impressions,
        likes: analyticsData.likes,
        comments: analyticsData.comments,
        shares: analyticsData.shares,
        linkedinUrl: analyticsData.linkedinUrl,
        postDate: analyticsData.postDate,
      });

      let analyticsResult = null;
      let analyticsError = null;

      // Try to save to analytics table via API (but don't fail if it doesn't work)
      try {
        const analyticsResponse = await fetch("/api/sample-posts/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postContent: analyticsData.postContent,
            impressions: analyticsData.impressions,
            likes: analyticsData.likes,
            comments: analyticsData.comments,
            shares: analyticsData.shares,
            linkedinUrl: analyticsData.linkedinUrl,
            postDate: analyticsData.postDate,
          }),
        });

        console.log("Analytics response status:", analyticsResponse.status);

        if (analyticsResponse.ok) {
          const responseText = await analyticsResponse.text();
          console.log("Analytics response text:", responseText);

          if (responseText) {
            try {
              analyticsResult = JSON.parse(responseText);
              console.log("Analytics saved successfully:", analyticsResult);
            } catch (parseError) {
              console.error("Failed to parse analytics response:", parseError);
              analyticsError = "Invalid response format from analytics API";
            }
          } else {
            analyticsError = "Empty response from analytics API";
          }
        } else {
          const errorText = await analyticsResponse.text();
          console.error("Analytics API error response:", errorText);

          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              analyticsError =
                errorData.details ||
                errorData.error ||
                "Failed to save analytics data";
            } catch (parseError) {
              analyticsError =
                "Analytics API returned error: " + analyticsResponse.status;
            }
          } else {
            analyticsError = "Analytics API returned empty error response";
          }
        }
      } catch (fetchError) {
        console.error("Analytics API fetch error:", fetchError);
        analyticsError = "Failed to connect to analytics API";
      }

      // Create post data (with or without analytics)
      const postData = {
        content: analyticsData.postContent.trim(),
        added_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
        word_count: analyticsData.postContent.trim().split(/\s+/).length,
        character_count: analyticsData.postContent.trim().length,
        // Analytics data (even if API failed, we can store the basic metrics)
        analytics: {
          impressions: parseInt(analyticsData.impressions || "0"),
          likes: parseInt(analyticsData.likes || "0"),
          comments: parseInt(analyticsData.comments || "0"),
          shares: parseInt(analyticsData.shares || "0"),
          engagement_rate: parseFloat(engagement_rate.toFixed(2)),
          linkedin_url: analyticsData.linkedinUrl || null,
          post_date: analyticsData.postDate || null,
          collected_at: new Date().toISOString(),
        },
        performance_insights: {
          high_performing: engagement_rate > 5,
          engagement_level:
            engagement_rate > 10
              ? "excellent"
              : engagement_rate > 5
              ? "good"
              : engagement_rate > 2
              ? "average"
              : "low",
          what_works:
            engagement_rate > 5
              ? [
                  "Strong engagement metrics",
                  "Content resonated with audience",
                  "Good reach and interaction",
                ]
              : [],
          analytics_id: analyticsResult?.data?.id || null,
          analytics_error: analyticsError, // Store any error for debugging
        },
      };

      const currentPosts = localPreferences.sample_posts || [];
      const updatedPosts = [...currentPosts, postData];

      console.log("Saving to user preferences...");

      // Save to user preferences (this should always work)
      const { error } = await supabase
        .from("user_preferences")
        .update({
          sample_posts: updatedPosts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", localPreferences.id);

      if (error) {
        console.error(
          "Error saving post with analytics to preferences:",
          error
        );
        toast.error("Failed to save post to preferences: " + error.message);
        return;
      }

      // Clear inputs and close dialog
      setNewSamplePost("");
      resetAnalyticsData();
      setShowAnalyticsDialog(false);

      // Clear What Works cache to ensure fresh data
      const cacheKey = `what-works-insights-${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}-timestamp`);

      // Fetch fresh data
      await fetchPreferences();

      // Show success message (with warning if analytics failed)
      if (analyticsError) {
        toast.success("Sample post added successfully!", {
          duration: 5000,
          description: `Engagement rate: ${engagement_rate.toFixed(
            2
          )}% • Note: Analytics data saved locally (API issue: ${analyticsError})`,
        });
      } else {
        toast.success("Sample post with analytics added successfully!", {
          duration: 3000,
          description: `Engagement rate: ${engagement_rate.toFixed(2)}% • ${
            analyticsResult?.data?.insights?.performance_category || "Good"
          } performance`,
        });
      }

      // Analyze writing style and save
      await analyzeWritingStyle(updatedPosts);

      // Use setTimeout to ensure state updates are processed before saving
      setTimeout(async () => {
        await handleSave();
      }, 100);
    } catch (error) {
      console.error("Error adding sample post with analytics:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to add sample post with analytics: " + errorMessage);
    } finally {
      setAnalyzingPost(false);
    }
  };

  const addSamplePost = async () => {
    if (!newSamplePost.trim() || !localPreferences) return;

    setAnalyzingPost(true);
    try {
      const postData = {
        content: newSamplePost.trim(),
        added_at: new Date().toISOString(),
        analyzed_at: new Date().toISOString(),
        word_count: newSamplePost.trim().split(/\s+/).length,
        character_count: newSamplePost.trim().length,
      };

      const currentPosts = localPreferences.sample_posts || [];
      const updatedPosts = [...currentPosts, postData];

      // Save to database FIRST
      const { error } = await supabase
        .from("user_preferences")
        .update({
          sample_posts: updatedPosts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", localPreferences.id);

      if (error) {
        console.error("Error saving post:", error);
        toast.error("Failed to save post");
        return;
      }

      // Clear the input
      setNewSamplePost("");

      // Fetch fresh data from database to ensure consistency
      await fetchPreferences();

      toast.success("Sample post added - analyzing writing style...", {
        duration: 3000,
      });

      // Now analyze the writing style and save results
      await analyzeWritingStyle(updatedPosts);

      // Use setTimeout to ensure state updates are processed before saving
      setTimeout(async () => {
        await handleSave();
      }, 100);
    } catch (error) {
      console.error("Error adding sample post:", error);
      toast.error("Failed to add sample post");
    } finally {
      setAnalyzingPost(false);
    }
  };

  const analyzeWritingStyle = async (posts: any[]) => {
    if (posts.length === 0) return;

    try {
      const response = await fetch("/api/analyze-writing-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: posts.map((p) => p.content),
          userId: localPreferences?.user_id,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysis = await response.json();
      console.log("Analysis result:", analysis);

      // Update the preferences with analyzed data (preserve sample_posts)
      if (localPreferences) {
        setLocalPreferences((prev) =>
          prev
            ? {
                ...prev,
                // CRITICAL: Never modify sample_posts here - they're already saved to DB
                // sample_posts: prev.sample_posts || [], // Don't touch this field

                // Profile Tab - Auto-fill vocabulary and expressions
                frequently_used_words:
                  analysis.frequently_used_words ||
                  prev.frequently_used_words ||
                  [],
                signature_expressions:
                  analysis.signature_expressions ||
                  prev.signature_expressions ||
                  [],

                // Style Tab - Auto-fill structural preferences
                emoji_usage_preference:
                  analysis.emoji_usage ||
                  prev.emoji_usage_preference ||
                  "minimal",
                average_sentence_length:
                  analysis.sentence_length ||
                  prev.average_sentence_length ||
                  "medium",

                // Tone Tab - Auto-fill all tone characteristics
                directness_level:
                  analysis.directness_level || prev.directness_level || 5,
                confidence_level:
                  analysis.confidence_level || prev.confidence_level || 5,
                energy_level: analysis.energy_level || prev.energy_level || 5,
                writing_style_tone:
                  analysis.tone || prev.writing_style_tone || "professional",
                humor_usage:
                  analysis.humor_usage || prev.humor_usage || "minimal",

                // Auto-detect formality level based on tone
                writing_style_formality:
                  analysis.tone === "professional"
                    ? 8
                    : analysis.tone === "authoritative"
                    ? 9
                    : analysis.tone === "educational"
                    ? 7
                    : analysis.tone === "conversational"
                    ? 4
                    : analysis.tone === "casual"
                    ? 3
                    : analysis.tone === "inspirational"
                    ? 6
                    : prev.writing_style_formality || 5,

                // Auto-detect question usage based on analysis
                question_usage:
                  analysis.tone === "conversational"
                    ? "frequent"
                    : analysis.tone === "educational"
                    ? "moderate"
                    : analysis.tone === "professional"
                    ? "minimal"
                    : prev.question_usage || "moderate",

                personalization_data: {
                  ...prev.personalization_data,
                  last_analysis: new Date().toISOString(),
                  analysis_insights: analysis.insights || [],
                  learning_summary: analysis.learning_summary || "",
                },
              }
            : null
        );

        toast.success(
          "Writing style analyzed and profile updated! Check all tabs to see the auto-filled information.",
          {
            duration: 6000,
          }
        );
      }
    } catch (error) {
      console.error("Error analyzing writing style:", error);
      toast.error("Analysis completed, but some insights may be limited");
    }
  };

  const removeSamplePost = (index: number) => {
    if (!localPreferences) return;
    const currentPosts = localPreferences.sample_posts || [];
    updateField(
      "sample_posts",
      currentPosts.filter((_, i) => i !== index)
    );
  };

  const handleCreateSuccess = () => {
    fetchPreferences();
    setShowCreateModal(false);
  };

  const closeModal = () => {
    setShowCreateModal(false);
  };

  const testApiConnection = async () => {
    try {
      console.log("Testing API connection...");

      // Test basic auth
      const authResponse = await fetch("/api/test-auth");
      const authResult = await authResponse.json();
      console.log("Auth test result:", authResult);

      if (!authResult.success) {
        toast.error("Auth test failed: " + authResult.error);
        return;
      }

      // Test POST with sample data
      const postResponse = await fetch("/api/test-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "data" }),
      });
      const postResult = await postResponse.json();
      console.log("POST test result:", postResult);

      if (postResult.success) {
        toast.success("API connection test successful!");
      } else {
        toast.error("POST test failed: " + postResult.error);
      }
    } catch (error) {
      console.error("API test error:", error);
      toast.error(
        "API test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // If no preferences, show loading state while modal handles the creation
  if (!preferences) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Setting up your Writing Profile...
              </h1>
              <p className="text-slate-600">
                Please complete the setup to continue
              </p>
            </div>
          </div>
        </div>

        {/* Local modal for this page only */}
        <CreateWritingProfileModal
          open={showCreateModal}
          onClose={closeModal}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  // Early return if currentPreferences is null to satisfy TypeScript
  if (!currentPreferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Loading your Writing Profile...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Writing Profile
            </h1>
            <p className="text-slate-600">
              Customize how AI generates content in your unique voice and style
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={editMode ? handleSave : () => setEditMode(true)}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Style
            </TabsTrigger>
            <TabsTrigger value="tone" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Tone
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="what-works" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              What Works
            </TabsTrigger>
          </TabsList>

          {/* Lexical Choices Tab */}
          <TabsContent value="profile" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Frequently Used Words
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Words and phrases you commonly use
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a word or phrase..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "frequently_used_words",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.frequently_used_words?.map(
                        (word: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray("frequently_used_words", word)
                            }
                          >
                            {word} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.frequently_used_words ||
                        currentPreferences.frequently_used_words.length ===
                          0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add words you frequently use in your writing"
                            : "No frequently used words defined yet"}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Industry Jargon
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add industry term..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "industry_jargon",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.industry_jargon?.map(
                        (term: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray("industry_jargon", term)
                            }
                          >
                            {term} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.industry_jargon ||
                        currentPreferences.industry_jargon.length === 0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add technical terms specific to your industry"
                            : "No industry jargon defined yet"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Signature Expressions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Your unique phrases and expressions
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add signature expression..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "signature_expressions",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.signature_expressions?.map(
                        (expression: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray(
                                "signature_expressions",
                                expression
                              )
                            }
                          >
                            {expression} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.signature_expressions ||
                        currentPreferences.signature_expressions.length ===
                          0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add phrases that are uniquely yours"
                            : "No signature expressions defined yet"}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Words/Phrases to Never Use
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add phrase to avoid..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "never_use_phrases",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.never_use_phrases?.map(
                        (phrase: string, index: number) => (
                          <Badge
                            key={index}
                            variant="destructive"
                            className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray("never_use_phrases", phrase)
                            }
                          >
                            {phrase} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.never_use_phrases ||
                        currentPreferences.never_use_phrases.length === 0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add words or phrases you want to avoid"
                            : "No forbidden phrases defined yet"}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Emoji Usage
                    </Label>
                    {editMode ? (
                      <Select
                        value={
                          currentPreferences.emoji_usage_preference || "minimal"
                        }
                        onValueChange={(value) =>
                          updateField("emoji_usage_preference", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Never use emojis</SelectItem>
                          <SelectItem value="minimal">Minimal usage</SelectItem>
                          <SelectItem value="moderate">
                            Moderate usage
                          </SelectItem>
                          <SelectItem value="frequent">
                            Frequent usage
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.emoji_usage_preference || "Minimal"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Structure Tab */}
          <TabsContent value="style" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Sentence & Content Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Average Sentence Length
                    </Label>
                    {editMode ? (
                      <Select
                        value={
                          currentPreferences.average_sentence_length || "medium"
                        }
                        onValueChange={(value) =>
                          updateField("average_sentence_length", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">
                            Short (5-10 words)
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium (10-20 words)
                          </SelectItem>
                          <SelectItem value="long">Long (20+ words)</SelectItem>
                          <SelectItem value="varied">Varied mix</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.average_sentence_length || "Medium"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Content Length Preference
                    </Label>
                    {editMode ? (
                      <Select
                        value={
                          currentPreferences.content_length_preference ||
                          "medium"
                        }
                        onValueChange={(value) =>
                          updateField("content_length_preference", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">
                            Short (100-300 words)
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium (300-600 words)
                          </SelectItem>
                          <SelectItem value="long">
                            Long (600+ words)
                          </SelectItem>
                          <SelectItem value="varies">
                            Varies by topic
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.content_length_preference ||
                          "Medium"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Preferred Structural Patterns
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add structural pattern..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "structural_patterns",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.structural_patterns?.map(
                        (pattern: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray("structural_patterns", pattern)
                            }
                          >
                            {pattern} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.structural_patterns ||
                        currentPreferences.structural_patterns.length ===
                          0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add patterns like 'Problem-Solution-Benefit', 'Story-Lesson-CTA', etc."
                            : "No patterns defined yet"}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Content Hooks & CTAs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Preferred Hook Styles
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add hook style..."
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addToArray(
                                "preferred_hooks",
                                e.currentTarget.value
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="shadow-sm border-slate-200"
                        />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {currentPreferences?.preferred_hooks?.map(
                        (hook: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                            onClick={() =>
                              editMode &&
                              removeFromArray("preferred_hooks", hook)
                            }
                          >
                            {hook} {editMode && "×"}
                          </Badge>
                        )
                      )}
                      {(!currentPreferences?.preferred_hooks ||
                        currentPreferences.preferred_hooks.length === 0) && (
                        <div className="text-slate-500 italic">
                          {editMode
                            ? "Add hooks like 'Question', 'Statistic', 'Personal Story', etc."
                            : "No hook styles defined yet"}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Storytelling Style
                    </Label>
                    {editMode ? (
                      <Select
                        value={
                          currentPreferences.storytelling_style || "balanced"
                        }
                        onValueChange={(value) =>
                          updateField("storytelling_style", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="narrative">
                            Narrative-heavy
                          </SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="data-driven">
                            Data-driven
                          </SelectItem>
                          <SelectItem value="minimal">
                            Minimal storytelling
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.storytelling_style || "Balanced"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Question Usage
                    </Label>
                    {editMode ? (
                      <Select
                        value={currentPreferences.question_usage || "moderate"}
                        onValueChange={(value) =>
                          updateField("question_usage", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frequent">
                            Frequent questions
                          </SelectItem>
                          <SelectItem value="moderate">
                            Moderate questions
                          </SelectItem>
                          <SelectItem value="minimal">
                            Minimal questions
                          </SelectItem>
                          <SelectItem value="rhetorical">
                            Mostly rhetorical
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.question_usage || "Moderate"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tone Tab */}
          <TabsContent value="tone" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Voice Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Directness Level:{" "}
                      {currentPreferences.directness_level || 5}
                    </Label>
                    <div className="px-2">
                      {editMode ? (
                        <Slider
                          value={[currentPreferences.directness_level || 5]}
                          onValueChange={(value) =>
                            updateField("directness_level", value[0])
                          }
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      ) : (
                        <div className="relative w-full h-2 bg-slate-200 rounded-full">
                          <div
                            className="absolute h-2 bg-orange-500 rounded-full"
                            style={{
                              width: `${
                                ((currentPreferences.directness_level || 5) /
                                  10) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>Subtle</span>
                        <span>Direct</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Confidence Level:{" "}
                      {currentPreferences.confidence_level || 5}
                    </Label>
                    <div className="px-2">
                      {editMode ? (
                        <Slider
                          value={[currentPreferences.confidence_level || 5]}
                          onValueChange={(value) =>
                            updateField("confidence_level", value[0])
                          }
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      ) : (
                        <div className="relative w-full h-2 bg-slate-200 rounded-full">
                          <div
                            className="absolute h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${
                                ((currentPreferences.confidence_level || 5) /
                                  10) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>Humble</span>
                        <span>Confident</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Energy Level: {currentPreferences.energy_level || 5}
                    </Label>
                    <div className="px-2">
                      {editMode ? (
                        <Slider
                          value={[currentPreferences.energy_level || 5]}
                          onValueChange={(value) =>
                            updateField("energy_level", value[0])
                          }
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      ) : (
                        <div className="relative w-full h-2 bg-slate-200 rounded-full">
                          <div
                            className="absolute h-2 bg-green-500 rounded-full"
                            style={{
                              width: `${
                                ((currentPreferences.energy_level || 5) / 10) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>Calm</span>
                        <span>Energetic</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Style Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Writing Tone
                    </Label>
                    {editMode ? (
                      <Select
                        value={
                          currentPreferences.writing_style_tone ||
                          "professional"
                        }
                        onValueChange={(value) =>
                          updateField("writing_style_tone", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">
                            Professional
                          </SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="authoritative">
                            Authoritative
                          </SelectItem>
                          <SelectItem value="conversational">
                            Conversational
                          </SelectItem>
                          <SelectItem value="inspirational">
                            Inspirational
                          </SelectItem>
                          <SelectItem value="educational">
                            Educational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-slate-900 bg-slate-50 p-3 rounded-lg font-medium">
                        {currentPreferences.writing_style_tone ||
                          "Professional"}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Humor Usage
                    </Label>
                    {editMode ? (
                      <Select
                        value={currentPreferences.humor_usage || "minimal"}
                        onValueChange={(value) =>
                          updateField("humor_usage", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No humor</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="frequent">Frequent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.humor_usage || "minimal"}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Question Usage
                    </Label>
                    {editMode ? (
                      <Select
                        value={currentPreferences.question_usage || "moderate"}
                        onValueChange={(value) =>
                          updateField("question_usage", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No questions</SelectItem>
                          <SelectItem value="minimal">
                            Minimal questions
                          </SelectItem>
                          <SelectItem value="moderate">
                            Moderate questions
                          </SelectItem>
                          <SelectItem value="frequent">
                            Frequent questions
                          </SelectItem>
                          <SelectItem value="rhetorical">
                            Mostly rhetorical
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.question_usage || "moderate"}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Formality Level:{" "}
                      {currentPreferences.writing_style_formality || 5}
                    </Label>
                    <div className="px-2">
                      {editMode ? (
                        <Slider
                          value={[
                            currentPreferences.writing_style_formality || 5,
                          ]}
                          onValueChange={(value) =>
                            updateField("writing_style_formality", value[0])
                          }
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      ) : (
                        <div className="relative w-full h-2 bg-slate-200 rounded-full">
                          <div
                            className="absolute h-2 bg-purple-500 rounded-full"
                            style={{
                              width: `${
                                ((currentPreferences.writing_style_formality ||
                                  5) /
                                  10) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>Casual</span>
                        <span>Formal</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Sample Posts Training
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Add Your LinkedIn Posts for AI Training
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Paste your existing LinkedIn posts to help the AI learn
                      your writing style, tone, and preferences. The more
                      samples you provide, the better the AI can match your
                      unique voice.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Paste a LinkedIn post that represents your writing style..."
                    value={newSamplePost}
                    onChange={(e) => setNewSamplePost(e.target.value)}
                    className="min-h-[120px] shadow-sm border-slate-200"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-slate-500">
                      {newSamplePost.split(/\s+/).filter(Boolean).length} words
                      • {newSamplePost.length} characters
                    </p>
                    <div className="flex gap-2">
                      <Dialog
                        open={showAnalyticsDialog}
                        onOpenChange={setShowAnalyticsDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCollectAnalytics}
                            className="flex items-center gap-2"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Add with Analytics
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-auto">
                          <DialogHeader className="pb-6">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                              <BarChart3 className="h-6 w-6 text-purple-600" />
                              Add Post Analytics
                            </DialogTitle>
                            <DialogDescription className="text-base text-gray-600">
                              Track your LinkedIn post performance to help AI
                              understand what content resonates with your
                              audience.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-8">
                            {/* Post Content Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-semibold text-sm">
                                    1
                                  </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Post Content
                                </h3>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <Label
                                  htmlFor="post-preview"
                                  className="text-sm font-medium text-gray-700 mb-3 block"
                                >
                                  LinkedIn Post Content *
                                </Label>
                                <Textarea
                                  id="post-preview"
                                  value={analyticsData.postContent}
                                  onChange={(e) =>
                                    setAnalyticsData((prev) => ({
                                      ...prev,
                                      postContent: e.target.value,
                                    }))
                                  }
                                  className="min-h-[160px] text-sm border-gray-300 focus:border-purple-500"
                                  placeholder="Paste your LinkedIn post content here..."
                                />
                                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                                  <span>
                                    {
                                      analyticsData.postContent
                                        .split(/\s+/)
                                        .filter(Boolean).length
                                    }{" "}
                                    words • {analyticsData.postContent.length}{" "}
                                    characters
                                  </span>
                                  {analyticsData.postContent.length > 3000 && (
                                    <span className="text-amber-600 font-medium">
                                      ⚠️ Very long post
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label
                                    htmlFor="linkedin-url"
                                    className="text-sm font-medium text-gray-700 mb-2 block"
                                  >
                                    LinkedIn Post URL (optional)
                                  </Label>
                                  <Input
                                    id="linkedin-url"
                                    placeholder="https://www.linkedin.com/posts/username/..."
                                    value={analyticsData.linkedinUrl}
                                    onChange={(e) =>
                                      setAnalyticsData((prev) => ({
                                        ...prev,
                                        linkedinUrl: e.target.value,
                                      }))
                                    }
                                    className="border-gray-300 focus:border-purple-500"
                                  />
                                </div>

                                <div>
                                  <Label
                                    htmlFor="post-date"
                                    className="text-sm font-medium text-gray-700 mb-2 block"
                                  >
                                    Post Date (optional)
                                  </Label>
                                  <Input
                                    id="post-date"
                                    type="date"
                                    value={analyticsData.postDate}
                                    onChange={(e) =>
                                      setAnalyticsData((prev) => ({
                                        ...prev,
                                        postDate: e.target.value,
                                      }))
                                    }
                                    className="border-gray-300 focus:border-purple-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Performance Metrics Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    2
                                  </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Performance Metrics
                                </h3>
                              </div>

                              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Eye className="h-5 w-5 text-blue-600" />
                                      <Label
                                        htmlFor="impressions"
                                        className="text-sm font-medium text-gray-700"
                                      >
                                        Impressions
                                      </Label>
                                    </div>
                                    <Input
                                      id="impressions"
                                      type="number"
                                      placeholder="1,250"
                                      value={analyticsData.impressions}
                                      onChange={(e) =>
                                        setAnalyticsData((prev) => ({
                                          ...prev,
                                          impressions: e.target.value,
                                        }))
                                      }
                                      className="text-base font-medium bg-white border-gray-300 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-600">
                                      How many people saw this post
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Heart className="h-5 w-5 text-red-500" />
                                      <Label
                                        htmlFor="likes"
                                        className="text-sm font-medium text-gray-700"
                                      >
                                        Likes
                                      </Label>
                                    </div>
                                    <Input
                                      id="likes"
                                      type="number"
                                      placeholder="45"
                                      value={analyticsData.likes}
                                      onChange={(e) =>
                                        setAnalyticsData((prev) => ({
                                          ...prev,
                                          likes: e.target.value,
                                        }))
                                      }
                                      className="text-base font-medium bg-white border-gray-300 focus:border-red-300 focus:ring-red-300"
                                    />
                                    <p className="text-xs text-gray-600">
                                      Total reactions received
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <MessageCircle className="h-5 w-5 text-green-600" />
                                      <Label
                                        htmlFor="comments"
                                        className="text-sm font-medium text-gray-700"
                                      >
                                        Comments
                                      </Label>
                                    </div>
                                    <Input
                                      id="comments"
                                      type="number"
                                      placeholder="12"
                                      value={analyticsData.comments}
                                      onChange={(e) =>
                                        setAnalyticsData((prev) => ({
                                          ...prev,
                                          comments: e.target.value,
                                        }))
                                      }
                                      className="text-base font-medium bg-white border-gray-300 focus:border-green-300 focus:ring-green-300"
                                    />
                                    <p className="text-xs text-gray-600">
                                      Number of comments
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Share className="h-5 w-5 text-purple-600" />
                                      <Label
                                        htmlFor="shares"
                                        className="text-sm font-medium text-gray-700"
                                      >
                                        Shares
                                      </Label>
                                    </div>
                                    <Input
                                      id="shares"
                                      type="number"
                                      placeholder="8"
                                      value={analyticsData.shares}
                                      onChange={(e) =>
                                        setAnalyticsData((prev) => ({
                                          ...prev,
                                          shares: e.target.value,
                                        }))
                                      }
                                      className="text-base font-medium bg-white border-gray-300 focus:border-purple-300 focus:ring-purple-300"
                                    />
                                    <p className="text-xs text-gray-600">
                                      Times shared or reposted
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Engagement Analysis Section */}
                            {analyticsData.impressions &&
                              parseInt(analyticsData.impressions) > 0 && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <span className="text-green-600 font-semibold text-sm">
                                        ✓
                                      </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      Engagement Analysis
                                    </h3>
                                  </div>

                                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600 mb-1">
                                          {(
                                            ((parseInt(
                                              analyticsData.likes || "0"
                                            ) +
                                              parseInt(
                                                analyticsData.comments || "0"
                                              ) +
                                              parseInt(
                                                analyticsData.shares || "0"
                                              )) /
                                              parseInt(
                                                analyticsData.impressions
                                              )) *
                                            100
                                          ).toFixed(2)}
                                          %
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">
                                          Engagement Rate
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          {((parseInt(
                                            analyticsData.likes || "0"
                                          ) +
                                            parseInt(
                                              analyticsData.comments || "0"
                                            ) +
                                            parseInt(
                                              analyticsData.shares || "0"
                                            )) /
                                            parseInt(
                                              analyticsData.impressions
                                            )) *
                                            100 >=
                                          3
                                            ? "🔥 Great!"
                                            : ((parseInt(
                                                analyticsData.likes || "0"
                                              ) +
                                                parseInt(
                                                  analyticsData.comments || "0"
                                                ) +
                                                parseInt(
                                                  analyticsData.shares || "0"
                                                )) /
                                                parseInt(
                                                  analyticsData.impressions
                                                )) *
                                                100 >=
                                              1
                                            ? "👍 Good"
                                            : "📈 Can improve"}
                                        </div>
                                      </div>

                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600 mb-1">
                                          {(
                                            parseInt(
                                              analyticsData.likes || "0"
                                            ) +
                                            parseInt(
                                              analyticsData.comments || "0"
                                            ) +
                                            parseInt(
                                              analyticsData.shares || "0"
                                            )
                                          ).toLocaleString()}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">
                                          Total Engagement
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          All interactions combined
                                        </div>
                                      </div>

                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-600 mb-1">
                                          {parseInt(
                                            analyticsData.impressions
                                          ).toLocaleString()}
                                        </div>
                                        <div className="text-sm font-medium text-gray-700">
                                          Total Reach
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1">
                                          People who saw this post
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                                      <div className="flex items-start gap-3">
                                        <div className="text-2xl">💡</div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900 mb-1">
                                            AI Learning Insight
                                          </div>
                                          <div className="text-sm text-gray-700">
                                            This performance data helps our AI
                                            understand what content styles,
                                            topics, and formats work best for
                                            your audience.
                                            {((parseInt(
                                              analyticsData.likes || "0"
                                            ) +
                                              parseInt(
                                                analyticsData.comments || "0"
                                              ) +
                                              parseInt(
                                                analyticsData.shares || "0"
                                              )) /
                                              parseInt(
                                                analyticsData.impressions
                                              )) *
                                              100 >=
                                              3 && (
                                              <span className="text-green-600 font-medium">
                                                {" "}
                                                This post performed
                                                exceptionally well and will be
                                                used as a high-quality training
                                                example!
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {!analyticsData.impressions && (
                              <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                  Add Performance Data
                                </h4>
                                <p className="text-gray-600 mb-4">
                                  Enter impression data above to see engagement
                                  analysis and AI insights
                                </p>
                              </div>
                            )}
                          </div>

                          <DialogFooter className="pt-8 border-t border-gray-200 mt-8">
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowAnalyticsDialog(false);
                                  resetAnalyticsData();
                                }}
                                className="w-full sm:w-auto order-2 sm:order-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={addSamplePostWithAnalytics}
                                disabled={
                                  analyzingPost ||
                                  !analyticsData.postContent.trim()
                                }
                                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto order-1 sm:order-2"
                              >
                                {analyzingPost ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Adding & Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Sample Post with Analytics
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        onClick={handleAddPostsClick}
                        disabled={analyzingPost}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        {newSamplePost.trim()
                          ? analyzingPost
                            ? "Analyzing..."
                            : "Add Sample Post"
                          : "Add Sample Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* What Works Tab */}
          <TabsContent value="what-works" className="space-y-8">
            <WhatWorksInsights userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
