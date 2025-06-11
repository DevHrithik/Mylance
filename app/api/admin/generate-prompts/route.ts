import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
});

// Log API key status (without exposing the key)
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is not set");
} else {
  console.log(
    "✅ OPENAI_API_KEY is set, length:",
    process.env.OPENAI_API_KEY.length
  );
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is available
    console.log("🔍 Debug - API Key status:");
    console.log("- API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("- API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    console.log(
      "- API Key starts with:",
      process.env.OPENAI_API_KEY?.substring(0, 7) || "undefined"
    );

    const { userId, includeFeedback = false } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`Starting prompt generation for user: ${userId}`);

    const supabase = await createClient();

    // Fetch user details from profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        *,
        content_pillars
      `
      )
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("User profile error:", profileError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch feedback data if includeFeedback is true
    let feedbackContext = "";
    if (includeFeedback) {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("content_prompts")
        .select(
          "category, feedback_rating, feedback_text, improvement_suggestions"
        )
        .eq("user_id", userId)
        .not("feedback_rating", "is", null)
        .order("feedback_given_at", { ascending: false });

      if (!feedbackError && feedbackData && feedbackData.length > 0) {
        const avgRating =
          feedbackData.reduce(
            (sum, item) => sum + (item.feedback_rating || 0),
            0
          ) / feedbackData.length;

        const highRatedPrompts = feedbackData.filter(
          (item) => (item.feedback_rating || 0) >= 4
        );
        const lowRatedPrompts = feedbackData.filter(
          (item) => (item.feedback_rating || 0) <= 2
        );

        feedbackContext = `
PREVIOUS FEEDBACK ANALYSIS:
- Average rating: ${avgRating.toFixed(1)}/5 across ${
          feedbackData.length
        } prompts
- High-rated prompts (4-5 stars): ${highRatedPrompts.length}
- Low-rated prompts (1-2 stars): ${lowRatedPrompts.length}

SUCCESSFUL PATTERNS (from high-rated prompts):
${highRatedPrompts
  .slice(0, 3)
  .map(
    (item) =>
      `- Category: ${item.category}\n  Feedback: ${
        item.feedback_text || "Positive response"
      }`
  )
  .join("\n")}

AREAS FOR IMPROVEMENT (from low-rated prompts):
${lowRatedPrompts
  .slice(0, 3)
  .map(
    (item) =>
      `- Category: ${item.category}\n  Issues: ${
        item.feedback_text || "Lower engagement"
      }\n  Suggestions: ${
        item.improvement_suggestions || "No specific suggestions"
      }`
  )
  .join("\n")}

GENERATION INSTRUCTIONS BASED ON FEEDBACK:
- Focus more on successful categories and styles
- Avoid patterns that received low ratings
- Incorporate specific improvement suggestions
- Make prompts more specific and actionable
`;
      }
    }

    // Fetch admin details (assuming current user is admin)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Build a comprehensive system prompt
    const systemPrompt = `You are an expert LinkedIn content strategist specializing in fractional executives and consultants.

Your task is to generate exactly 12 high-quality LinkedIn content prompts that will help the user build authority, trust, and attract their ideal clients.

REQUIREMENTS:
1. Generate EXACTLY 12 prompts - no more, no less
2. Each prompt must be actionable and specific
3. Map each prompt to one of the user's content pillars
4. Use professional tone but keep it engaging
5. Focus on the user's expertise and target audience
${
  feedbackContext
    ? "\n6. INCORPORATE FEEDBACK: Use the feedback analysis to improve prompt quality"
    : ""
}

APPROVED CATEGORIES (use these exactly):
- First-person anecdote
- Listicle with a hook
- Educational how-to post
- Thought leadership/opinion piece
- Case study/success story
- Engagement-driven question

FORMAT: For each prompt, provide exactly this structure:
Prompt [number]
Category: [category from approved list]
Pillar: Pillar [1/2/3]
Hook: [compelling opening line]
Prompt: [detailed instruction on what to write about]

Separate each prompt with "---"

Example:
Prompt 1
Category: First-person anecdote
Pillar: Pillar 1
Hook: I made a costly mistake that taught me everything about leadership.
Prompt: Share a specific failure or challenge from your professional experience that led to a valuable lesson. Include what went wrong, what you learned, and how it changed your approach.

---

Continue this exact format for all 12 prompts.`;

    // Build user-specific prompt
    const userPrompt = `Generate 12 LinkedIn content prompts for this fractional executive:

PROFILE:
- Business: ${userProfile.business_type || "Consulting"}
- Target Client: ${userProfile.ideal_target_client || "Business executives"}
- Client Pain Points: ${
      userProfile.client_pain_points || "Operational challenges"
    }
- Value Proposition: ${
      userProfile.unique_value_proposition || "Expert guidance"
    }
- Content Strategy: ${
      userProfile.content_strategy ||
      "Educational and thought leadership content"
    }

CONTENT PILLARS:
${
  userProfile.content_pillars &&
  Array.isArray(userProfile.content_pillars) &&
  userProfile.content_pillars.length > 0
    ? (userProfile.content_pillars as string[])
        .filter((pillar) => pillar && typeof pillar === "string")
        .map(
          (pillar: string, index: number) => `Pillar ${index + 1}: ${pillar}`
        )
        .join("\n")
    : `Pillar 1: Expertise & Insights
Pillar 2: Client Success Stories
Pillar 3: Industry Trends & Leadership`
}

${feedbackContext}

Generate 12 diverse prompts that cover different categories and pillars. Make them specific to this user's expertise and target audience.${
      feedbackContext
        ? " Use the feedback analysis to create higher-quality prompts that avoid previous issues and build on successful patterns."
        : ""
    }`;

    console.log("Calling OpenAI API...");

    // Make the API call
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      console.error("Error details:", {
        status: error.status,
        code: error.code,
        type: error.type,
        message: error.message,
        requestID: error.requestID,
        headers: error.headers
          ? Object.fromEntries(error.headers.entries())
          : null,
      });

      // Handle specific OpenAI errors
      if (error.status === 429) {
        let errorMessage = "OpenAI API limit exceeded.";

        if (error.code === "rate_limit_exceeded") {
          errorMessage =
            "🚫 Rate limit exceeded. Too many requests per minute. Please wait and try again.";
        } else if (error.code === "insufficient_quota") {
          errorMessage =
            "💳 Insufficient quota. Please check your billing and usage limits at platform.openai.com";
        } else if (error.type === "insufficient_quota") {
          errorMessage =
            "💳 Insufficient quota. Please check your billing and usage limits at platform.openai.com";
        } else {
          errorMessage = `🚫 OpenAI API limit exceeded (${
            error.code || error.type || "unknown"
          }). Please check your usage at platform.openai.com`;
        }

        return NextResponse.json(
          {
            error: errorMessage,
            code: "quota_exceeded",
            details: {
              openai_code: error.code,
              openai_type: error.type,
              status: error.status,
            },
          },
          { status: 429 }
        );
      }

      if (error.status === 401) {
        return NextResponse.json(
          {
            error:
              "OpenAI API authentication failed. Please check your API key.",
            code: "auth_failed",
          },
          { status: 500 }
        );
      }

      // Generic OpenAI error
      return NextResponse.json(
        {
          error: "Failed to generate content. Please try again later.",
          code: "ai_service_error",
        },
        { status: 500 }
      );
    }

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      console.error("No content generated from OpenAI");
      return NextResponse.json(
        { error: "Failed to generate content from AI" },
        { status: 500 }
      );
    }

    console.log("Content generated, parsing prompts...");

    // Parse the generated content
    const promptBlocks = generatedContent
      .split("---")
      .map((block: string) => block.trim())
      .filter((block: string) => block.length > 0);

    console.log(`Found ${promptBlocks.length} prompt blocks`);

    const parsedPrompts = [];

    for (const block of promptBlocks) {
      if (!block) continue;

      const lines = block.split("\n").filter((line: string) => line.trim());

      let category = "";
      let pillarNumber = 1;
      let promptText = "";
      let hook = "";

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.toLowerCase().includes("category:")) {
          category = trimmedLine.split(":")[1]?.trim() || "";
        } else if (trimmedLine.toLowerCase().includes("pillar:")) {
          const pillarText = trimmedLine.split(":")[1]?.trim() || "";
          const pillarMatch = pillarText.match(/(\d)/);
          if (pillarMatch && pillarMatch[1]) {
            pillarNumber = parseInt(pillarMatch[1]);
          }
        } else if (trimmedLine.toLowerCase().includes("prompt:")) {
          promptText = trimmedLine.split(":")[1]?.trim() || "";
        } else if (trimmedLine.toLowerCase().includes("hook:")) {
          hook = trimmedLine.split(":")[1]?.trim() || "";
        }
      }

      // Only add if we have essential data
      if (promptText || hook) {
        const validPillarNumber = Math.max(1, Math.min(3, pillarNumber)); // Ensure 1-3
        const actualPillarDescription =
          userProfile.content_pillars &&
          Array.isArray(userProfile.content_pillars) &&
          userProfile.content_pillars[validPillarNumber - 1]
            ? userProfile.content_pillars[validPillarNumber - 1]
            : `Pillar ${validPillarNumber}`;

        parsedPrompts.push({
          category: category || "Educational how-to post",
          pillar_number: validPillarNumber,
          pillar_description: actualPillarDescription,
          prompt_text:
            promptText || hook || "Write about your professional experience",
          hook: hook || "Here's something important...",
        });
      }
    }

    console.log(`Parsed ${parsedPrompts.length} valid prompts`);

    // If we don't have enough prompts, generate fallback prompts
    if (parsedPrompts.length < 12) {
      console.log("Generating fallback prompts to reach minimum of 12...");

      // Get actual pillar descriptions
      const getPillarDescription = (pillarNumber: number) => {
        if (
          userProfile.content_pillars &&
          Array.isArray(userProfile.content_pillars) &&
          userProfile.content_pillars[pillarNumber - 1]
        ) {
          return userProfile.content_pillars[pillarNumber - 1];
        }
        return `Pillar ${pillarNumber}`;
      };

      const fallbackPrompts = [
        {
          category: "First-person anecdote",
          pillar_number: 1,
          pillar_description: getPillarDescription(1),
          prompt_text:
            "Share a challenging project where your expertise made the difference. What was the situation, what did you do, and what was the outcome?",
          hook: "Here's how I helped a client avoid a costly mistake...",
        },
        {
          category: "Educational how-to post",
          pillar_number: 2,
          pillar_description: getPillarDescription(2),
          prompt_text:
            "Create a step-by-step guide for solving a common problem your clients face. Make it actionable and practical.",
          hook: "Most executives struggle with this - here's the solution...",
        },
        {
          category: "Thought leadership/opinion piece",
          pillar_number: 3,
          pillar_description: getPillarDescription(3),
          prompt_text:
            "Share your perspective on a current industry trend or challenge. What do you see differently than others?",
          hook: "Everyone's talking about this trend, but they're missing the point...",
        },
        {
          category: "Case study/success story",
          pillar_number: 1,
          pillar_description: getPillarDescription(1),
          prompt_text:
            "Detail a client success story (anonymized) that demonstrates your value. Focus on the transformation you enabled.",
          hook: "My client doubled their revenue in 6 months. Here's how...",
        },
        {
          category: "Listicle with a hook",
          pillar_number: 2,
          pillar_description: getPillarDescription(2),
          prompt_text:
            "Create a list of 5-7 mistakes you see executives making in your area of expertise. Provide solutions for each.",
          hook: "These 5 mistakes are costing executives millions...",
        },
        {
          category: "Engagement-driven question",
          pillar_number: 3,
          pillar_description: getPillarDescription(3),
          prompt_text:
            "Ask a thought-provoking question about a challenge in your industry. Encourage discussion and share your insights in the comments.",
          hook: "Quick question for fellow executives...",
        },
        {
          category: "First-person anecdote",
          pillar_number: 1,
          pillar_description: getPillarDescription(1),
          prompt_text:
            "Share a time when you had to pivot your approach. What did you learn and how does it help your clients now?",
          hook: "Sometimes the best lessons come from failures...",
        },
        {
          category: "Educational how-to post",
          pillar_number: 2,
          pillar_description: getPillarDescription(2),
          prompt_text:
            "Break down a complex process in your field into simple, actionable steps that anyone can follow.",
          hook: "Everyone thinks this is complicated, but it's actually simple...",
        },
        {
          category: "Thought leadership/opinion piece",
          pillar_number: 3,
          pillar_description: getPillarDescription(3),
          prompt_text:
            "Challenge a common misconception in your industry. Why is the conventional wisdom wrong?",
          hook: "Stop me if you've heard this advice before...",
        },
        {
          category: "Case study/success story",
          pillar_number: 1,
          pillar_description: getPillarDescription(1),
          prompt_text:
            "Tell the story of your biggest professional transformation. What changed and what impact did it have?",
          hook: "Three years ago, I was completely wrong about this...",
        },
        {
          category: "Listicle with a hook",
          pillar_number: 2,
          pillar_description: getPillarDescription(2),
          prompt_text:
            "List the top 3-5 tools, strategies, or frameworks that have transformed your work. Explain why each matters.",
          hook: "These simple tools changed everything for me...",
        },
        {
          category: "Engagement-driven question",
          pillar_number: 3,
          pillar_description: getPillarDescription(3),
          prompt_text:
            "Ask about a controversial topic in your industry. Present multiple viewpoints and ask for opinions.",
          hook: "This topic always sparks debate...",
        },
      ];

      // Add fallback prompts until we have at least 12
      while (parsedPrompts.length < 12 && fallbackPrompts.length > 0) {
        parsedPrompts.push(fallbackPrompts.shift()!);
      }
    }

    // Take only the first 12 prompts
    const finalPrompts = parsedPrompts.slice(0, 12);

    console.log(`Final prompt count: ${finalPrompts.length}`);

    if (finalPrompts.length < 12) {
      return NextResponse.json(
        {
          error: `Failed to generate enough prompts (got ${finalPrompts.length}, need 12)`,
        },
        { status: 500 }
      );
    }

    // Calculate schedule dates using timezone-safe M/W/F scheduling
    const getNextScheduleDates = (count: number) => {
      const dates = [];
      const promptsPerDay = 2;

      // Generate M/W/F dates, with 2 prompts per day
      const totalDaysNeeded = Math.ceil(count / promptsPerDay);

      // Use UTC to avoid timezone issues
      const today = new Date();
      const currentDate = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
      );

      // Define target days (1 = Monday, 3 = Wednesday, 5 = Friday)
      const targetDays = [1, 3, 5];

      // Start from today or next valid day
      while (!targetDays.includes(currentDate.getUTCDay())) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      // Generate M/W/F dates
      const mwfDates: string[] = [];
      for (let dayIndex = 0; dayIndex < totalDaysNeeded; dayIndex++) {
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getUTCDate()).padStart(2, "0");
        mwfDates.push(`${year}-${month}-${day}`);

        // Move to next M/W/F
        const currentDay = currentDate.getUTCDay();
        if (currentDay === 1) {
          // Monday -> Wednesday (add 2 days)
          currentDate.setUTCDate(currentDate.getUTCDate() + 2);
        } else if (currentDay === 3) {
          // Wednesday -> Friday (add 2 days)
          currentDate.setUTCDate(currentDate.getUTCDate() + 2);
        } else if (currentDay === 5) {
          // Friday -> Monday (add 3 days)
          currentDate.setUTCDate(currentDate.getUTCDate() + 3);
        }
      }

      // Assign dates to prompts (2 prompts per day)
      for (let i = 0; i < count; i++) {
        const dayIndex = Math.floor(i / promptsPerDay);
        dates.push(mwfDates[dayIndex]);
      }

      console.log("📅 Generated schedule dates (M/W/F only):", dates);
      console.log("📅 Unique dates:", [...new Set(dates)]);
      return dates;
    };

    const scheduleDates = getNextScheduleDates(finalPrompts.length);

    // Prepare prompts for database insertion
    const promptsForDb = finalPrompts.map((prompt, index) => ({
      user_id: userId,
      category: prompt.category,
      pillar_number: prompt.pillar_number,
      pillar_description: prompt.pillar_description,
      prompt_text: prompt.prompt_text,
      hook: prompt.hook,
      is_generated_by_admin: true,
      is_used: false,
      scheduled_date: scheduleDates[index],
      created_by_admin: adminUser.id,
      pushed_to_calendar: false,
    }));

    console.log("Deleting existing admin-generated prompts...");

    // Delete existing admin-generated prompts for this user
    await supabase
      .from("content_prompts")
      .delete()
      .eq("user_id", userId)
      .eq("is_generated_by_admin", true);

    console.log("Inserting new prompts...");

    // Insert new prompts
    const { data: insertedPrompts, error: insertError } = await supabase
      .from("content_prompts")
      .insert(promptsForDb)
      .select();

    if (insertError) {
      console.error("Error inserting prompts:", insertError);
      return NextResponse.json(
        { error: "Failed to save prompts to database" },
        { status: 500 }
      );
    }

    // Log admin activity
    await supabase.from("admin_activity_log").insert({
      admin_id: adminUser.id,
      action: "generate_prompts",
      target_user_id: userId,
      target_type: "content_prompts",
      details: {
        prompts_generated: finalPrompts.length,
        ai_model: "gpt-4o-mini",
        success: true,
      },
    });

    console.log(`✅ Successfully generated ${finalPrompts.length} prompts`);

    return NextResponse.json({
      success: true,
      prompts: insertedPrompts,
      count: finalPrompts.length,
      message: `Successfully generated ${finalPrompts.length} prompts`,
    });
  } catch (error) {
    console.error("Error generating prompts:", error);

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 408 }
        );
      }

      if (error.message.includes("rate_limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait and try again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error)?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
