import { NextRequest, NextResponse } from "next/server";
import { getPostsData, revalidatePosts } from "@/lib/supabase/server-queries";

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

    // Revalidate the cache
    await revalidatePosts();

    // Fetch fresh data
    const data = await getPostsData(userId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error refreshing posts data:", error);
    return NextResponse.json(
      { error: "Failed to refresh posts data" },
      { status: 500 }
    );
  }
}
