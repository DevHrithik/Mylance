import { createClient } from "@/lib/supabase/client";

interface SampleEdit {
  original_content: string;
  edited_content: string;
  edit_type: string;
  edit_significance: string;
  changes_made: any;
  learning_insights: any;
}

export class SampleDataSeeder {
  private supabase = createClient();

  async seedSampleEdits(userId: string) {
    const sampleEdits: SampleEdit[] = [
      {
        original_content:
          "I want to share some amazing insights about digital marketing strategies that will revolutionize your business approach.",
        edited_content:
          "Here's what I've learned about digital marketing strategies that actually move the needle for businesses.",
        edit_type: "tone_adjustment",
        edit_significance: "moderate",
        changes_made: {
          removed_words: ["amazing", "revolutionize"],
          added_words: ["actually", "needle"],
          tone_shift: "more_casual",
          length_change: -15,
          structure_changes: [],
        },
        learning_insights: {
          user_prefers: ["authentic", "practical", "conversational"],
          avoid_phrases: ["amazing insights", "revolutionize"],
          style_notes:
            "Prefers conversational tone over formal marketing speak",
        },
      },
      {
        original_content:
          "Artificial intelligence is transforming the way we work and interact with technology in unprecedented ways.",
        edited_content:
          "AI is changing how we work. It's not just about automation anymore - it's about amplifying human creativity.\n\nHere are 3 ways I've seen this play out:",
        edit_type: "structure_change",
        edit_significance: "major",
        changes_made: {
          removed_words: [
            "artificial",
            "intelligence",
            "transforming",
            "interact",
            "unprecedented",
          ],
          added_words: ["automation", "amplifying", "creativity"],
          length_change: 45,
          structure_changes: ["paragraph_structure", "bullet_points"],
        },
        learning_insights: {
          user_prefers: ["clear", "structured", "specific", "examples"],
          avoid_phrases: ["unprecedented ways", "transforming"],
          style_notes: "Prefers structured content with clear examples",
        },
      },
      {
        original_content:
          "Entrepreneurs should consider various factors when making important business decisions.",
        edited_content:
          "As entrepreneurs, we face tough calls daily. Here's my framework for making decisions that stick:",
        edit_type: "hook_improvement",
        edit_significance: "major",
        changes_made: {
          removed_words: [
            "should",
            "consider",
            "various",
            "factors",
            "important",
          ],
          added_words: [
            "face",
            "tough",
            "calls",
            "daily",
            "framework",
            "stick",
          ],
          length_change: 12,
          structure_changes: [],
        },
        learning_insights: {
          user_prefers: ["personal", "actionable", "frameworks"],
          avoid_phrases: ["should consider", "various factors"],
          style_notes:
            "Prefers personal, actionable content with clear frameworks",
        },
      },
      {
        original_content:
          "LinkedIn content creation requires consistent effort and strategic planning to achieve optimal results.",
        edited_content:
          "Creating content on LinkedIn doesn't have to be a grind. \n\nI used to stress about posting daily until I found this simple approach...",
        edit_type: "length_change",
        edit_significance: "moderate",
        changes_made: {
          removed_words: [
            "requires",
            "consistent",
            "effort",
            "strategic",
            "planning",
            "achieve",
            "optimal",
            "results",
          ],
          added_words: [
            "doesn't",
            "grind",
            "stress",
            "daily",
            "simple",
            "approach",
          ],
          length_change: 25,
          structure_changes: ["paragraph_structure"],
        },
        learning_insights: {
          user_prefers: ["storytelling", "relatable", "simple"],
          avoid_phrases: ["strategic planning", "optimal results"],
          style_notes:
            "Prefers storytelling approach with relatable experiences",
        },
      },
      {
        original_content:
          "To maximize your productivity, you should implement these proven methodologies that successful professionals utilize.",
        edited_content:
          "Want to get more done? Skip the complex systems.\n\nHere's what actually works (learned this the hard way):",
        edit_type: "word_choice",
        edit_significance: "major",
        changes_made: {
          removed_words: [
            "maximize",
            "productivity",
            "implement",
            "proven",
            "methodologies",
            "successful",
            "professionals",
            "utilize",
          ],
          added_words: [
            "more",
            "done",
            "skip",
            "complex",
            "systems",
            "actually",
            "works",
            "learned",
            "hard",
            "way",
          ],
          length_change: -35,
          structure_changes: [],
        },
        learning_insights: {
          user_prefers: ["simple", "direct", "authentic", "personal"],
          avoid_phrases: ["proven methodologies", "successful professionals"],
          style_notes: "Prefers simple, direct language over corporate jargon",
        },
      },
    ];

    try {
      // Insert sample edits
      const { error } = await this.supabase.from("content_edits").insert(
        sampleEdits.map((edit) => ({
          user_id: userId,
          post_id: null,
          generation_history_id: null,
          ...edit,
          processed_for_learning: true,
          learning_applied_at: new Date().toISOString(),
          created_at: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // Random date within last 30 days
        }))
      );

      if (error) throw error;

      console.log("Sample edits seeded successfully");
      return true;
    } catch (error) {
      console.error("Error seeding sample data:", error);
      return false;
    }
  }

  async seedSampleGenerationHistory(userId: string) {
    const sampleGenerations = [
      {
        prompt_input: "Write a post about digital marketing strategies",
        generated_content:
          "I want to share some amazing insights about digital marketing strategies that will revolutionize your business approach.",
        content_type: "post",
        ai_model: "gpt-4",
        tokens_used: 150,
        generation_time_ms: 2500,
        quality_rating: 4,
        user_feedback: "Good content but too formal",
      },
      {
        prompt_input: "Create content about AI in the workplace",
        generated_content:
          "Artificial intelligence is transforming the way we work and interact with technology in unprecedented ways.",
        content_type: "post",
        ai_model: "gpt-4",
        tokens_used: 200,
        generation_time_ms: 3000,
        quality_rating: 3,
        user_feedback: "Needs more structure and examples",
      },
    ];

    try {
      const { error } = await this.supabase.from("generation_history").insert(
        sampleGenerations.map((gen) => ({
          user_id: userId,
          ...gen,
          created_at: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }))
      );

      if (error) throw error;

      console.log("Sample generation history seeded successfully");
      return true;
    } catch (error) {
      console.error("Error seeding generation history:", error);
      return false;
    }
  }

  async clearSampleData(userId: string) {
    try {
      await Promise.all([
        this.supabase.from("content_edits").delete().eq("user_id", userId),
        this.supabase.from("generation_history").delete().eq("user_id", userId),
      ]);

      console.log("Sample data cleared successfully");
      return true;
    } catch (error) {
      console.error("Error clearing sample data:", error);
      return false;
    }
  }
}

export const sampleDataSeeder = new SampleDataSeeder();
