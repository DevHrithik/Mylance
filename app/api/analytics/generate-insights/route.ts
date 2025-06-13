import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndSaveInsights } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user authentication with timeout
    const supabase = await createClient();
    const authTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), 3000)
    );

    const authResult = (await Promise.race([
      supabase.auth.getUser(),
      authTimeout,
    ])) as any;

    if (authResult.error || !authResult.data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = authResult.data.user;

    // Check if the user is requesting insights for themselves (or is admin)
    if (user.id !== userId) {
      const adminTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Admin check timeout")), 2000)
      );

      try {
        const adminResult = (await Promise.race([
          supabase
            .from("admin_users")
            .select("id")
            .eq("user_id", user.id)
            .single(),
          adminTimeout,
        ])) as any;

        if (adminResult.error || !adminResult.data) {
          return NextResponse.json(
            { error: "You can only generate insights for yourself" },
            { status: 403 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: "You can only generate insights for yourself" },
          { status: 403 }
        );
      }
    }

    console.log(`Generating insights for user: ${userId}`);

    // Generate and save insights with timeout
    const insightsTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Insights generation timeout")), 30000)
    );

    const insights = (await Promise.race([
      generateAndSaveInsights(userId),
      insightsTimeout,
    ])) as any;

    return NextResponse.json({
      success: true,
      insights: insights,
      count: insights.length,
      message: `Successfully generated ${insights.length} insights`,
    });
  } catch (error) {
    console.error("Error in generate-insights API:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params for GET request
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: "You can only view your own insights" },
        { status: 403 }
      );
    }

    // Fetch existing insights
    const { data: insights, error } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("confidence_score", { ascending: false });

    if (error) {
      console.error("Error fetching insights:", error);
      return NextResponse.json(
        { error: "Failed to fetch insights" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights: insights || [],
      count: insights?.length || 0,
    });
  } catch (error) {
    console.error("Error in get insights API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
