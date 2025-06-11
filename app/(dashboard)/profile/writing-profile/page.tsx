"use client";

import { useState, useEffect } from "react";
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
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUserPreferences } from "@/hooks/useUserPreferences";
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

export default function WritingProfilePage() {
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences | null>(null);
  const [newSamplePost, setNewSamplePost] = useState("");
  const [analyzingPost, setAnalyzingPost] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  // Use the hook with shouldShowModal=true only for this page
  const {
    preferences,
    loading,
    showCreateModal,
    closeModal,
    handleCreateSuccess,
    refetch,
  } = useUserPreferences({
    shouldShowModal: pathname === "/profile/writing-profile",
  });

  // Update local state when preferences change
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
      refetch();
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
        word_count: newSamplePost.trim().split(/\s+/).length,
        character_count: newSamplePost.trim().length,
      };

      const currentPosts = localPreferences.sample_posts || [];
      updateField("sample_posts", [...currentPosts, postData]);
      setNewSamplePost("");

      toast.success("Sample post added - analyzing writing style...", {
        duration: 3000,
      });

      // Auto-analyze the writing style
      await analyzeWritingStyle([...currentPosts, postData]);
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

      // Update the preferences with analyzed data
      if (localPreferences) {
        setLocalPreferences((prev) =>
          prev
            ? {
                ...prev,
                frequently_used_words:
                  analysis.frequently_used_words || prev.frequently_used_words,
                signature_expressions:
                  analysis.signature_expressions || prev.signature_expressions,
                emoji_usage_preference:
                  analysis.emoji_usage || prev.emoji_usage_preference,
                average_sentence_length:
                  analysis.sentence_length || prev.average_sentence_length,
                directness_level:
                  analysis.directness_level || prev.directness_level,
                confidence_level:
                  analysis.confidence_level || prev.confidence_level,
                energy_level: analysis.energy_level || prev.energy_level,
                writing_style_tone: analysis.tone || prev.writing_style_tone,
                humor_usage: analysis.humor_usage || prev.humor_usage,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="shadow-lg border-0 bg-white/80 backdrop-blur"
              >
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-purple-200 rounded w-1/2"></div>
                    <div className="h-32 bg-purple-200 rounded"></div>
                    <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-7 lg:w-3/4 bg-white/70 backdrop-blur border shadow-lg">
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
              value="formatting"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Palette className="h-4 w-4 mr-2" />
              Format
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Content
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
                            Short posts (1-2 paragraphs)
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium posts (3-5 paragraphs)
                          </SelectItem>
                          <SelectItem value="long">
                            Long posts (6+ paragraphs)
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

                  <div className="space-y-4">
                    <Label className="text-slate-700 font-medium">
                      Preferred Structural Patterns
                    </Label>
                    {editMode && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add structure type (e.g., bullet points, numbered lists)..."
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
                      {currentPreferences.structural_patterns?.map(
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
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
                          placeholder="Add hook example..."
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
                    <div className="space-y-2">
                      {currentPreferences.preferred_hooks?.map(
                        (hook: string, index: number) => (
                          <div
                            key={index}
                            className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                            onClick={() =>
                              editMode &&
                              removeFromArray("preferred_hooks", hook)
                            }
                          >
                            <p className="text-emerald-800 text-sm">
                              &quot;{hook}&quot; {editMode && "×"}
                            </p>
                          </div>
                        )
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
                          <SelectItem value="direct">
                            Direct & to the point
                          </SelectItem>
                          <SelectItem value="narrative">
                            Narrative storytelling
                          </SelectItem>
                          <SelectItem value="anecdotal">
                            Anecdotal examples
                          </SelectItem>
                          <SelectItem value="balanced">
                            Balanced approach
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.storytelling_style || "Balanced"}
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
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">
                        Directness Level:{" "}
                        {currentPreferences.directness_level || 5}
                      </Label>
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
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (currentPreferences.directness_level || 5) * 10
                              }%`,
                            }}
                          ></div>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtle</span>
                        <span>Direct</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">
                        Confidence Level:{" "}
                        {currentPreferences.confidence_level || 5}
                      </Label>
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
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (currentPreferences.confidence_level || 5) * 10
                              }%`,
                            }}
                          ></div>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Humble</span>
                        <span>Confident</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-slate-700 font-medium">
                        Energy Level: {currentPreferences.energy_level || 5}
                      </Label>
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
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (currentPreferences.energy_level || 5) * 10
                              }%`,
                            }}
                          ></div>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
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
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.writing_style_tone ||
                          "Professional"}
                      </p>
                    )}
                  </div>

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
                          <SelectItem value="minimal">Minimal humor</SelectItem>
                          <SelectItem value="moderate">
                            Moderate humor
                          </SelectItem>
                          <SelectItem value="frequent">
                            Frequent humor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.humor_usage || "Minimal"}
                      </p>
                    )}
                  </div>

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
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {currentPreferences.question_usage || "Moderate"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">
                      Formality Level:{" "}
                      {currentPreferences.writing_style_formality || 5}
                    </Label>
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
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (currentPreferences.writing_style_formality ||
                                5) * 10
                            }%`,
                          }}
                        ></div>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Casual</span>
                      <span>Formal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Formatting Tab */}
          <TabsContent value="formatting" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Formatting Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-600 text-center py-8">
                  Formatting preferences will be implemented in the next update
                  based on your usage patterns.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Content Type Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-600 text-center py-8">
                  Content type analytics and preferences will be populated as
                  you create more content.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Sample Posts Training
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-700 font-medium">
                        Add Your LinkedIn Posts for AI Training
                      </Label>
                      <p className="text-sm text-slate-600 mt-1">
                        Paste your existing LinkedIn posts to help the AI learn
                        your writing style, tone, and preferences. The more
                        samples you provide, the better the AI can match your
                        unique voice.
                      </p>
                    </div>
                    {!editMode && (
                      <Button
                        onClick={() => setEditMode(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Add Posts
                      </Button>
                    )}
                  </div>

                  {editMode && (
                    <div className="space-y-3">
                      <Textarea
                        value={newSamplePost}
                        onChange={(e) => setNewSamplePost(e.target.value)}
                        placeholder="Paste a LinkedIn post that represents your writing style..."
                        rows={6}
                        className="shadow-sm border-slate-200"
                      />
                      <Button
                        onClick={addSamplePost}
                        disabled={!newSamplePost.trim() || analyzingPost}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        {analyzingPost ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Add Sample Post
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Auto-analyze existing posts button */}
                  {currentPreferences?.sample_posts &&
                    currentPreferences.sample_posts.length > 0 &&
                    !currentPreferences.personalization_data
                      ?.learning_summary && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-800 mb-1">
                              Analyze Your Writing Style
                            </h4>
                            <p className="text-sm text-blue-700">
                              Let me analyze your{" "}
                              {currentPreferences.sample_posts.length} posts to
                              learn your writing patterns
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              analyzeWritingStyle(
                                currentPreferences.sample_posts || []
                              )
                            }
                            disabled={analyzingPost}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            {analyzingPost ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentPreferences?.sample_posts?.map(
                      (post: any, index: number) => (
                        <div
                          key={index}
                          className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group"
                        >
                          {editMode && (
                            <Button
                              onClick={() => removeSamplePost(index)}
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              ×
                            </Button>
                          )}
                          <p className="text-sm text-slate-800 leading-relaxed mb-3 pr-6">
                            {post.content.length > 300
                              ? `${post.content.substring(0, 300)}...`
                              : post.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>{post.word_count} words</span>
                            <span>{post.character_count} characters</span>
                            <span>
                              Added{" "}
                              {new Date(post.added_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )
                    )}

                    {(!currentPreferences?.sample_posts ||
                      currentPreferences.sample_posts.length === 0) && (
                      <div className="text-center py-12 text-slate-500">
                        <Brain className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                        <p className="font-medium mb-2 text-lg">
                          No sample posts yet
                        </p>
                        <p className="text-sm mb-4">
                          Add your LinkedIn posts to improve AI personalization
                        </p>
                        <p className="text-xs mb-6 text-slate-400">
                          💡 Tip: Add 3-5 posts that represent your best writing
                          style
                        </p>
                        <Button
                          onClick={() => setEditMode(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Add Your First Post
                        </Button>
                      </div>
                    )}
                  </div>

                  {currentPreferences?.sample_posts &&
                    currentPreferences.sample_posts.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            Training Dataset Statistics
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-purple-700">
                          <div className="text-center">
                            <div className="font-medium text-lg text-purple-800">
                              {currentPreferences.sample_posts.length}
                            </div>
                            <div className="text-purple-600 text-xs">
                              Sample Posts
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg text-purple-800">
                              {currentPreferences.sample_posts.reduce(
                                (acc: number, post: any) =>
                                  acc + (post.word_count || 0),
                                0
                              )}
                            </div>
                            <div className="text-purple-600 text-xs">
                              Total Words
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-lg text-purple-800">
                              {Math.round(
                                currentPreferences.sample_posts.reduce(
                                  (acc: number, post: any) =>
                                    acc + (post.word_count || 0),
                                  0
                                ) / currentPreferences.sample_posts.length
                              )}
                            </div>
                            <div className="text-purple-600 text-xs">
                              Avg Length
                            </div>
                          </div>
                        </div>
                        {currentPreferences.sample_posts.length >= 3 && (
                          <div className="mt-3 text-center">
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              ✓ Good training dataset size
                            </Badge>
                          </div>
                        )}
                        {currentPreferences.sample_posts.length < 3 && (
                          <div className="mt-3 text-center">
                            <Badge
                              variant="outline"
                              className="border-orange-200 text-orange-700"
                            >
                              Add {3 - currentPreferences.sample_posts.length}{" "}
                              more for better results
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-8">
            {/* Learning Summary Card */}
            {currentPreferences?.personalization_data?.learning_summary && (
              <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    What I have Learned About Your Writing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="bg-white p-6 rounded-lg border border-purple-200 shadow-sm">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      {currentPreferences.personalization_data.learning_summary}
                    </p>
                    {currentPreferences.personalization_data.last_analysis && (
                      <p className="text-xs text-slate-500">
                        Last updated:{" "}
                        {new Date(
                          currentPreferences.personalization_data.last_analysis
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {currentPreferences.personalization_data.analysis_insights &&
                    currentPreferences.personalization_data.analysis_insights
                      .length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="font-medium text-purple-800">
                          Key Insights:
                        </h4>
                        <div className="grid gap-3">
                          {currentPreferences.personalization_data.analysis_insights.map(
                            (insight: string, index: number) => (
                              <div
                                key={index}
                                className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm"
                              >
                                <p className="text-sm text-slate-700">
                                  {insight}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {currentPreferences?.sample_posts &&
                currentPreferences.sample_posts.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <h4 className="font-medium text-emerald-800 mb-2">
                        Style Analysis in Progress
                      </h4>
                      <p className="text-sm text-emerald-700">
                        The AI is analyzing your{" "}
                        {currentPreferences.sample_posts.length} sample posts to
                        identify patterns in your writing style, tone
                        preferences, and content structure. Advanced insights
                        will appear here as the system processes your training
                        data.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-3">
                          Content Analysis
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Posts analyzed:
                            </span>
                            <span className="font-medium">
                              {currentPreferences.sample_posts.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Average length:
                            </span>
                            <span className="font-medium">
                              {Math.round(
                                currentPreferences.sample_posts.reduce(
                                  (acc: number, post: any) =>
                                    acc + (post.word_count || 0),
                                  0
                                ) / currentPreferences.sample_posts.length
                              )}{" "}
                              words
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">
                              Total training data:
                            </span>
                            <span className="font-medium">
                              {currentPreferences.sample_posts
                                .reduce(
                                  (acc: number, post: any) =>
                                    acc + (post.character_count || 0),
                                  0
                                )
                                .toLocaleString()}{" "}
                              chars
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <h4 className="font-medium text-slate-800 mb-3">
                          Training Status
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-slate-600">
                              Data collected
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-slate-600">
                              Analysis pending
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                            <span className="text-slate-600">
                              Insights generation
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 font-medium mb-2">
                      No training data available
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Add sample posts in the Training tab to see AI learning
                      insights and performance analytics.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Switch to training tab
                        const trainingTab = document.querySelector(
                          '[value="training"]'
                        ) as HTMLButtonElement;
                        trainingTab?.click();
                      }}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
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
