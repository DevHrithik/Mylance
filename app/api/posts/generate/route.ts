import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GeneratePostRequest {
  promptId?: string;
  editPostId?: string;
  title: string;
  hook: string;
  category: string;
  tone?: string;
  theme?: string;
  length: string;
  scheduledDate?: string;
  customContent?: string;
}

interface UserPreferences {
  frequently_used_words: string[];
  industry_jargon: string[];
  signature_expressions: string[];
  emoji_usage_preference: string;
  average_sentence_length: string;
  content_length_preference: string;
  structural_patterns: string[];
  tone_markers: any;
  never_use_phrases: string[];
  preferred_hooks: string[];
  storytelling_style: string;
  humor_usage: string;
  question_usage: string;
  directness_level: number;
  confidence_level: number;
  energy_level: number;
  writing_style_tone: string;
  writing_style_formality: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body: GeneratePostRequest = await request.json();

    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's voice personalization preferences
    let userPreferences: UserPreferences | null = null;
    try {
      const { data: preferences, error: prefsError } = await supabase
        .from("user_preferences")
        .select(
          `
          frequently_used_words,
          industry_jargon,
          signature_expressions,
          emoji_usage_preference,
          average_sentence_length,
          content_length_preference,
          structural_patterns,
          tone_markers,
          never_use_phrases,
          preferred_hooks,
          storytelling_style,
          humor_usage,
          question_usage,
          directness_level,
          confidence_level,
          energy_level,
          writing_style_tone,
          writing_style_formality
        `
        )
        .eq("user_id", user.id)
        .single();

      if (!prefsError && preferences) {
        userPreferences = preferences;
      }
    } catch {
      console.log("User preferences not found, using defaults");
    }

