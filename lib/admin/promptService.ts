import { createClient } from "@/lib/supabase/server";
import { promptService } from "@/lib/openai/promptGenerator";
import {
  UserProfile,
  ContentPillar,
  GeneratedPrompt,
  DatabasePrompt,
} from "@/lib/openai/types";

export class AdminPromptDatabaseService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        first_name,
        ideal_target_client,
        client_pain_points,
        unique_value_proposition,
        proof_points,
        energizing_topics,
        decision_makers,
        content_strategy
      `
      )
      .eq("id", userId)
      .eq("is_admin", false)
      .single();

    if (error || !profile) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return profile;
  }

  async getContentPillars(userId: string): Promise<ContentPillar[]> {
    const supabase = await createClient();

    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("content_pillars")
      .eq("user_id", userId)
      .single();

    if (error || !preferences?.content_pillars) {
      // Return default pillars if none found
      return [
        { number: 1, description: "Industry Expertise & Thought Leadership" },
        { number: 2, description: "Business Growth & Strategy" },
        { number: 3, description: "Professional Development & Leadership" },
      ];
    }

    // Parse content pillars from JSONB
    const pillars = preferences.content_pillars;
    if (Array.isArray(pillars)) {
      return pillars.map((pillar, index) => ({
        number: (index + 1) as 1 | 2 | 3,
        description:
          typeof pillar === "string"
            ? pillar
            : pillar.description || `Pillar ${index + 1}`,
      }));
    }

    return [
      { number: 1, description: "Industry Expertise & Thought Leadership" },
      { number: 2, description: "Business Growth & Strategy" },
      { number: 3, description: "Professional Development & Leadership" },
    ];
  }

  async savePromptsToDatabase(
    prompts: GeneratedPrompt[],
    userId: string,
    adminId: string
  ): Promise<DatabasePrompt[]> {
    const supabase = await createClient();

    const promptsToInsert = prompts.map((prompt) => ({
      user_id: userId,
      category: prompt.category,
      pillar_number: prompt.pillar.number,
      pillar_description: prompt.pillar.description,
      prompt_text: prompt.prompt,
      hook: prompt.hook,
      is_generated_by_admin: true,
      is_used: false,
      created_by_admin: adminId,
    }));

    const { data, error } = await supabase
      .from("content_prompts")
      .insert(promptsToInsert)
      .select();

    if (error) {
      console.error("Error saving prompts to database:", error);
      throw new Error("Failed to save prompts to database");
    }

    return data || [];
  }

  async getUserPrompts(userId: string): Promise<DatabasePrompt[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("content_prompts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user prompts:", error);
      return [];
    }

    return data || [];
  }

  async getPreviousPrompts(userId: string): Promise<string[]> {
    const prompts = await this.getUserPrompts(userId);
    return prompts.map(
      (prompt) =>
        `Prompt ${prompt.id}\nCategory: ${prompt.category}\nPillar: Pillar ${prompt.pillar_number} - ${prompt.pillar_description}\nPrompt: ${prompt.prompt_text}\nHook: ${prompt.hook}`
    );
  }

  async generateAndSavePrompts(
    userId: string,
    adminId: string,
    promptCount: 30 | 15 = 30,
    feedback?: string
  ): Promise<{
    prompts: DatabasePrompt[];
    stats: {
      totalGenerated: number;
      totalTokens: number;
      generationTime: number;
    };
  }> {
    // Get user profile
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get content pillars
    const contentPillars = await this.getContentPillars(userId);

    let generatedResponse;

    if (promptCount === 15) {
      // Generate additional prompts with previous context
      const previousPrompts = await this.getPreviousPrompts(userId);
      generatedResponse = await promptService.generateAdditionalPrompts(
        userProfile,
        contentPillars,
        previousPrompts,
        feedback
      );
    } else {
      // Generate initial 30 prompts
      generatedResponse = await promptService.generatePromptsForUser(
        userProfile,
        contentPillars
      );
    }

    // Save prompts to database
    const savedPrompts = await this.savePromptsToDatabase(
      generatedResponse.prompts,
      userId,
      adminId
    );

    // Log admin activity
    await this.logAdminActivity(adminId, "generate_prompts", userId, {
      promptCount: generatedResponse.prompts.length,
      totalTokens: generatedResponse.totalTokens,
      generationTime: generatedResponse.generationTime,
    });

    return {
      prompts: savedPrompts,
      stats: {
        totalGenerated: generatedResponse.prompts.length,
        totalTokens: generatedResponse.totalTokens,
        generationTime: generatedResponse.generationTime,
      },
    };
  }

  async deletePrompt(promptId: number, adminId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("content_prompts")
      .delete()
      .eq("id", promptId);

    if (error) {
      console.error("Error deleting prompt:", error);
      return false;
    }

    // Log admin activity
    await this.logAdminActivity(adminId, "delete_prompt", null, {
      promptId,
    });

    return true;
  }

  async updatePrompt(
    promptId: number,
    updates: Partial<
      Pick<
        DatabasePrompt,
        "prompt_text" | "hook" | "category" | "pillar_description"
      >
    >,
    adminId: string
  ): Promise<DatabasePrompt | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("content_prompts")
      .update(updates)
      .eq("id", promptId)
      .select()
      .single();

    if (error) {
      console.error("Error updating prompt:", error);
      return null;
    }

    // Log admin activity
    await this.logAdminActivity(adminId, "update_prompt", null, {
      promptId,
      updates,
    });

    return data;
  }

  private async logAdminActivity(
    adminId: string,
    action: string,
    targetUserId: string | null,
    details: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from("admin_activity_log").insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      target_type: "prompt",
      details,
    });
  }

  async getBulkGenerationStats(): Promise<{
    totalUsers: number;
    usersWithPrompts: number;
    totalPrompts: number;
    avgPromptsPerUser: number;
  }> {
    const supabase = await createClient();

    // Get total non-admin users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_admin", false);

    // Get users with prompts
    const { data: usersWithPrompts } = await supabase
      .from("content_prompts")
      .select("user_id")
      .not("user_id", "is", null);

    const uniqueUsersWithPrompts = new Set(
      usersWithPrompts?.map((p) => p.user_id) || []
    ).size;

    // Get total prompts
    const { count: totalPrompts } = await supabase
      .from("content_prompts")
      .select("*", { count: "exact", head: true });

    const avgPromptsPerUser =
      uniqueUsersWithPrompts > 0
        ? (totalPrompts || 0) / uniqueUsersWithPrompts
        : 0;

    return {
      totalUsers: totalUsers || 0,
      usersWithPrompts: uniqueUsersWithPrompts,
      totalPrompts: totalPrompts || 0,
      avgPromptsPerUser: Math.round(avgPromptsPerUser * 100) / 100,
    };
  }
}

export const adminPromptService = new AdminPromptDatabaseService();
