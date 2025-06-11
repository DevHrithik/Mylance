import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type, // 'prompt' or 'post'
      targetId, // prompt_id or post_id
      rating,
      feedbackText,
      likedAspects,
      dislikedAspects,
      improvementSuggestions,
      wouldUse,
      wouldRecommend,
      contextInfo,
      generationHistoryId,
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    if (type === "post") {
      if (!targetId) {
        return NextResponse.json(
          { error: "Post ID is required for post feedback" },
          { status: 400 }
        );
      }
      // Handle post feedback
      const { data: postFeedback, error: postError } = await supabase
        .from("post_feedback")
        .insert({
          user_id: user.id,
          post_id: targetId,
          generation_history_id: generationHistoryId,
          rating,
          feedback_text: feedbackText,
          liked_aspects: likedAspects,
          disliked_aspects: dislikedAspects,
          improvement_suggestions: improvementSuggestions,
          would_use: wouldUse,
          would_recommend: wouldRecommend,
          context_info: contextInfo || {},
        })
        .select()
        .single();

      if (postError) {
        console.error("Error creating post feedback:", postError);
        return NextResponse.json(
          { error: "Failed to submit feedback" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, feedback: postFeedback });
    } else if (type === "prompt") {
      // Handle prompt feedback (including general feedback with targetId = null)
      const insertData: any = {
        user_id: user.id,
        feedback_type: "prompt",
        rating,
        feedback_text: feedbackText,
        liked_aspects: likedAspects,
        disliked_aspects: dislikedAspects,
        improvement_suggestions: improvementSuggestions,
        context_info: contextInfo || {},
      };

      // Only add prompt_id if targetId is provided and not null/0
      if (targetId && targetId !== 0 && targetId !== null) {
        insertData.prompt_id = targetId;
      }

      const { data: promptFeedback, error: promptError } = await supabase
        .from("user_feedback")
        .insert(insertData)
        .select()
        .single();

      if (promptError) {
        console.error("Error creating prompt feedback:", promptError);
        return NextResponse.json(
          { error: "Failed to submit feedback" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, feedback: promptFeedback });
    } else {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const targetId = searchParams.get("targetId");

    if (!type || !targetId) {
      return NextResponse.json(
        { error: "Type and target ID are required" },
        { status: 400 }
      );
    }

    if (type === "post") {
      const { data: feedback, error } = await supabase
        .from("post_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("post_id", targetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching post feedback:", error);
        return NextResponse.json(
          { error: "Failed to fetch feedback" },
          { status: 500 }
        );
      }

      return NextResponse.json({ feedback });
    } else if (type === "prompt") {
      const { data: feedback, error } = await supabase
        .from("user_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("prompt_id", targetId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prompt feedback:", error);
        return NextResponse.json(
          { error: "Failed to fetch feedback" },
          { status: 500 }
        );
      }

      return NextResponse.json({ feedback });
    }

    return NextResponse.json(
      { error: "Invalid feedback type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
