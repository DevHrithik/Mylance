import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateMWFDate } from "@/lib/utils/date";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
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

    // Validate scheduled date if provided
    if (body.scheduled_date) {
      const validation = validateMWFDate(body.scheduled_date);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Update the prompt
    const { data, error } = await supabase
      .from("content_prompts")
      .update({
        category: body.category,
        pillar_number: body.pillar_number,
        pillar_description: body.pillar_description,
        prompt_text: body.prompt_text,
        hook: body.hook,
        scheduled_date: body.scheduled_date,
      })
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
      action: "update_prompt",
      target_type: "content_prompts",
      target_id: id,
      details: {
        prompt_id: id,
        updated_fields: Object.keys(body),
      },
    });

    return NextResponse.json({ success: true, prompt: data });
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete the prompt
    const { error } = await supabase
      .from("content_prompts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting prompt:", error);
      return NextResponse.json(
        { error: "Failed to delete prompt" },
        { status: 500 }
      );
    }

    // Log admin activity
    await supabase.from("admin_activity_log").insert({
      admin_id: adminUser.id,
      action: "delete_prompt",
      target_type: "content_prompts",
      target_id: id,
      details: {
        prompt_id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
