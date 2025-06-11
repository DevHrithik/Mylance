import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is admin
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

    // Update all prompts for this user
    const { data, error } = await supabase
      .from("content_prompts")
      .update({ pushed_to_calendar: true })
      .eq("user_id", userId)
      .eq("is_generated_by_admin", true)
      .select();

    if (error) {
      console.error("Error updating prompts:", error);
      return NextResponse.json(
        { error: "Failed to update prompts" },
        { status: 500 }
      );
    }

    // Log admin activity
    await supabase.from("admin_activity_log").insert({
      admin_id: adminUser.id,
      action: "push_all_prompts_to_calendar",
      target_user_id: userId,
      target_type: "content_prompts",
      details: {
        prompts_updated: data?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      updated_count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error pushing all prompts to calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
