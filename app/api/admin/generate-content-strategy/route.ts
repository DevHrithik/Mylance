import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONTENT_STRATEGY_PROMPT = `You are a strategic marketing assistant helping independent consultants and fractional executives build their personal brands on LinkedIn.

When asked, generate a personalized content strategy that aligns with the user's ideal customer profile (ICP), their unique value, and what they love talking about. Your goal is to help the user build trust, visibility, and authority with their audience.

Write a short strategy (3-4 sentences) that includes:
- How they should position themselves in a very specific way that will resonate with their ideal customer profile
- What types of content they should consistently share
- Tone and storytelling tips (e.g. how personal to be, what types of stories to lean into)
- Content themes or angles they can return to again and again

Use professional, human language with correct grammar and capitalization. Avoid buzzwords or generic advice. Be specific and useful.`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data from Supabase
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare the user message with actual data
    const userMessage = `I want to generate a LinkedIn content strategy for a fractional executive based on the following inputs:

- ICP: ${user.ideal_target_client || "Not specified"}
- ICP Pain Points: ${user.client_pain_points || "Not specified"}
- Unique Value Add: ${user.unique_value_proposition || "Not specified"}
- Proof Points: ${
      user.proof_points || "Professional experience and track record"
    }
- Energizing Topics: ${
      user.energizing_topics || "Industry trends and best practices"
    }
- Decision Makers: ${
      user.decision_makers || "C-level executives and business owners"
    }

Return a clear, 3-4 sentence content strategy that positions this user to build trust, authority, and thought leadership with the user's ideal customer profile given the inputs above. Think critically about what's not obvious, but has a great chance to resonate with the ideal customer given their pain points and the user's unique value prop.`;

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: CONTENT_STRATEGY_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedStrategy = completion.choices[0]?.message?.content;

    if (!generatedStrategy) {
      return NextResponse.json(
        { error: "Failed to generate content strategy" },
        { status: 500 }
      );
    }

    // Update user's profile with the generated strategy
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ content_strategy: generatedStrategy })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save content strategy" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      strategy: generatedStrategy,
    });
  } catch (error) {
    console.error("Error generating content strategy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
