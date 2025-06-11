import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (profile?.is_admin) {
      return NextResponse.json({
        hasAccess: true,
        isAdmin: true,
        subscription: null,
      });
    }

    // Get user subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Error fetching subscription:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const hasActiveSubscription =
      subscription &&
      subscription.status === "active" &&
      subscription.plan_type === "monthly";

    return NextResponse.json({
      hasAccess: hasActiveSubscription,
      isAdmin: false,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
