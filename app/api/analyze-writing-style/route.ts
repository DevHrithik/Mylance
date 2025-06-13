import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { posts, userId } = await request.json();

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: "No posts provided for analysis" },
        { status: 400 }
      );
    }

    // Combine all posts for analysis
    const combinedText = posts.join("\n\n---\n\n");

    const prompt = `Analyze the following LinkedIn posts to understand the author's writing style and preferences. Provide a detailed analysis in JSON format.

Posts to analyze:
${combinedText}

Please analyze and return a JSON object with the following structure:
{
  "learning_summary": "A 2-3 sentence summary of what you learned about this person's writing style",
  "frequently_used_words": ["array", "of", "common", "words", "they", "use"],
  "industry_jargon": ["industry", "specific", "terms", "they", "use"],
  "signature_expressions": ["unique phrases", "they commonly use"],
  "emoji_usage": "none|minimal|moderate|frequent",
  "sentence_length": "short|medium|long|varied",
  "directness_level": 1-10 (1=very indirect, 10=very direct),
  "confidence_level": 1-10 (1=humble, 10=very confident),
  "energy_level": 1-10 (1=calm, 10=very energetic),
  "tone": "professional|casual|authoritative|conversational|inspirational|educational",
  "humor_usage": "none|minimal|moderate|frequent",
  "insights": ["key insight 1", "key insight 2", "key insight 3"]
}

Focus on:
- Extract at least 10-15 frequently used words (avoid basic words like "the", "and", "is", "a", "to", "for", "of", "in", "on", "at", "with", "by"). Look for meaningful words they use repeatedly like action verbs, descriptive adjectives, business terms, etc.
- Identify industry jargon, technical terms, or business terminology they use (like "stakeholders", "ROI", "analytics", "conversion", "optimization", etc.)
- Identify 3-8 unique signature expressions, catchphrases, or distinctive ways they phrase things (like "game-changer", "at the end of the day", "here's the thing", etc.)
- Their tone and energy level
- How direct or subtle they are
- Their confidence level
- Their use of emojis and casual language
- Sentence structure preferences

CRITICAL: Make sure to populate frequently_used_words, industry_jargon, and signature_expressions arrays with actual content from the posts. These arrays should NOT be empty. Extract real words and phrases that appear in the text.

Example of good extractions:
- frequently_used_words: ["strategy", "growth", "insights", "optimize", "leverage", "implement", "results", "performance", "value", "opportunity"]
- industry_jargon: ["stakeholders", "KPIs", "ROI", "conversion", "analytics", "optimization", "scalable", "engagement"]
- signature_expressions: ["game-changer", "here's the bottom line", "at the end of the day", "let's dive deep"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert writing style analyst. Analyze writing samples and provide detailed, accurate insights about the author's style, tone, and preferences. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
      console.log("🔍 Raw AI response:", responseText);
      console.log(
        "📝 Parsed frequently_used_words:",
        analysis.frequently_used_words
      );
      console.log(
        "✨ Parsed signature_expressions:",
        analysis.signature_expressions
      );
      console.log("🏢 Parsed industry_jargon:", analysis.industry_jargon);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      // Fallback analysis
      analysis = {
        learning_summary:
          "I've analyzed your writing style and identified key patterns in your communication approach.",
        frequently_used_words: [],
        industry_jargon: [],
        signature_expressions: [],
        emoji_usage: "minimal",
        sentence_length: "medium",
        directness_level: 5,
        confidence_level: 5,
        energy_level: 5,
        tone: "professional",
        humor_usage: "minimal",
        insights: ["Your writing style analysis is complete"],
      };
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing writing style:", error);
    return NextResponse.json(
      { error: "Failed to analyze writing style" },
      { status: 500 }
    );
  }
}
