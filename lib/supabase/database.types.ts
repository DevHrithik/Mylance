export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string | null;
          details: Json | null;
          id: number;
          target_id: string | null;
          target_type: string | null;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: number;
          target_id?: string | null;
          target_type?: string | null;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: number;
          target_id?: string | null;
          target_type?: string | null;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_activity_log_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_users: {
        Row: {
          created_at: string | null;
          id: string;
          permissions: string[] | null;
          role: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          permissions?: string[] | null;
          role?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          permissions?: string[] | null;
          role?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          confidence_score: number | null;
          created_at: string;
          id: number;
          insight_data: Json;
          insight_type: string;
          is_active: boolean | null;
          performance_impact: number | null;
          recommendations: string[] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          confidence_score?: number | null;
          created_at?: string;
          id?: never;
          insight_data?: Json;
          insight_type: string;
          is_active?: boolean | null;
          performance_impact?: number | null;
          recommendations?: string[] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confidence_score?: number | null;
          created_at?: string;
          id?: never;
          insight_data?: Json;
          insight_type?: string;
          is_active?: boolean | null;
          performance_impact?: number | null;
          recommendations?: string[] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      content_prompts: {
        Row: {
          category: string;
          created_at: string | null;
          created_by_admin: string | null;
          hook: string;
          id: number;
          is_generated_by_admin: boolean | null;
          is_used: boolean | null;
          pillar_description: string | null;
          pillar_number: number | null;
          prompt_text: string;
          pushed_to_calendar: boolean | null;
          scheduled_date: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by_admin?: string | null;
          hook: string;
          id?: number;
          is_generated_by_admin?: boolean | null;
          is_used?: boolean | null;
          pillar_description?: string | null;
          pillar_number?: number | null;
          prompt_text: string;
          pushed_to_calendar?: boolean | null;
          scheduled_date?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by_admin?: string | null;
          hook?: string;
          id?: number;
          is_generated_by_admin?: boolean | null;
          is_used?: boolean | null;
          pillar_description?: string | null;
          pillar_number?: number | null;
          prompt_text?: string;
          pushed_to_calendar?: boolean | null;
          scheduled_date?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_prompts_created_by_admin_fkey";
            columns: ["created_by_admin"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_prompts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      generation_history: {
        Row: {
          ai_model: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at: string;
          feedback_count: number | null;
          feedback_summary: Json | null;
          generated_content: string;
          generation_time_ms: number | null;
          id: number;
          prompt_input: string;
          quality_rating: number | null;
          tokens_used: number | null;
          user_feedback: string | null;
          user_id: string;
        };
        Insert: {
          ai_model: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          feedback_count?: number | null;
          feedback_summary?: Json | null;
          generated_content: string;
          generation_time_ms?: number | null;
          id?: never;
          prompt_input: string;
          quality_rating?: number | null;
          tokens_used?: number | null;
          user_feedback?: string | null;
          user_id: string;
        };
        Update: {
          ai_model?: string;
          content_type?: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          feedback_count?: number | null;
          feedback_summary?: Json | null;
          generated_content?: string;
          generation_time_ms?: number | null;
          id?: never;
          prompt_input?: string;
          quality_rating?: number | null;
          tokens_used?: number | null;
          user_feedback?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generation_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      post_feedback: {
        Row: {
          admin_notes: string | null;
          admin_response: string | null;
          admin_tags: string[] | null;
          context_info: Json | null;
          created_at: string | null;
          disliked_aspects: string[] | null;
          feedback_text: string | null;
          feedback_type: string | null;
          generation_history_id: number | null;
          id: number;
          improvement_suggestions: string | null;
          is_flagged: boolean | null;
          is_resolved: boolean | null;
          liked_aspects: string[] | null;
          post_id: number;
          rating: number | null;
          resolved_at: string | null;
          resolved_by: string | null;
          updated_at: string | null;
          user_id: string;
          would_recommend: boolean | null;
          would_use: boolean | null;
        };
        Insert: {
          admin_notes?: string | null;
          admin_response?: string | null;
          admin_tags?: string[] | null;
          context_info?: Json | null;
          created_at?: string | null;
          disliked_aspects?: string[] | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          generation_history_id?: number | null;
          id?: number;
          improvement_suggestions?: string | null;
          is_flagged?: boolean | null;
          is_resolved?: boolean | null;
          liked_aspects?: string[] | null;
          post_id: number;
          rating?: number | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
          user_id: string;
          would_recommend?: boolean | null;
          would_use?: boolean | null;
        };
        Update: {
          admin_notes?: string | null;
          admin_response?: string | null;
          admin_tags?: string[] | null;
          context_info?: Json | null;
          created_at?: string | null;
          disliked_aspects?: string[] | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          generation_history_id?: number | null;
          id?: number;
          improvement_suggestions?: string | null;
          is_flagged?: boolean | null;
          is_resolved?: boolean | null;
          liked_aspects?: string[] | null;
          post_id?: number;
          rating?: number | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
          user_id?: string;
          would_recommend?: boolean | null;
          would_use?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_feedback_generation_history_id_fkey";
            columns: ["generation_history_id"];
            isOneToOne: false;
            referencedRelation: "generation_history";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_feedback_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_feedback_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      post_performance: {
        Row: {
          clicks: number;
          comments: number;
          created_at: string;
          engagement_rate: number | null;
          id: number;
          impressions: number;
          likes: number;
          performance_notes: string | null;
          post_id: number;
          recorded_at: string;
          shares: number;
          updated_at: string;
        };
        Insert: {
          clicks?: number;
          comments?: number;
          created_at?: string;
          engagement_rate?: number | null;
          id?: never;
          impressions: number;
          likes?: number;
          performance_notes?: string | null;
          post_id: number;
          recorded_at?: string;
          shares?: number;
          updated_at?: string;
        };
        Update: {
          clicks?: number;
          comments?: number;
          created_at?: string;
          engagement_rate?: number | null;
          id?: never;
          impressions?: number;
          likes?: number;
          performance_notes?: string | null;
          post_id?: number;
          recorded_at?: string;
          shares?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_performance_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          ai_prompt_used: string | null;
          content: string;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at: string;
          generation_metadata: Json | null;
          hashtags: string[] | null;
          id: number;
          linkedin_url: string | null;
          posted_at: string | null;
          status: Database["public"]["Enums"]["content_status"];
          title: string | null;
          tone: Database["public"]["Enums"]["tone"];
          topics: string[] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_prompt_used?: string | null;
          content: string;
          content_type?: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          generation_metadata?: Json | null;
          hashtags?: string[] | null;
          id?: never;
          linkedin_url?: string | null;
          posted_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string | null;
          tone?: Database["public"]["Enums"]["tone"];
          topics?: string[] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_prompt_used?: string | null;
          content?: string;
          content_type?: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          generation_metadata?: Json | null;
          hashtags?: string[] | null;
          id?: never;
          linkedin_url?: string | null;
          posted_at?: string | null;
          status?: Database["public"]["Enums"]["content_status"];
          title?: string | null;
          tone?: Database["public"]["Enums"]["tone"];
          topics?: string[] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          business_size: string | null;
          business_stage: string | null;
          business_type: string | null;
          client_attraction_methods: string[] | null;
          client_pain_points: string | null;
          content_pillars: Json | null;
          content_strategy: string | null;
          created_at: string;
          current_posting_frequency: string | null;
          decision_makers: string | null;
          email: string;
          energizing_topics: string | null;
          first_name: string | null;
          full_name: string | null;
          heard_about_mylance: string | null;
          id: string;
          ideal_target_client: string | null;
          investment_willingness: string | null;
          is_admin: boolean | null;
          last_login_at: string | null;
          linkedin_importance: string | null;
          linkedin_url: string | null;
          onboarding_completed: boolean | null;
          posting_mindset: string | null;
          profile_locked: boolean | null;
          proof_points: string | null;
          timezone: string | null;
          unique_value_proposition: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          business_size?: string | null;
          business_stage?: string | null;
          business_type?: string | null;
          client_attraction_methods?: string[] | null;
          client_pain_points?: string | null;
          content_pillars?: Json | null;
          content_strategy?: string | null;
          created_at?: string;
          current_posting_frequency?: string | null;
          decision_makers?: string | null;
          email: string;
          energizing_topics?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          heard_about_mylance?: string | null;
          id: string;
          ideal_target_client?: string | null;
          investment_willingness?: string | null;
          is_admin?: boolean | null;
          last_login_at?: string | null;
          linkedin_importance?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean | null;
          posting_mindset?: string | null;
          profile_locked?: boolean | null;
          proof_points?: string | null;
          timezone?: string | null;
          unique_value_proposition?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          business_size?: string | null;
          business_stage?: string | null;
          business_type?: string | null;
          client_attraction_methods?: string[] | null;
          client_pain_points?: string | null;
          content_pillars?: Json | null;
          content_strategy?: string | null;
          created_at?: string;
          current_posting_frequency?: string | null;
          decision_makers?: string | null;
          email?: string;
          energizing_topics?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          heard_about_mylance?: string | null;
          id?: string;
          ideal_target_client?: string | null;
          investment_willingness?: string | null;
          is_admin?: boolean | null;
          last_login_at?: string | null;
          linkedin_importance?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean | null;
          posting_mindset?: string | null;
          profile_locked?: boolean | null;
          proof_points?: string | null;
          timezone?: string | null;
          unique_value_proposition?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: number;
          plan_type: Database["public"]["Enums"]["plan_type"];
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: never;
          plan_type?: Database["public"]["Enums"]["plan_type"];
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: never;
          plan_type?: Database["public"]["Enums"]["plan_type"];
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      usage_tracking: {
        Row: {
          created_at: string;
          feature_type: string;
          id: number;
          limit_amount: number;
          period_end: string;
          period_start: string;
          updated_at: string;
          usage_count: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feature_type: string;
          id?: never;
          limit_amount: number;
          period_end: string;
          period_start: string;
          updated_at?: string;
          usage_count?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feature_type?: string;
          id?: never;
          limit_amount?: number;
          period_end?: string;
          period_start?: string;
          updated_at?: string;
          usage_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_feedback: {
        Row: {
          admin_notes: string | null;
          admin_response: string | null;
          admin_tags: string[] | null;
          context_info: Json | null;
          created_at: string | null;
          disliked_aspects: string[] | null;
          feedback_text: string | null;
          feedback_type: string | null;
          id: number;
          improvement_suggestions: string | null;
          is_flagged: boolean | null;
          is_resolved: boolean | null;
          liked_aspects: string[] | null;
          post_id: number | null;
          prompt_id: number | null;
          rating: number | null;
          resolved_at: string | null;
          resolved_by: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          admin_response?: string | null;
          admin_tags?: string[] | null;
          context_info?: Json | null;
          created_at?: string | null;
          disliked_aspects?: string[] | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          id?: number;
          improvement_suggestions?: string | null;
          is_flagged?: boolean | null;
          is_resolved?: boolean | null;
          liked_aspects?: string[] | null;
          post_id?: number | null;
          prompt_id?: number | null;
          rating?: number | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          admin_response?: string | null;
          admin_tags?: string[] | null;
          context_info?: Json | null;
          created_at?: string | null;
          disliked_aspects?: string[] | null;
          feedback_text?: string | null;
          feedback_type?: string | null;
          id?: number;
          improvement_suggestions?: string | null;
          is_flagged?: boolean | null;
          is_resolved?: boolean | null;
          liked_aspects?: string[] | null;
          post_id?: number | null;
          prompt_id?: number | null;
          rating?: number | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_feedback_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_feedback_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "content_prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_feedback_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_preferences: {
        Row: {
          average_sentence_length: string | null;
          confidence_level: number | null;
          content_goals: string[] | null;
          content_length_preference: string | null;
          content_pillars: Json | null;
          content_reminders: boolean | null;
          created_at: string;
          cta_preferences: Json | null;
          default_dashboard_view: string | null;
          directness_level: number | null;
          editing_patterns: Json | null;
          email_notifications: boolean | null;
          emoji_usage_preference: string | null;
          energy_level: number | null;
          formatting_preferences: Json | null;
          frequently_used_words: Json | null;
          humor_usage: string | null;
          id: number;
          industry_jargon: Json | null;
          marketing_emails: boolean | null;
          never_use_phrases: Json | null;
          onboarding_data: Json | null;
          personalization_data: Json | null;
          post_type_preferences: Json | null;
          preferred_content_types:
            | Database["public"]["Enums"]["content_type"][]
            | null;
          preferred_hooks: Json | null;
          primary_goal: string | null;
          question_usage: string | null;
          signature_expressions: Json | null;
          storytelling_style: string | null;
          structural_patterns: Json | null;
          target_audience: Json | null;
          tone_markers: Json | null;
          updated_at: string;
          user_id: string;
          voice_attributes: string[] | null;
          weekly_insights: boolean | null;
          writing_style_formality: number | null;
          writing_style_tone: Database["public"]["Enums"]["tone"] | null;
        };
        Insert: {
          average_sentence_length?: string | null;
          confidence_level?: number | null;
          content_goals?: string[] | null;
          content_length_preference?: string | null;
          content_pillars?: Json | null;
          content_reminders?: boolean | null;
          created_at?: string;
          cta_preferences?: Json | null;
          default_dashboard_view?: string | null;
          directness_level?: number | null;
          editing_patterns?: Json | null;
          email_notifications?: boolean | null;
          emoji_usage_preference?: string | null;
          energy_level?: number | null;
          formatting_preferences?: Json | null;
          frequently_used_words?: Json | null;
          humor_usage?: string | null;
          id?: never;
          industry_jargon?: Json | null;
          marketing_emails?: boolean | null;
          never_use_phrases?: Json | null;
          onboarding_data?: Json | null;
          personalization_data?: Json | null;
          post_type_preferences?: Json | null;
          preferred_content_types?:
            | Database["public"]["Enums"]["content_type"][]
            | null;
          preferred_hooks?: Json | null;
          primary_goal?: string | null;
          question_usage?: string | null;
          signature_expressions?: Json | null;
          storytelling_style?: string | null;
          structural_patterns?: Json | null;
          target_audience?: Json | null;
          tone_markers?: Json | null;
          updated_at?: string;
          user_id: string;
          voice_attributes?: string[] | null;
          weekly_insights?: boolean | null;
          writing_style_formality?: number | null;
          writing_style_tone?: Database["public"]["Enums"]["tone"] | null;
        };
        Update: {
          average_sentence_length?: string | null;
          confidence_level?: number | null;
          content_goals?: string[] | null;
          content_length_preference?: string | null;
          content_pillars?: Json | null;
          content_reminders?: boolean | null;
          created_at?: string;
          cta_preferences?: Json | null;
          default_dashboard_view?: string | null;
          directness_level?: number | null;
          editing_patterns?: Json | null;
          email_notifications?: boolean | null;
          emoji_usage_preference?: string | null;
          energy_level?: number | null;
          formatting_preferences?: Json | null;
          frequently_used_words?: Json | null;
          humor_usage?: string | null;
          id?: never;
          industry_jargon?: Json | null;
          marketing_emails?: boolean | null;
          never_use_phrases?: Json | null;
          onboarding_data?: Json | null;
          personalization_data?: Json | null;
          post_type_preferences?: Json | null;
          preferred_content_types?:
            | Database["public"]["Enums"]["content_type"][]
            | null;
          preferred_hooks?: Json | null;
          primary_goal?: string | null;
          question_usage?: string | null;
          signature_expressions?: Json | null;
          storytelling_style?: string | null;
          structural_patterns?: Json | null;
          target_audience?: Json | null;
          tone_markers?: Json | null;
          updated_at?: string;
          user_id?: string;
          voice_attributes?: string[] | null;
          weekly_insights?: boolean | null;
          writing_style_formality?: number | null;
          writing_style_tone?: Database["public"]["Enums"]["tone"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_admin_status: {
        Args: { user_email: string };
        Returns: {
          email: string;
          is_admin: boolean;
          admin_role: string;
          permissions: string[];
        }[];
      };
      check_usage_limit: {
        Args: { user_uuid: string; feature: string };
        Returns: boolean;
      };
      get_admin_users_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          email: string;
          first_name: string;
          full_name: string;
          created_at: string;
          onboarding_completed: boolean;
          is_admin: boolean;
          last_login_at: string;
          plan_type: string;
          subscription_status: string;
          total_posts: number;
        }[];
      };
      get_user_analytics: {
        Args: { user_uuid: string };
        Returns: Json;
      };
      increment_usage: {
        Args: { user_uuid: string; feature: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      make_user_admin: {
        Args: { user_email: string };
        Returns: boolean;
      };
    };
    Enums: {
      content_status: "draft" | "used" | "archived";
      content_type: "post" | "article" | "carousel" | "video_script" | "poll";
      feedback_type: "prompt" | "post" | "general" | "bug";
      plan_type: "free" | "starter" | "professional" | "enterprise" | "monthly";
      subscription_status: "active" | "canceled" | "past_due" | "paused";
      tone:
        | "professional"
        | "casual"
        | "authoritative"
        | "conversational"
        | "inspirational"
        | "educational";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      content_status: ["draft", "used", "archived"],
      content_type: ["post", "article", "carousel", "video_script", "poll"],
      feedback_type: ["prompt", "post", "general", "bug"],
      plan_type: ["free", "starter", "professional", "enterprise", "monthly"],
      subscription_status: ["active", "canceled", "past_due", "paused"],
      tone: [
        "professional",
        "casual",
        "authoritative",
        "conversational",
        "inspirational",
        "educational",
      ],
    },
  },
} as const;
