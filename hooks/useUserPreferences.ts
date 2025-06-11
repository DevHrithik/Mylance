import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

interface UseUserPreferencesOptions {
  shouldShowModal?: boolean;
}

export function useUserPreferences(options: UseUserPreferencesOptions = {}) {
  const { shouldShowModal = false } = options;
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchPreferences = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching preferences:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setPreferences(data);
        setShowCreateModal(false);
      } else {
        // No preferences found, show modal only if requested
        setShowCreateModal(shouldShowModal);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, shouldShowModal]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleCreateSuccess = () => {
    fetchPreferences();
  };

  const closeModal = () => {
    setShowCreateModal(false);
  };

  return {
    preferences,
    loading,
    showCreateModal,
    closeModal,
    handleCreateSuccess,
    refetch: fetchPreferences,
  };
}
