import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONTENT_PILLARS_PROMPT = `You are an incredibly strategic content advisor for fractional executives and consultants. In a very crowded market, you are designed to create content pillars that help the executive stand out by clearly pointing to their unique value, especially taking into account their ideal customer's pain points.

Your job is to read the user's inputs (their ICP, value proposition, content strategy, etc.) and generate 3 powerful, unique, differentiating content pillars that they can use to guide their LinkedIn thought leadership.

Each content pillar must:
- Be a single sentence
- Be unique and not overlap with the others
- Clearly reflect what will resonate most with the ICP and their specific pain points
- Be clearly based on the user's unique value, proof points, and topics they enjoy talking about (energizing topics)
- Use correct grammar, proper capitalization, and a professional tone
- Avoid vague themes like "leadership" or "growth" — instead, make each pillar specific, tactical, or story-driven and really hit on their unique value

Return the output in this format:

Pillar 1: [one sentence]  
Pillar 2: [one sentence]  
Pillar 3: [one sentence]

Example output:
Pillar 1: How early-stage SaaS founders can implement scalable systems to eliminate chaos and reclaim their time.  
Pillar 2: The most common operational mistakes startups make and how to avoid them using lightweight, proven frameworks.  
Pillar 3: Behind-the-scenes stories from consulting engagements that show how fractional leaders create immediate value without full-time cost.`;

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
    const userMessage = `Please generate 3 unique and strategic content pillars that this fractional executive can use to guide their LinkedIn content strategy.

Each pillar should be:
- One sentence long
- Clear, specific, and distinct from the others
- Designed to resonate with the ICP based on their pain points
- Rooted in the user's expertise and experience
- Focused on building trust, visibility, and authority with decision makers

Here are the user's inputs:
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

Here is the content strategy you came up with and I refined: ${
      user.content_strategy || "Not specified"
    }`;

    // Make OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: CONTENT_PILLARS_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate content pillars" },
        { status: 500 }
      );
    }

    // Parse the content pillars from the response
    const pillarsText = generatedContent;
    const pillarLines = pillarsText
      .split("\n")
      .filter((line) => line.trim() && line.includes("Pillar"));
    const pillars = pillarLines.map((line) => {
      // Extract content after "Pillar X: "
      const colonIndex = line.indexOf(":");
      return colonIndex !== -1
        ? line.substring(colonIndex + 1).trim()
        : line.trim();
    });

    // Ensure we have exactly 3 pillars, pad with empty strings if needed
    while (pillars.length < 3) {
      pillars.push("");
    }
    const finalPillars = pillars.slice(0, 3);

    // Update user's profile with the generated pillars
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        content_pillars: finalPillars,
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save content pillars" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pillars: finalPillars,
      fullResponse: generatedContent,
    });
  } catch (error) {
    console.error("Error generating content pillars:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
