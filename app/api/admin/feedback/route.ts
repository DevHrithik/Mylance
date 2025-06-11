import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdminAccess(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  return profile?.is_admin === true;
}

interface FeedbackData {
  id: number;
  user_id: string;
  rating?: number;
  feedback_text?: string;
  liked_aspects?: string[];
  disliked_aspects?: string[];
  improvement_suggestions?: string;
  would_use?: boolean;
  would_recommend?: boolean;
  context_info?: Record<string, any>;
  is_resolved: boolean;
  admin_response?: string;
  created_at: string;
  updated_at: string;
  feedback_category: "prompt" | "post";
  profiles?: {
    id: string;
    full_name?: string;
    email: string;
    first_name?: string;
  };
  posts?: {
    id: number;
    title?: string;
    content: string;
    content_type: string;
    created_at: string;
  };
  content_prompts?: {
    id: number;
    category: string;
    prompt_text: string;
    hook: string;
    pillar_description?: string;
    created_at: string;
  };
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

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let feedbackData: FeedbackData[] = [];

    if (type === "all" || type === "post") {
      // Get post feedback with user and post details
      let postQuery = supabase
        .from("post_feedback")
        .select(
          `
          *,
          profiles!inner(
            id,
            full_name,
            email,
            first_name
          ),
          posts!inner(
            id,
            title,
            content,
            content_type,
            created_at
          )
        `
        )
        .order("created_at", { ascending: false });

      if (userId) {
        postQuery = postQuery.eq("user_id", userId);
      }

      const { data: postFeedback, error: postError } = await postQuery.range(
        offset,
        offset + limit - 1
      );

      if (postError) {
        console.error("Error fetching post feedback:", postError);
      } else {
        feedbackData = [
          ...feedbackData,
          ...postFeedback.map((item) => ({
            ...item,
            feedback_category: "post" as const,
          })),
        ];
      }
    }

    if (type === "all" || type === "prompt") {
      // Get prompt feedback with user and prompt details
      let promptQuery = supabase
        .from("user_feedback")
        .select(
          `
          *,
          profiles!inner(
            id,
            full_name,
            email,
            first_name
          ),
          content_prompts(
            id,
            category,
            prompt_text,
            hook,
            pillar_description,
            created_at
          )
        `
        )
        .eq("feedback_type", "prompt")
        .order("created_at", { ascending: false });

      if (userId) {
        promptQuery = promptQuery.eq("user_id", userId);
      }

      const { data: promptFeedback, error: promptError } =
        await promptQuery.range(offset, offset + limit - 1);

      if (promptError) {
        console.error("Error fetching prompt feedback:", promptError);
      } else {
        feedbackData = [
          ...feedbackData,
          ...promptFeedback.map((item) => ({
            ...item,
            feedback_category: "prompt" as const,
          })),
        ];
      }
    }

    // Sort by created_at descending
    feedbackData.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Get total counts for pagination
    const { count: postCount } = await supabase
      .from("post_feedback")
      .select("*", { count: "exact", head: true });

    const { count: promptCount } = await supabase
      .from("user_feedback")
      .select("*", { count: "exact", head: true })
      .eq("feedback_type", "prompt");

    return NextResponse.json({
      feedback: feedbackData,
      pagination: {
        page,
        limit,
        total: (postCount || 0) + (promptCount || 0),
        hasMore: feedbackData.length === limit,
      },
      stats: {
        totalPostFeedback: postCount || 0,
        totalPromptFeedback: promptCount || 0,
      },
    });
  } catch (error) {
    console.error("Admin feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    // Check admin access
    const isAdmin = await checkAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feedbackId, type, adminResponse, isResolved } = body;

    if (!feedbackId || !type) {
      return NextResponse.json(
        { error: "Feedback ID and type are required" },
        { status: 400 }
      );
    }

    // Get admin user ID
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const updateData: any = {
      admin_response: adminResponse,
      is_resolved: isResolved,
      updated_at: new Date().toISOString(),
    };

    if (isResolved && adminUser?.id) {
      updateData.resolved_by = adminUser.id;
      updateData.resolved_at = new Date().toISOString();
    }

    let result;
    if (type === "post") {
      const { data, error } = await supabase
        .from("post_feedback")
        .update(updateData)
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) {
        console.error("Error updating post feedback:", error);
        return NextResponse.json(
          { error: "Failed to update feedback" },
          { status: 500 }
        );
      }
      result = data;
    } else if (type === "prompt") {
      const { data, error } = await supabase
        .from("user_feedback")
        .update(updateData)
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) {
        console.error("Error updating prompt feedback:", error);
        return NextResponse.json(
          { error: "Failed to update feedback" },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ success: true, feedback: result });
  } catch (error) {
    console.error("Admin feedback update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