    // Get prompt details if promptId is provided
    let promptData = null;
    if (body.promptId) {
      const { data: prompt, error: promptError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("id", parseInt(body.promptId))
        .eq("user_id", user.id)
        .single();

      if (promptError) {
        return NextResponse.json(
          { error: "Prompt not found or access denied" },
          { status: 404 }
        );
      }
      promptData = prompt;
    }

    // Build personalized voice instructions
    const buildVoiceInstructions = (prefs: UserPreferences): string => {
      if (!prefs) return "";

      const instructions = [];

      // Lexical choices
      if (prefs.frequently_used_words?.length > 0) {
        instructions.push(
          `- Naturally incorporate these preferred words/phrases where appropriate: ${prefs.frequently_used_words
            .slice(0, 10)
            .join(", ")}`
        );
      }

      if (prefs.industry_jargon?.length > 0) {
        instructions.push(
          `- Use these industry terms when relevant: ${prefs.industry_jargon
            .slice(0, 8)
            .join(", ")}`
        );
      }

      if (prefs.signature_expressions?.length > 0) {
        instructions.push(
          `- Try to include these signature expressions naturally: ${prefs.signature_expressions
            .slice(0, 3)
            .join(", ")}`
        );
      }

      if (prefs.never_use_phrases?.length > 0) {
        instructions.push(
          `- AVOID these words/phrases: ${prefs.never_use_phrases.join(", ")}`
        );
      }

      // Sentence structure and length
      if (prefs.average_sentence_length) {
        const lengthMap: Record<string, string> = {
          short: "Use short, punchy sentences (5-10 words mostly)",
          medium: "Use medium-length sentences (10-20 words typically)",
          long: "Use longer, more complex sentences (20+ words)",
          varied: "Vary sentence length for rhythm and flow",
        };
        instructions.push(
          `- Sentence style: ${
            lengthMap[prefs.average_sentence_length] || lengthMap.medium
          }`
        );
      }

      // Structural patterns
      if (prefs.structural_patterns?.length > 0) {
        instructions.push(
          `- Preferred formats: ${prefs.structural_patterns.join(", ")}`
        );
      }

      // Voice characteristics (1-10 scales)
      const directnessMap: Record<number, string> = {
        1: "extremely subtle and indirect",
        2: "very subtle",
        3: "somewhat indirect",
        4: "mildly indirect",
        5: "balanced directness",
        6: "somewhat direct",
        7: "quite direct",
        8: "very direct",
        9: "extremely direct",
        10: "bluntly direct",
      };

      const confidenceMap: Record<number, string> = {
        1: "very humble and self-deprecating",
        2: "quite humble",
        3: "somewhat modest",
        4: "mildly confident",
        5: "balanced confidence",
        6: "somewhat confident",
        7: "quite confident",
        8: "very confident",
        9: "highly confident",
        10: "supremely confident",
      };

      const energyMap: Record<number, string> = {
        1: "very calm and measured",
        2: "quite calm",
        3: "somewhat relaxed",
        4: "mildly energetic",
        5: "balanced energy",
        6: "somewhat energetic",
        7: "quite energetic",
        8: "very energetic",
        9: "highly energetic",
        10: "extremely energetic and enthusiastic",
      };

      if (prefs.directness_level) {
        instructions.push(
          `- Communication style: ${
            directnessMap[prefs.directness_level] || "balanced directness"
          }`
        );
      }

      if (prefs.confidence_level) {
        instructions.push(
          `- Confidence level: ${
            confidenceMap[prefs.confidence_level] || "balanced confidence"
          }`
        );
      }

      if (prefs.energy_level) {
        instructions.push(
          `- Energy/enthusiasm: ${
            energyMap[prefs.energy_level] || "balanced energy"
          }`
        );
      }

      // Tone and style preferences
      if (prefs.writing_style_tone) {
        instructions.push(`- Primary tone: ${prefs.writing_style_tone}`);
      }

      const formalityMap: Record<number, string> = {
        1: "very casual and conversational",
        2: "quite casual",
        3: "somewhat informal",
        4: "mildly formal",
        5: "balanced formality",
        6: "somewhat formal",
        7: "quite formal",
        8: "very formal",
        9: "highly formal",
        10: "extremely formal and ceremonial",
      };

      if (prefs.writing_style_formality) {
        instructions.push(
          `- Formality level: ${
            formalityMap[prefs.writing_style_formality] || "balanced formality"
          }`
        );
      }

      // Storytelling and engagement
      if (prefs.storytelling_style) {
        const storyMap: Record<string, string> = {
          direct: "Get straight to the point with minimal storytelling",
          narrative: "Use rich narrative storytelling with details and context",
          anecdotal: "Include personal anecdotes and examples",
          balanced: "Balance story elements with direct communication",
        };
        instructions.push(
          `- Storytelling approach: ${
            storyMap[prefs.storytelling_style] || storyMap.balanced
          }`
        );
      }

      if (prefs.humor_usage) {
        const humorMap: Record<string, string> = {
          none: "Avoid humor completely",
          minimal: "Use very light humor sparingly",
          moderate: "Include appropriate humor when it fits naturally",
          frequent: "Use humor regularly to engage readers",
        };
        instructions.push(
          `- Humor usage: ${humorMap[prefs.humor_usage] || humorMap.minimal}`
        );
      }

      if (prefs.question_usage) {
        const questionMap: Record<string, string> = {
          none: "Avoid rhetorical questions",
          minimal: "Use questions sparingly",
          moderate: "Include engaging questions appropriately",
          frequent: "Use questions regularly to drive engagement",
        };
        instructions.push(
          `- Question usage: ${
            questionMap[prefs.question_usage] || questionMap.moderate
          }`
        );
      }

      // Emoji preferences
      if (prefs.emoji_usage_preference) {
        const emojiMap: Record<string, string> = {
          none: "Never use emojis",
          minimal: "Use emojis very sparingly (1-2 max)",
          moderate: "Use emojis appropriately to enhance readability",
          frequent: "Use emojis liberally for engagement and visual appeal",
        };
        instructions.push(
          `- Emoji usage: ${
            emojiMap[prefs.emoji_usage_preference] || emojiMap.minimal
          }`
        );
      }

      // Preferred hooks
      if (prefs.preferred_hooks?.length > 0) {
        instructions.push(
          `- Hook style examples to emulate: "${prefs.preferred_hooks
            .slice(0, 2)
            .join('", "')}"`
        );
      }

      return instructions.length > 0
        ? `\n\n**PERSONALIZED VOICE INSTRUCTIONS:**\n${instructions.join(
            "\n"
          )}\n\nEnsure the content feels natural and authentic while incorporating these preferences.`
        : "";
    };

    // Create OpenAI prompt with personalization
    const systemPrompt = `You are a professional LinkedIn content writer. Create engaging, authentic LinkedIn posts that drive engagement and provide value to the audience.

Guidelines:
- Use a ${body.tone || "professional"} tone
- Target ${
      body.length
    } length (short: 100-200 words, medium: 200-400 words, long: 400+ words)
- Include emojis and formatting for readability
- Use line breaks effectively
- Don't include hashtags in the content (they'll be added separately)
- Make it authentic and personal when appropriate
- Include actionable insights or takeaways
- End with an engaging question to drive comments

Here are examples of different post types to follow:

**First-Person Anecdote Example:**
Last year, I faced one of my toughest challenges when launching a new product line. 

I remember sitting in a room with a diverse team of engineers, designers, and marketers, all with different opinions on the product's direction. I shared my own experiences from my early days in consulting and how I learned to navigate conflicting ideas to reach a consensus. 

The result? We not only launched on time, but we exceeded our initial sales targets by 20%. This experience reinforced that real leadership is about uniting a team around a shared vision—even when the road isn't clear. 

What challenges have you overcome by bringing your team together?

**Educational How-To Post Example:**
How to Optimize Your Product Launch in 3 Simple Steps:

1. **Define Clear Objectives:** Start with measurable goals—know what success looks like.
2. **Leverage Your Data:** Use customer feedback and performance metrics to iterate quickly.
3. **Communicate Transparently:** Share your journey, including both wins and lessons learned, to build trust with your audience.

Implementing these steps has helped me drive growth in every venture I've been part of. 

What's one step you can take today to improve your launch strategy?

**Thought Leadership Example:**
In today's fast-paced market, authenticity isn't a buzzword—it's a necessity. 

Too many leaders resort to generic advice that doesn't resonate. I believe the true power of thought leadership lies in sharing the raw, unfiltered truth of our journeys—the challenges, the failures, and the victories. 

When you speak from personal experience, you build a connection that data alone never can. 

Let's rethink what it means to be a leader: it's not just about being right; it's about being real. 

What does authentic leadership mean to you?

**Case Study Example:**
At [Company], we faced a critical challenge: our sales were stagnating. By reworking our campaign strategy and redesigning key features, we tripled our sales in just one month. Here's what we did:

• Revamped the payments page to streamline user experience
• Launched a targeted 'Refer and Earn' initiative that boosted engagement  
• Implemented design changes that enhanced usability and retention

These actions not only increased revenue but also built a foundation of trust with our customers. 

Have you implemented a change that made a measurable impact?

**Listicle Example:**
5 Lessons I Learned from Launching Multiple Startups:

1. **Embrace the Chaos:** When every day is unpredictable, clear priorities are your lifeline.
2. **Listen First, Act Second:** Understanding your team's insights can unlock breakthrough ideas.
3. **Measure Everything:** Data isn't just numbers; it's the story behind your success.
4. **Fail Fast, Learn Faster:** Mistakes are inevitable, but every failure is a stepping stone.
5. **Stay Authentic:** Your unique journey is your strongest asset—don't hide it.
    
Which lesson resonates with you the most?

**Engagement Question Example:**
What's the one piece of advice you wish you had when you first started leading product launches?

For me, it was learning to balance data-driven decisions with intuitive, real-world insights. That combination has been key to building sustainable growth. 

I'd love to hear your experiences—drop your thoughts below!

Use these formats as inspiration while adapting the structure and style to match the specific content request.${
      userPreferences ? buildVoiceInstructions(userPreferences) : ""
    }`;

    const userPrompt = `Create a LinkedIn post with the following details:

Title/Topic: ${body.title}
Opening Hook: ${body.hook}
Category: ${body.category}
Theme: ${body.theme || "general business"}
Tone: ${body.tone || "professional"}
Length: ${body.length}

${promptData ? `Original Prompt Context: ${promptData.prompt_text}` : ""}

IMPORTANT: Based on the category "${
      body.category
    }", use the appropriate example format above as inspiration:
- For "story" or "personal" categories: Use the First-Person Anecdote format
- For "educational" categories: Use the Educational How-To Post or Listicle format
- For "question" categories: Use the Engagement Question format
- For business/industry content: Use the Case Study or Thought Leadership format

The post should start with the provided hook and expand naturally from there. Make it engaging, valuable, authentic, and end with a compelling question to drive engagement. Use emojis and bullet points where appropriate for better readability.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens:
          body.length === "long" ? 1000 : body.length === "medium" ? 700 : 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    const openaiData = await response.json();
    const generatedContent = openaiData.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    // Generate relevant hashtags based on content and theme
    const hashtagsResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "Generate 5-8 relevant LinkedIn hashtags (without the # symbol) for the given content. Return only the hashtags separated by commas.",
            },
            {
              role: "user",
              content: `Generate hashtags for this LinkedIn post about ${
                body.theme || "general business"
              } in the ${body.category} category:\n\n${generatedContent}`,
            },
          ],
          max_tokens: 100,
          temperature: 0.5,
        }),
      }
    );

    let hashtags: string[] = [];
    if (hashtagsResponse.ok) {
      const hashtagData = await hashtagsResponse.json();
      const hashtagString = hashtagData.choices[0]?.message?.content || "";
      hashtags = hashtagString
        .split(",")
        .map((tag: string) => tag.trim().replace(/^#/, ""))
        .filter((tag: string) => tag.length > 0)
        .slice(0, 8);
    }

    // Map category to content_type enum
    const mapToContentType = (): string => {
      // All generated content is "post" type for now
      // Could be expanded later for articles, carousels, etc.
      return "post";
    };

    // Map tone to valid database enum values
    const mapToTone = (tone: string): string => {
      const toneMapping: { [key: string]: string } = {
        professional: "professional",
        conversational: "conversational",
        inspirational: "inspirational",
        humorous: "casual",
        casual: "casual",
        educational: "educational",
        authoritative: "authoritative",
      };

      return toneMapping[tone.toLowerCase()] || "professional";
    };

    // Only save to database if editing an existing post
    let post = null;

    if (body.editPostId) {
      // Update existing post content only
      const { data: updatedPost, error: dbError } = await supabase
        .from("posts")
        .update({
          content: generatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(body.editPostId))
        .select()
        .single();

      if (dbError) {
        console.error("Database update error:", dbError);
        return NextResponse.json(
          { error: "Failed to update post", details: dbError.message },
          { status: 500 }
        );
      }
      post = updatedPost;
    }

    // We'll create generation history later with the improved content

    // Mark prompt as used if it was used (only for new content generation)
    if (body.promptId && promptData && !body.editPostId) {
      await supabase
        .from("content_prompts")
        .update({ is_used: true })
        .eq("id", parseInt(body.promptId));
    }

    // Add this helper function to apply learned improvements
    async function applyLearnedImprovements(
      content: string,
      userId: string,
      supabase: any
    ): Promise<string> {
      try {
        // Get recent edit patterns for this user
        const { data: recentEdits } = await supabase
          .from("edit_tracking")
          .select("learning_insights")
          .eq("user_id", userId)
          .not("learning_insights", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!recentEdits?.length) return content;

        let improvedContent = content;
        const patterns: { [key: string]: number } = {};

        // Analyze patterns from recent edits
        recentEdits.forEach((edit: any) => {
          if (edit.learning_insights?.learning_signals) {
            edit.learning_insights.learning_signals.forEach(
              (signal: string) => {
                patterns[signal] = (patterns[signal] || 0) + 1;
              }
            );
          }
        });

        // Apply improvements based on consistent patterns
        Object.entries(patterns).forEach(([signal, frequency]) => {
          if (frequency >= 2) {
            // Apply if seen 2+ times
            if (signal.includes("shorter") && signal.includes("content")) {
              // Make content more concise
              improvedContent = improvedContent
                .split("\n\n")
                .map((paragraph) => {
                  if (paragraph.length > 200) {
                    return paragraph.substring(0, 180) + "...";
                  }
                  return paragraph;
                })
                .join("\n\n");
            }

            if (signal.includes("removed") && signal.includes("emoji")) {
              // Remove emojis if user consistently removes them
              improvedContent = improvedContent.replace(
                /[\u{1F300}-\u{1F9FF}]/gu,
                ""
              );
            }

            if (signal.includes("professional") && signal.includes("tone")) {
              // Apply more professional tone
              improvedContent = improvedContent
                .replace(/!/g, ".")
                .replace(/awesome/gi, "excellent")
                .replace(/super/gi, "very")
                .replace(/love/gi, "appreciate");
            }

            if (signal.includes("added") && signal.includes("call-to-action")) {
              // Ensure there's a strong CTA if user consistently adds them
              if (
                !improvedContent.toLowerCase().includes("comment") &&
                !improvedContent.toLowerCase().includes("share") &&
                !improvedContent.toLowerCase().includes("connect")
              ) {
                improvedContent +=
                  "\n\n💭 What are your thoughts on this? Share your experience in the comments!";
              }
            }

            if (signal.includes("structure") && signal.includes("bullet")) {
              // Convert to bullet points if user prefers structure
              const sentences = improvedContent.split(". ");
              if (sentences.length > 3) {
                const intro = sentences.slice(0, 2).join(". ") + ".";
                const bullets = sentences
                  .slice(2)
                  .map((s) => `• ${s.trim()}`)
                  .join("\n");
                improvedContent = intro + "\n\n" + bullets;
              }
            }
          }
        });

        return improvedContent;
      } catch (error) {
        console.error("Error applying learned improvements:", error);
        return content; // Return original if something goes wrong
      }
    }

    // Apply learned improvements before returning content
    const improvedContent = await applyLearnedImprovements(
      generatedContent,
      user.id,
      supabase
    );

    // Store generation history
    const { data: historyData, error: historyInsertError } = await supabase
      .from("generation_history")
      .insert({
        user_id: user.id,
        content: improvedContent, // Store the improved content
        original_prompt: promptData ? promptData.prompt_text : null,
        ai_prompt_used: systemPrompt,
        content_type: mapToContentType(),
        topic: body.title,
        hook: body.hook,
        generation_parameters: {
          tone: body.tone || "professional",
          length: body.length,
          category: body.category,
          theme: body.theme || "general",
          title: body.title,
          hook: body.hook,
        },
        ai_model: "gpt-4",
        processing_time_ms: Date.now() - startTime,
      })
      .select("id")
      .single();

    if (historyInsertError) {
      console.error("Error saving generation history:", historyInsertError);
    }

    return NextResponse.json({
      success: true,
      post: post,
      content: improvedContent,
      hashtags: hashtags,
      generationHistoryId: historyData?.id,
      personalizationUsed: userPreferences ? true : false,
      improvements_applied: await getAppliedImprovementsCount(
        user.id,
        supabase
      ),
      message: "Content generated successfully with AI learning applied",
    });
  } catch (error) {
    console.error("Generate post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add helper function to get improvements count
async function getAppliedImprovementsCount(
  userId: string,
  supabase: any
): Promise<number> {
  try {
    const { data: edits } = await supabase
      .from("edit_tracking")
      .select("learning_insights")
      .eq("user_id", userId)
      .not("learning_insights", "is", null);

    if (!edits?.length) return 0;

    const patterns: { [key: string]: number } = {};
    edits.forEach((edit: any) => {
      if (edit.learning_insights?.learning_signals) {
        edit.learning_insights.learning_signals.forEach((signal: string) => {
          patterns[signal] = (patterns[signal] || 0) + 1;
        });
      }
    });

    return Object.values(patterns).filter((count) => count >= 2).length;
  } catch (error) {
    return 0;
  }
}
