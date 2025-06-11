import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardData,
  revalidateDashboard,
} from "@/lib/supabase/server-queries";

export async function POST(request: NextRequest) {
  try {
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

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Revalidate the cache
    await revalidateDashboard();

    // Fetch fresh data
    const dashboardData = await getDashboardData(userId);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh dashboard data" },
      { status: 500 }
    );
  }
}
