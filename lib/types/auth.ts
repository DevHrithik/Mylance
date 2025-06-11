import { type Database } from "@/lib/supabase/database.types";

// Database types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UserPreferences =
  Database["public"]["Tables"]["user_preferences"]["Row"];
export type UserPreferencesInsert =
  Database["public"]["Tables"]["user_preferences"]["Insert"];
export type UserPreferencesUpdate =
  Database["public"]["Tables"]["user_preferences"]["Update"];

// Application types
export interface User {
  id: string;
  email: string;
  profile: Profile | null;
  preferences: UserPreferences | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  updatePreferences: (updates: UserPreferencesUpdate) => Promise<void>;
}

// Onboarding types
export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface OnboardingData {
  personalInfo: {
    fullName: string;
    role: string;
    company?: string;
    industry?: string;
    experienceLevel?: string;
  };
  businessProfile: {
    company: string;
    industry: string;
    companySize?: string;
    targetMarket?: string;
  };
  contentGoals: string[];
  targetAudience: {
    demographics: string[];
    painPoints: string[];
    interests: string[];
    jobTitles: string[];
  };
  contentPreferences: {
    frequency: number;
    contentTypes: Database["public"]["Enums"]["content_type"][];
  };
  writingStyle: {
    tone: Database["public"]["Enums"]["tone"];
    formality: number;
    personality: string[];
  };
  successMetrics: string[];
  contentPillars: string[];
}

// Session types
export interface Session {
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, any>;
    app_metadata: Record<string, any>;
  };
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  company?: string;
  industry?: string;
  experience_level?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
}

export interface SignupCredentials {
  email: string;
  full_name?: string;
}
