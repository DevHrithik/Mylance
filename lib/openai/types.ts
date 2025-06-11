export interface UserProfile {
  id: string;
  ideal_target_client?: string | null;
  client_pain_points?: string | null;
  unique_value_proposition?: string | null;
  proof_points?: string | null;
  energizing_topics?: string | null;
  decision_makers?: string | null;
  content_strategy?: string | null;
  first_name?: string | null;
  email: string;
}

export interface ContentPillar {
  number: 1 | 2 | 3;
  description: string;
}

export interface GeneratedPrompt {
  number: number;
  category:
    | "First-person anecdote"
    | "Listicle with a hook"
    | "Educational how-to post"
    | "Thought leadership/opinion piece"
    | "Case study/success story"
    | "Engagement-driven question";
  pillar: {
    number: 1 | 2 | 3;
    description: string;
  };
  prompt: string;
  hook: string;
}

export interface PromptGenerationRequest {
  userProfile: UserProfile;
  contentPillars: ContentPillar[];
  promptCount: 30 | 15;
  isAdditional?: boolean;
  previousPrompts?: string[];
  feedback?: string;
}

export interface PromptGenerationResponse {
  prompts: GeneratedPrompt[];
  totalTokens: number;
  generationTime: number;
}

export interface DatabasePrompt {
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
