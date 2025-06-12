import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Test auth endpoint called");

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("Auth check - User:", user?.id, "Error:", authError?.message);

    if (authError) {
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        details: authError.message,
        user: null,
      });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      message: "Authentication working correctly",
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Test analytics endpoint called");

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: authError?.message || "No user found",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Test POST body:", body);

    // Test a simple table query
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profiles,
      body: body,
      message: "Test endpoint working correctly",
    });
  } catch (error) {
    console.error("Test analytics POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
