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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { revalidatePreferences } from "@/lib/supabase/server-queries";
import { CreateWritingProfileModal } from "@/components/common/CreateWritingProfileModal";
import { Textarea } from "@/components/ui/textarea";

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

      console.log(
        "After saving and fetching, sample_posts:",
        localPreferences?.sample_posts
      );

      toast.success("Sample post added - analyzing writing style...", {
        duration: 3000,
      });

      // Now analyze the writing style
      await analyzeWritingStyle(updatedPosts);

      // Save the analysis results
      await handleSave();
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

      // Update the preferences with analyzed data (preserve sample_posts)
      if (localPreferences) {
        setLocalPreferences((prev) =>
          prev
            ? {
                ...prev,
                // CRITICAL: Never modify sample_posts here - they're already saved to DB
                // sample_posts: prev.sample_posts || [], // Don't touch this field
                // Update fields if they don't exist or analysis provides better data
                frequently_used_words:
                  analysis.frequently_used_words &&
                  analysis.frequently_used_words.length > 0
                    ? analysis.frequently_used_words
                    : prev.frequently_used_words || [],
                signature_expressions:
                  analysis.signature_expressions &&
                  analysis.signature_expressions.length > 0
                    ? analysis.signature_expressions
                    : prev.signature_expressions || [],
                emoji_usage_preference:
                  analysis.emoji_usage ||
                  prev.emoji_usage_preference ||
                  "minimal",
                average_sentence_length:
                  analysis.sentence_length ||
                  prev.average_sentence_length ||
                  "medium",
                directness_level:
                  analysis.directness_level || prev.directness_level || 5,
                confidence_level:
                  analysis.confidence_level || prev.confidence_level || 5,
                energy_level: analysis.energy_level || prev.energy_level || 5,
                writing_style_tone:
                  analysis.tone || prev.writing_style_tone || "professional",
                humor_usage:
                  analysis.humor_usage || prev.humor_usage || "minimal",
                personalization_data: {
                  ...prev.personalization_data,
                  last_analysis: new Date().toISOString(),
                  analysis_insights: analysis.insights || [],
                  learning_summary: analysis.learning_summary || "",
                },
              }
            : null
        );

        toast.success("Writing style analyzed and profile updated!", {
          duration: 4000,
        });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
              <Brain className="h-10 w-10 text-purple-600" />
              Personalization Profile
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Your personalized assistant learns your unique voice and style
            </p>
          </div>
          <div className="flex gap-3">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="lexical" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-3/4 bg-white/70 backdrop-blur border shadow-lg">
            <TabsTrigger
              value="lexical"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Type className="h-4 w-4 mr-2" />
              Lexical
            </TabsTrigger>
            <TabsTrigger
              value="structure"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Structure
            </TabsTrigger>
            <TabsTrigger
              value="tone"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Tone
            </TabsTrigger>

            <TabsTrigger
              value="training"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Lexical Choices Tab */}
          <TabsContent value="lexical" className="space-y-8">
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
          <TabsContent value="structure" className="space-y-8">
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
              {/* Voice Characteristics Card */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Voice Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Directness Level */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-700 font-medium text-lg">
                        Directness Level:{" "}
                        {currentPreferences.directness_level || 5}
                      </Label>
                    </div>
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
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-orange-500 h-3 rounded-full transition-all duration-300"
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
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtle</span>
                      <span>Direct</span>
                    </div>
                  </div>

                  {/* Confidence Level */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-700 font-medium text-lg">
                        Confidence Level:{" "}
                        {currentPreferences.confidence_level || 5}
                      </Label>
                    </div>
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
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
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
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Humble</span>
                      <span>Confident</span>
                    </div>
                  </div>

                  {/* Energy Level */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-700 font-medium text-lg">
                        Energy Level: {currentPreferences.energy_level || 5}
                      </Label>
                    </div>
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
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              ((currentPreferences.energy_level || 5) / 10) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Calm</span>
                      <span>Energetic</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Style Preferences Card */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Style Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Writing Tone */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium text-lg">
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
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">
                            Authoritative
                          </SelectItem>
                          <SelectItem value="conversational">
                            Conversational
                          </SelectItem>
                          <SelectItem value="inspirational">
                            Inspirational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-2xl font-semibold text-slate-800 capitalize">
                        {currentPreferences.writing_style_tone ||
                          "Professional"}
                      </div>
                    )}
                  </div>

                  {/* Humor Usage */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium text-lg">
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
                          <SelectItem value="subtle">Subtle humor</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="occasional">
                            Occasional humor
                          </SelectItem>
                          <SelectItem value="frequent">
                            Frequent humor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-2xl font-semibold text-slate-800 capitalize">
                        {currentPreferences.humor_usage || "minimal"}
                      </div>
                    )}
                  </div>

                  {/* Question Usage */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium text-lg">
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
                      <div className="text-2xl font-semibold text-slate-800 capitalize">
                        {currentPreferences.question_usage || "moderate"}
                      </div>
                    )}
                  </div>

                  {/* Formality Level */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-slate-700 font-medium text-lg">
                        Formality Level:{" "}
                        {currentPreferences.writing_style_formality || 5}
                      </Label>
                    </div>
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
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-purple-500 h-3 rounded-full transition-all duration-300"
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
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Casual</span>
                      <span>Formal</span>
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
                      Sample Posts Training
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Add LinkedIn posts to help AI learn your style
                    </p>
                  </div>
                  <Button
                    onClick={handleAddPostsClick}
                    disabled={analyzingPost}
                    className="bg-purple-600 hover:bg-purple-700 ml-4"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {newSamplePost.trim()
                      ? analyzingPost
                        ? "Analyzing..."
                        : "Add Post"
                      : "Add Posts"}
                  </Button>
                </div>

                <div className="mb-8">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Paste a sample post to analyze your writing style..."
                    value={newSamplePost}
                    onChange={(e) => setNewSamplePost(e.target.value)}
                    className="min-h-[120px] shadow-sm border-slate-200"
                  />
                </div>

                {(localPreferences?.sample_posts?.length || 0) > 0 ? (
                  <div className="space-y-4">
                    {(localPreferences?.sample_posts || []).map(
                      (post: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-purple-800">
                              Sample #{index + 1}
                            </span>
                            {editMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSamplePost(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-slate-700 text-sm line-clamp-3">
                            {post.content}
                          </p>
                          {post.analyzed_at && (
                            <div className="text-xs text-purple-600 mt-2">
                              Analyzed:{" "}
                              {new Date(post.analyzed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No sample posts yet
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Add posts to improve AI personalization
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {currentPreferences?.sample_posts?.length &&
                currentPreferences?.sample_posts?.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-slate-700 font-medium text-lg">
                          Profile Completeness
                        </Label>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Profile Progress</span>
                            <span>
                              {Math.round(
                                (((currentPreferences?.sample_posts?.length ||
                                  0) +
                                  (currentPreferences?.frequently_used_words
                                    ?.length || 0) +
                                  (currentPreferences?.voice_attributes
                                    ?.length || 0)) /
                                  3) *
                                  20
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round(
                                  (((currentPreferences?.sample_posts?.length ||
                                    0) +
                                    (currentPreferences?.frequently_used_words
                                      ?.length || 0) +
                                    (currentPreferences?.voice_attributes
                                      ?.length || 0)) /
                                    3) *
                                    20
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-slate-700 font-medium text-lg">
                          Training Data Quality
                        </Label>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Sample Posts
                            </span>
                            <Badge
                              variant={
                                currentPreferences?.sample_posts?.length >= 3
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {currentPreferences?.sample_posts?.length || 0}/5
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Vocabulary Items
                            </span>
                            <Badge
                              variant={
                                currentPreferences?.frequently_used_words
                                  ?.length >= 10
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {currentPreferences?.frequently_used_words
                                ?.length || 0}
                              /20
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">
                              Voice Attributes
                            </span>
                            <Badge
                              variant={
                                currentPreferences?.voice_attributes?.length >=
                                5
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {currentPreferences?.voice_attributes?.length ||
                                0}
                              /10
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-slate-700 font-medium text-lg">
                          Recent Updates
                        </Label>
                        <div className="text-slate-600 text-sm space-y-2">
                          <div>
                            Last updated:{" "}
                            {currentPreferences?.updated_at
                              ? new Date(
                                  currentPreferences.updated_at
                                ).toLocaleDateString()
                              : "Never"}
                          </div>
                          <div>
                            Created:{" "}
                            {currentPreferences?.created_at
                              ? new Date(
                                  currentPreferences.created_at
                                ).toLocaleDateString()
                              : "Unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-slate-700 font-medium text-lg">
                          Recommendations
                        </Label>
                        <div className="space-y-2 text-sm">
                          {currentPreferences?.sample_posts?.length < 3 && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                              • Add more sample posts for better style learning
                            </div>
                          )}
                          {currentPreferences?.frequently_used_words?.length <
                            10 && (
                            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg">
                              • Add more frequently used words and phrases
                            </div>
                          )}
                          {currentPreferences?.voice_attributes?.length < 5 && (
                            <div className="p-3 bg-purple-50 text-purple-800 rounded-lg">
                              • Define more voice attributes for personality
                            </div>
                          )}
                          {currentPreferences?.sample_posts?.length >= 3 &&
                            currentPreferences?.frequently_used_words?.length >=
                              10 &&
                            currentPreferences?.voice_attributes?.length >=
                              5 && (
                              <div className="p-3 bg-green-50 text-green-800 rounded-lg">
                                ✓ Your profile is well-configured for AI
                                training!
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No training data available
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Add sample posts in the Training tab to see AI learning
                      insights and performance analytics.
                    </p>
                    <Button
                      onClick={() => {
                        // Switch to training tab
                        const trainingTab = document.querySelector(
                          '[data-state="inactive"][value="training"]'
                        ) as HTMLElement;
                        if (trainingTab) trainingTab.click();
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Go to Training
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
