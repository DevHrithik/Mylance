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
- Extract at least 10-15 frequently used words (avoid common words like "the", "and", "is")
- Identify 3-5 unique signature expressions or phrases they commonly use
- Their tone and energy level
- How direct or subtle they are
- Their confidence level
- Their use of emojis and casual language
- Sentence structure preferences

Make sure to populate frequently_used_words and signature_expressions arrays with actual content from the posts.`;

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
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      // Fallback analysis
      analysis = {
        learning_summary:
          "I've analyzed your writing style and identified key patterns in your communication approach.",
        frequently_used_words: [],
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
