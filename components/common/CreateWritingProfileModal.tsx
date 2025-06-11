"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateWritingProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateWritingProfileModal({
  open,
  onClose,
  onSuccess,
}: CreateWritingProfileModalProps) {
  const [creating, setCreating] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleCreateProfile = async () => {
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create dummy writing profile with default values matching the database schema
      const defaultPreferences = {
        user_id: user.id,
        // JSONB fields need to be proper JSON
        frequently_used_words: [],
        industry_jargon: [],
        signature_expressions: [],
        structural_patterns: [],
        tone_markers: {},
        formatting_preferences: {},
        post_type_preferences: {},
        editing_patterns: {},
        never_use_phrases: [],
        preferred_hooks: [],
        cta_preferences: {},
        personalization_data: {},
        onboarding_data: {},
        content_pillars: {},
        target_audience: {},
        // Text fields
        emoji_usage_preference: "minimal",
        average_sentence_length: "medium",
        content_length_preference: "medium",
        storytelling_style: "balanced",
        humor_usage: "minimal",
        question_usage: "moderate",
        writing_style_tone: "professional",
        primary_goal: "brand_awareness",
        default_dashboard_view: "dashboard",
        // Integer fields
        directness_level: 5,
        confidence_level: 5,
        energy_level: 5,
        writing_style_formality: 5,
        // Array fields
        content_goals: ["brand_awareness", "lead_generation"],
        voice_attributes: ["professional", "authentic"],
        preferred_content_types: ["post", "article"],
        // Boolean fields
        email_notifications: true,
        content_reminders: true,
        weekly_insights: true,
        marketing_emails: false,
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_preferences")
        .insert(defaultPreferences);

      if (error) {
        console.error("Error creating preferences:", error);
        toast.error("Failed to create writing profile");
        return;
      }

      toast.success("Writing profile created!");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create writing profile");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Create Writing Profile</DialogTitle>
        <Card className="w-full shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Create Your Writing Profile
              </h2>
              <p className="text-slate-600">
                Help our AI understand your unique voice and writing style
              </p>
            </div>

            <Button
              onClick={handleCreateProfile}
              disabled={creating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {creating ? "Creating..." : "Get Started"}
            </Button>

            <p className="text-sm text-slate-500 mt-4">
              You can customize it anytime after creation
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
