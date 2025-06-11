"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Lightbulb, X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

interface ContentStrategyEditorProps {
  userId: string;
  onSave?: () => void;
}

export default function ContentStrategyEditor({
  userId,
  onSave,
}: ContentStrategyEditorProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [strategyData, setStrategyData] = useState({
    content_pillars: [] as string[],
    content_goals: [] as string[],
    primary_goal: "",
    target_audience: "",
    posting_frequency: "",
    preferred_content_types: [] as string[],
    voice_attributes: [] as string[],
  });

  const fetchUserPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences(data);
        setStrategyData({
          content_pillars: Array.isArray(data.content_pillars)
            ? (data.content_pillars as string[]).filter(
                (item): item is string => typeof item === "string"
              )
            : [],
          content_goals: Array.isArray(data.content_goals)
            ? (data.content_goals as string[]).filter(
                (item): item is string => typeof item === "string"
              )
            : [],
          primary_goal: (data.primary_goal as string) || "",
          target_audience: JSON.stringify(data.target_audience || {}, null, 2),
          posting_frequency: "", // This field doesn't exist in user_preferences
          preferred_content_types: Array.isArray(data.preferred_content_types)
            ? (data.preferred_content_types as string[])
            : [],
          voice_attributes: Array.isArray(data.voice_attributes)
            ? (data.voice_attributes as string[]).filter(
                (item): item is string => typeof item === "string"
              )
            : [],
        });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      toast.error(
        `Failed to load user preferences: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      let targetAudience = {};
      try {
        targetAudience = JSON.parse(strategyData.target_audience || "{}");
      } catch {
        toast.error("Invalid JSON format in target audience");
        return;
      }

      const updateData = {
        content_pillars: strategyData.content_pillars.filter((p) => p.trim()),
        content_goals: strategyData.content_goals.filter((g) => g.trim()),
        primary_goal: strategyData.primary_goal,
        target_audience: targetAudience,
        posting_frequency: strategyData.posting_frequency,
        preferred_content_types: strategyData.preferred_content_types,
        voice_attributes: strategyData.voice_attributes.filter((v) => v.trim()),
        updated_at: new Date().toISOString(),
      };

      if (preferences) {
        const { error } = await supabase
          .from("user_preferences")
          .update(updateData as any)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_preferences").insert({
          user_id: userId,
          ...(updateData as any),
        } as any);

        if (error) throw error;
      }

      toast.success("Content strategy updated successfully");
      onSave?.();
      await fetchUserPreferences();
    } catch (error) {
      console.error("Error updating content strategy:", error);
      toast.error("Failed to update content strategy");
    } finally {
      setIsSaving(false);
    }
  };

  const addContentPillar = () => {
    setStrategyData((prev) => ({
      ...prev,
      content_pillars: [...prev.content_pillars, ""],
    }));
  };

  const updateContentPillar = (index: number, value: string) => {
    setStrategyData((prev) => ({
      ...prev,
      content_pillars: prev.content_pillars.map((pillar, i) =>
        i === index ? value : pillar
      ),
    }));
  };

  const removeContentPillar = (index: number) => {
    setStrategyData((prev) => ({
      ...prev,
      content_pillars: prev.content_pillars.filter((_, i) => i !== index),
    }));
  };

  const addContentGoal = () => {
    setStrategyData((prev) => ({
      ...prev,
      content_goals: [...prev.content_goals, ""],
    }));
  };

  const updateContentGoal = (index: number, value: string) => {
    setStrategyData((prev) => ({
      ...prev,
      content_goals: prev.content_goals.map((goal, i) =>
        i === index ? value : goal
      ),
    }));
  };

  const removeContentGoal = (index: number) => {
    setStrategyData((prev) => ({
      ...prev,
      content_goals: prev.content_goals.filter((_, i) => i !== index),
    }));
  };

  const addVoiceAttribute = () => {
    setStrategyData((prev) => ({
      ...prev,
      voice_attributes: [...prev.voice_attributes, ""],
    }));
  };

  const updateVoiceAttribute = (index: number, value: string) => {
    setStrategyData((prev) => ({
      ...prev,
      voice_attributes: prev.voice_attributes.map((attr, i) =>
        i === index ? value : attr
      ),
    }));
  };

  const removeVoiceAttribute = (index: number) => {
    setStrategyData((prev) => ({
      ...prev,
      voice_attributes: prev.voice_attributes.filter((_, i) => i !== index),
    }));
  };

  const toggleContentType = (type: string) => {
    setStrategyData((prev) => ({
      ...prev,
      preferred_content_types: prev.preferred_content_types.includes(type)
        ? prev.preferred_content_types.filter((t) => t !== type)
        : [...prev.preferred_content_types, type],
    }));
  };

  const contentTypes = ["post", "article", "carousel", "video_script", "poll"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Content Strategy & Pillars
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Pillars */}
        <div>
          <Label>Content Pillars</Label>
          <p className="text-xs text-gray-500 mb-3">
            Define 3-5 core themes that will guide your content creation
          </p>
          <div className="space-y-2">
            {strategyData.content_pillars.map((pillar, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={pillar}
                  onChange={(e) => updateContentPillar(index, e.target.value)}
                  placeholder={`Content Pillar ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContentPillar(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addContentPillar}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Content Pillar
            </Button>
          </div>
        </div>

        {/* Primary Goal */}
        <div>
          <Label htmlFor="primary_goal">Primary Content Goal</Label>
          <Input
            id="primary_goal"
            value={strategyData.primary_goal}
            onChange={(e) =>
              setStrategyData((prev) => ({
                ...prev,
                primary_goal: e.target.value,
              }))
            }
            placeholder="e.g., Generate leads, Build thought leadership, Increase brand awareness"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            What is the main objective you want to achieve with your content?
          </p>
        </div>

        {/* Content Goals */}
        <div>
          <Label>Specific Content Goals</Label>
          <p className="text-xs text-gray-500 mb-3">
            List specific, measurable goals for your content strategy
          </p>
          <div className="space-y-2">
            {strategyData.content_goals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) => updateContentGoal(index, e.target.value)}
                  placeholder={`Goal ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContentGoal(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addContentGoal}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Content Goal
            </Button>
          </div>
        </div>

        {/* Preferred Content Types */}
        <div>
          <Label>Preferred Content Types</Label>
          <p className="text-xs text-gray-500 mb-3">
            Select the types of content you want to focus on
          </p>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <Badge
                key={type}
                variant={
                  strategyData.preferred_content_types.includes(type)
                    ? "default"
                    : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleContentType(type)}
              >
                {type.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Posting Frequency */}
        <div>
          <Label htmlFor="posting_frequency">Posting Frequency</Label>
          <Input
            id="posting_frequency"
            value={strategyData.posting_frequency}
            onChange={(e) =>
              setStrategyData((prev) => ({
                ...prev,
                posting_frequency: e.target.value,
              }))
            }
            placeholder="e.g., 3 times per week, Daily, Twice weekly"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often do you plan to post content?
          </p>
        </div>

        {/* Voice Attributes */}
        <div>
          <Label>Voice & Tone Attributes</Label>
          <p className="text-xs text-gray-500 mb-3">
            Define the personality and tone of your content voice
          </p>
          <div className="space-y-2">
            {strategyData.voice_attributes.map((attr, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={attr}
                  onChange={(e) => updateVoiceAttribute(index, e.target.value)}
                  placeholder={`Voice attribute ${
                    index + 1
                  } (e.g., Professional, Conversational, Authoritative)`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeVoiceAttribute(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVoiceAttribute}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Voice Attribute
            </Button>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <Label htmlFor="target_audience">Target Audience (JSON)</Label>
          <Textarea
            id="target_audience"
            value={strategyData.target_audience}
            onChange={(e) =>
              setStrategyData((prev) => ({
                ...prev,
                target_audience: e.target.value,
              }))
            }
            placeholder='{"demographics": "...", "interests": "...", "pain_points": "..."}'
            rows={6}
            className="mt-1 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Define your target audience in JSON format with demographics,
            interests, and characteristics.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Content Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
