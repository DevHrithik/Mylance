import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Update the prompt
    const { data, error } = await supabase
      .from("content_prompts")
      .update({ pushed_to_calendar: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating prompt:", error);
      return NextResponse.json(
        { error: "Failed to update prompt" },
        { status: 500 }
      );
    }

    // Log admin activity
    await supabase.from("admin_activity_log").insert({
      admin_id: adminUser.id,
      action: "push_prompt_to_calendar",
      target_type: "content_prompts",
      target_id: id,
      details: {
        prompt_id: id,
      },
    });

    return NextResponse.json({ success: true, prompt: data });
  } catch (error) {
    console.error("Error pushing prompt to calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
