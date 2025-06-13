import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Define types for the analysis functions
interface ContentChanges {
  character_difference: number;
  word_difference: number;
  sentences_added: number;
  sentences_removed: number;
  formatting_changes: string[];
  word_substitutions: string[];
  tone_adjustments: string[];
}

interface UserPreferences {
  energy_preference?: string;
  length_preference?: string;
  tone_preference?: string;
}

interface LearningInsights {
  edit_category: string;
  user_preferences: UserPreferences;
  style_improvements: string[];
  content_patterns: Record<string, any>;
  learning_signals: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      post_id,
      original_content,
      edited_content,
      edit_type = "other",
      edit_significance = "minor",
      generation_history_id,
      edit_reason,
      confidence_in_edit,
    } = body;

    if (!original_content || !edited_content) {
      return NextResponse.json(
        { error: "Original and edited content are required" },
        { status: 400 }
      );
    }

    // Analyze the changes made
    const changes_made = analyzeContentChanges(
      original_content,
      edited_content
    );
    const learning_insights = extractLearningInsights(
      original_content,
      edited_content,
      edit_type
    );

    // Save the edit to the database
    const { data: editRecord, error: editError } = await supabase
      .from("content_edits")
      .insert({
        user_id: user.id,
        post_id: post_id ? parseInt(post_id) : null,
        generation_history_id: generation_history_id
          ? parseInt(generation_history_id)
          : null,
        original_content,
        edited_content,
        edit_type,
        edit_significance,
        changes_made,
        learning_insights,
        edit_reason,
        confidence_in_edit: confidence_in_edit
          ? parseInt(confidence_in_edit)
          : null,
      })
      .select()
      .single();

    if (editError) {
      console.error("Error saving edit:", editError);
      return NextResponse.json(
        { error: "Failed to save edit tracking data" },
        { status: 500 }
      );
    }

    // Run heavy operations in background (non-blocking)
    Promise.all([
      // Calculate updated learning metrics (non-blocking)
      Promise.resolve(
        supabase.rpc("calculate_learning_metrics", { target_user_id: user.id })
      )
        .then(({ data, error }) => {
          if (error) console.error("Error calculating metrics:", error);
          return data;
        })
        .catch((error: any) => {
          console.error("Metrics calculation failed:", error);
          return null;
        }),

      // Update user preferences (non-blocking)
      updateUserPreferences(supabase, user.id, learning_insights).catch(
        (error: any) => {
          console.error("User preferences update failed:", error);
        }
      ),
    ]).catch((error: any) => {
      console.error("Background tasks failed:", error);
      // Don't fail the request if background tasks fail
    });

    return NextResponse.json({
      success: true,
      edit_id: editRecord.id,
      message: "Edit tracked successfully",
    });
  } catch (error) {
    console.error("Edit tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Analyze the specific changes made between original and edited content
function analyzeContentChanges(
  original: string,
  edited: string
): ContentChanges {
  const changes: ContentChanges = {
    character_difference: edited.length - original.length,
    word_difference: edited.split(/\s+/).length - original.split(/\s+/).length,
    sentences_added: 0,
    sentences_removed: 0,
    formatting_changes: [],
    word_substitutions: [],
    tone_adjustments: [],
  };

  // Simple analysis - can be enhanced with more sophisticated NLP
  const originalSentences = original.split(/[.!?]+/).filter((s) => s.trim());
  const editedSentences = edited.split(/[.!?]+/).filter((s) => s.trim());

  changes.sentences_added = Math.max(
    0,
    editedSentences.length - originalSentences.length
  );
  changes.sentences_removed = Math.max(
    0,
    originalSentences.length - editedSentences.length
  );

  // Check for common formatting changes
  if (edited.includes("**") && !original.includes("**")) {
    changes.formatting_changes.push("added_bold");
  }
  if (
    edited.includes("*") &&
    !original.includes("*") &&
    !edited.includes("**")
  ) {
    changes.formatting_changes.push("added_italic");
  }
  if (
    (edited.match(/\n/g) || []).length > (original.match(/\n/g) || []).length
  ) {
    changes.formatting_changes.push("added_line_breaks");
  }

  return changes;
}

// Extract learning insights from the edit
function extractLearningInsights(
  original: string,
  edited: string,
  editType: string
): LearningInsights {
  const insights: LearningInsights = {
    edit_category: editType,
    user_preferences: {},
    style_improvements: [],
    content_patterns: {},
    learning_signals: [],
  };

  // Analyze specific content changes
  const specificChanges = analyzeSpecificChanges(original, edited);
  insights.learning_signals.push(...specificChanges);

  // Analyze tone changes
  if (edited.includes("!") && !original.includes("!")) {
    insights.user_preferences.energy_preference = "higher";
    insights.learning_signals.push("Added exclamation marks for emphasis");
  }

  // Analyze length preferences with context
  const lengthChange = edited.length - original.length;
  if (Math.abs(lengthChange) > 50) {
    if (lengthChange > 0) {
      insights.user_preferences.length_preference = "longer";
      insights.learning_signals.push(
        `Expanded content by ${lengthChange} characters`
      );
    } else {
      insights.user_preferences.length_preference = "shorter";
      insights.learning_signals.push(
        `Shortened content by ${Math.abs(lengthChange)} characters`
      );
    }
  }

  // Analyze structure changes
  const originalParagraphs = original.split("\n\n").length;
  const editedParagraphs = edited.split("\n\n").length;
  if (editedParagraphs > originalParagraphs) {
    insights.style_improvements.push("added_paragraph_breaks");
    insights.learning_signals.push(
      "Added more paragraph breaks for readability"
    );
  } else if (originalParagraphs > editedParagraphs) {
    insights.style_improvements.push("condensed_paragraphs");
    insights.learning_signals.push("Combined paragraphs for flow");
  }

  // Analyze professional vs casual tone
  const casualWords = ["hey", "awesome", "cool", "amazing", "super"];
  const professionalWords = [
    "excellent",
    "outstanding",
    "remarkable",
    "significant",
    "substantial",
  ];

  const originalCasual = casualWords.some((word) =>
    original.toLowerCase().includes(word)
  );
  const editedCasual = casualWords.some((word) =>
    edited.toLowerCase().includes(word)
  );
  const originalProfessional = professionalWords.some((word) =>
    original.toLowerCase().includes(word)
  );
  const editedProfessional = professionalWords.some((word) =>
    edited.toLowerCase().includes(word)
  );

  if (!originalCasual && editedCasual) {
    insights.user_preferences.tone_preference = "more_casual";
    insights.learning_signals.push(
      "Made language more casual and approachable"
    );
  } else if (originalCasual && !editedCasual && editedProfessional) {
    insights.user_preferences.tone_preference = "more_professional";
    insights.learning_signals.push("Made language more professional");
  }

  return insights;
}

// Analyze specific types of content changes
function analyzeSpecificChanges(original: string, edited: string): string[] {
  const changes: string[] = [];

  // Check for numbered list changes
  const originalNumbers = original.match(/^\d+\.\s/gm) || [];
  const editedNumbers = edited.match(/^\d+\.\s/gm) || [];

  if (originalNumbers.length > editedNumbers.length) {
    const removedCount = originalNumbers.length - editedNumbers.length;
    // Try to identify what was removed
    const originalLines = original
      .split("\n")
      .filter((line) => /^\d+\.\s/.test(line));
    const editedLines = edited
      .split("\n")
      .filter((line) => /^\d+\.\s/.test(line));

    // Find removed content
    const removedLines = originalLines.filter(
      (line) =>
        !editedLines.some(
          (editedLine) => editedLine.substring(0, 50) === line.substring(0, 50)
        )
    );

    if (removedLines.length > 0) {
      const removedContent = (removedLines[0] || "")
        .substring(3, 50)
        .toLowerCase();
      if (
        removedContent.includes("webinar") ||
        removedContent.includes("event")
      ) {
        changes.push("Removed strategy point about webinars/events");
      } else if (
        removedContent.includes("seo") ||
        removedContent.includes("search")
      ) {
        changes.push("Removed strategy point about SEO");
      } else if (
        removedContent.includes("social") ||
        removedContent.includes("linkedin")
      ) {
        changes.push("Removed strategy point about social media");
      } else if (
        removedContent.includes("content") ||
        removedContent.includes("blog")
      ) {
        changes.push("Removed strategy point about content marketing");
      } else {
        changes.push(
          `Removed ${removedCount} strategy point${removedCount > 1 ? "s" : ""}`
        );
      }
    } else {
      changes.push(
        `Removed ${removedCount} numbered point${removedCount > 1 ? "s" : ""}`
      );
    }
  } else if (editedNumbers.length > originalNumbers.length) {
    const addedCount = editedNumbers.length - originalNumbers.length;
    changes.push(
      `Added ${addedCount} new strategy point${addedCount > 1 ? "s" : ""}`
    );
  }

  // Check for emoji changes
  const originalEmojis =
    original.match(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    ) || [];
  const editedEmojis =
    edited.match(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    ) || [];

  if (editedEmojis.length > originalEmojis.length) {
    changes.push("Added emojis for visual appeal");
  } else if (originalEmojis.length > editedEmojis.length) {
    changes.push("Removed emojis for cleaner look");
  }

  // Check for formatting changes
  const originalBold = (original.match(/\*\*(.*?)\*\*/g) || []).length;
  const editedBold = (edited.match(/\*\*(.*?)\*\*/g) || []).length;

  if (editedBold > originalBold) {
    changes.push("Added bold formatting for emphasis");
  } else if (originalBold > editedBold) {
    changes.push("Removed bold formatting");
  }

  // Check for call-to-action changes
  const ctaPatterns = [
    /what('s|\s+is) (your|one)/i,
    /let me know/i,
    /share (your|in)/i,
    /comment below/i,
    /over to you/i,
    /what do you think/i,
  ];

  const originalHasCTA = ctaPatterns.some((pattern) => pattern.test(original));
  const editedHasCTA = ctaPatterns.some((pattern) => pattern.test(edited));

  if (!originalHasCTA && editedHasCTA) {
    changes.push("Added call-to-action for engagement");
  } else if (originalHasCTA && !editedHasCTA) {
    changes.push("Removed call-to-action");
  }

  // Check for introduction/hook changes
  const originalFirstSentence = original.split(/[.!?]/)[0] || "";
  const editedFirstSentence = edited.split(/[.!?]/)[0] || "";

  if (originalFirstSentence !== editedFirstSentence) {
    if (editedFirstSentence.includes("?")) {
      changes.push("Changed opening to a question");
    } else {
      changes.push("Modified opening hook");
    }
  }

  return changes;
}

// Update user preferences based on learning insights
async function updateUserPreferences(
  supabase: any,
  userId: string,
  insights: LearningInsights
) {
  try {
    // Get current preferences
    const { data: currentPrefs } = await supabase
      .from("user_preferences")
      .select("editing_patterns, personalization_data")
      .eq("user_id", userId)
      .single();

    if (currentPrefs) {
      const updatedEditingPatterns = {
        ...currentPrefs.editing_patterns,
        last_edit_insights: insights,
        edit_count: (currentPrefs.editing_patterns?.edit_count || 0) + 1,
        updated_at: new Date().toISOString(),
      };

      const updatedPersonalizationData = {
        ...currentPrefs.personalization_data,
        learning_signals: [
          ...(currentPrefs.personalization_data?.learning_signals || []),
          ...insights.learning_signals,
        ].slice(-50), // Keep last 50 signals
        last_learning_update: new Date().toISOString(),
      };

      await supabase
        .from("user_preferences")
        .update({
          editing_patterns: updatedEditingPatterns,
          personalization_data: updatedPersonalizationData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get learning insights for the user
    const { data: learningInsights, error: insightsError } = await supabase
      .from("ai_learning_insights")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (insightsError && insightsError.code !== "PGRST116") {
      console.error("Error fetching learning insights:", insightsError);
      return NextResponse.json(
        { error: "Failed to fetch learning insights" },
        { status: 500 }
      );
    }

    // Get recent edits for trend analysis
    const { data: recentEdits, error: editsError } = await supabase
      .from("content_edits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (editsError) {
      console.error("Error fetching recent edits:", editsError);
      return NextResponse.json(
        { error: "Failed to fetch recent edits" },
        { status: 500 }
      );
    }

    // Calculate current metrics if no insights record exists
    let metrics = {};
    if (!learningInsights) {
      const { data: metricsData } = await supabase.rpc(
        "calculate_learning_metrics",
        { target_user_id: user.id }
      );
      metrics = metricsData || {};
    }

    return NextResponse.json({
      learning_insights: learningInsights || {
        total_edits: recentEdits?.length || 0,
        improvement_score: 0.0,
        personalization_level: 0.0,
        ...metrics,
      },
      recent_edits: recentEdits || [],
      trends: calculateTrends(recentEdits || []),
    });
  } catch (error) {
    console.error("Error fetching learning data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Calculate trends from recent edits
function calculateTrends(edits: any[]) {
  if (!edits.length) return { improvement_trend: 0, confidence_trend: 0 };

  const last7Days = edits.filter(
    (edit) =>
      new Date(edit.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const previous7Days = edits.filter((edit) => {
    const editDate = new Date(edit.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return editDate > twoWeeksAgo && editDate <= weekAgo;
  });

  const improvementTrend =
    previous7Days.length > 0
      ? ((previous7Days.length - last7Days.length) / previous7Days.length) * 100
      : 0;

  const avgConfidenceLast7 =
    last7Days.length > 0
      ? last7Days.reduce(
          (sum, edit) => sum + (edit.confidence_in_edit || 3),
          0
        ) / last7Days.length
      : 3;

  const avgConfidencePrevious7 =
    previous7Days.length > 0
      ? previous7Days.reduce(
          (sum, edit) => sum + (edit.confidence_in_edit || 3),
          0
        ) / previous7Days.length
      : 3;

  const confidenceTrend =
    previous7Days.length > 0
      ? ((avgConfidenceLast7 - avgConfidencePrevious7) /
          avgConfidencePrevious7) *
        100
      : 0;

  return {
    improvement_trend: Math.round(improvementTrend * 100) / 100,
    confidence_trend: Math.round(confidenceTrend * 100) / 100,
    edits_last_7_days: last7Days.length,
    edits_previous_7_days: previous7Days.length,
  };
}
