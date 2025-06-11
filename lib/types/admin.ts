import { Database } from "@/lib/supabase/database.types";

export interface AdminUser {
  id: string;
  user_id: string;
  role: "admin" | "super_admin";
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface ContentPrompt {
  id: number;
  user_id: string;
  category: string;
  pillar_number: number;
  pillar_description: string;
  prompt_text: string;
  hook: string;
  is_generated_by_admin: boolean;
  is_used: boolean;
  scheduled_date?: string;
  created_by_admin?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminActivityLog {
  id: number;
  admin_id: string;
  action: string;
  target_user_id?: string;
  target_type?: string;
  target_id?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface UserFeedback {
  id: number;
  user_id: string;
  feedback_type: "prompt" | "tone" | "general" | "bug";
  rating: number;
  feedback_text?: string;
  prompt_id?: number;
  is_resolved: boolean;
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStatsCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  icon: string;
  color: "primary" | "success" | "warning" | "error";
}

export interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  company?: string | null;
  company_size?: string | null;
  department?: string | null;
  job_title?: string | null;
  industry?: string | null;
  location?: string | null;
  timezone?: string | null;
  experience_level?: string | null;
  role?: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
  subscription?:
    | {
        plan_type: Database["public"]["Enums"]["plan_type"];
        status: Database["public"]["Enums"]["subscription_status"];
        current_period_end?: string | null;
      }
    | undefined;
  post_count?: number;
  last_login?: string | null;
}

export interface PromptGenerationRequest {
  user_id: string;
  count?: number;
  categories?: string[];
  force_regenerate?: boolean;
}

export interface PromptGenerationResponse {
  prompts: ContentPrompt[];
  success: boolean;
  message?: string;
  generation_time_ms: number;
}

export interface AdminPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canGeneratePrompts: boolean;
  canViewAnalytics: boolean;
  canManageFeedback: boolean;
  canImpersonateUsers: boolean;
  canAccessSystemSettings: boolean;
}

export type AdminAction =
  | "view_user"
  | "edit_user"
  | "delete_user"
  | "generate_prompts"
  | "edit_prompt"
  | "delete_prompt"
  | "view_analytics"
  | "respond_feedback"
  | "impersonate_user"
  | "export_data"
  | "system_config";

export interface AdminTableFilter {
  search?: string;
  status?: string;
  plan_type?: string;
  business_type?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface PaginationParams {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
