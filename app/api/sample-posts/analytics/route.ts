import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error("No user found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    const body = await request.json();
    const {
      postContent,
      impressions,
      likes,
      comments,
      shares,
      linkedinUrl,
      postDate,
    } = body;

    console.log("Request body:", {
      postContent: postContent?.substring(0, 50) + "...",
      impressions,
      likes,
      comments,
      shares,
    });

    if (!postContent?.trim()) {
      return NextResponse.json(
        { error: "Post content is required" },
        { status: 400 }
      );
    }

    // Calculate word and character counts
    const wordCount = postContent.trim().split(/\s+/).length;
    const characterCount = postContent.trim().length;

    console.log("Calculated counts:", { wordCount, characterCount });

    // Prepare the insert data
    const insertData = {
      user_id: user.id,
      post_content: postContent.trim(),
      impressions: parseInt(impressions || "0"),
      likes: parseInt(likes || "0"),
      comments: parseInt(comments || "0"),
      shares: parseInt(shares || "0"),
      linkedin_url: linkedinUrl || null,
      post_date: postDate || null,
      word_count: wordCount,
      character_count: characterCount,
    };

    console.log("Insert data:", insertData);

    // Save to analytics table
    const { data: analyticsData, error: analyticsError } = await supabase
      .from("sample_post_analytics")
      .insert(insertData)
      .select()
      .single();

    if (analyticsError) {
      console.error("Error saving analytics:", analyticsError);
      console.error("Error details:", JSON.stringify(analyticsError, null, 2));
      return NextResponse.json(
        {
          error: "Failed to save analytics data",
          details: analyticsError.message,
          code: analyticsError.code,
          hint: analyticsError.hint,
        },
        { status: 500 }
      );
    }

    console.log("Analytics data saved successfully:", analyticsData.id);

    // Generate insights based on performance
    const engagementRate = analyticsData.engagement_rate || 0;
    const insights = {
      performance_category:
        engagementRate >= 10
          ? "excellent"
          : engagementRate >= 5
          ? "good"
          : engagementRate >= 2
          ? "average"
          : "low",
      what_works:
        engagementRate >= 5
          ? [
              "High engagement metrics",
              "Strong audience connection",
              "Effective content resonance",
            ]
          : [],
      recommendations: generateRecommendations(
        engagementRate,
        wordCount,
        characterCount
      ),
      benchmarks: {
        engagement_rate: engagementRate,
        industry_average: 2.8, // LinkedIn industry average
        performance_vs_average: engagementRate > 2.8 ? "above" : "below",
      },
    };

    // Update the record with insights
    const { error: updateError } = await supabase
      .from("sample_post_analytics")
      .update({ insights })
      .eq("id", analyticsData.id);

    if (updateError) {
      console.error("Error updating insights:", updateError);
      // Don't fail the request for this, just log it
    }

    console.log("Request completed successfully");

    return NextResponse.json({
      success: true,
      data: {
        ...analyticsData,
        insights,
      },
    });
  } catch (error) {
    console.error("Error in sample posts analytics API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    // Get user's sample posts analytics
    const { data: highPerformingPosts, error } = await supabase
      .from("sample_post_analytics")
      .select("*")
      .eq("user_id", user.id)
      .order("engagement_rate", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching high-performing posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // Generate overall insights
    const overallInsights = generateOverallInsights(highPerformingPosts || []);

    return NextResponse.json({
      success: true,
      data: {
        high_performing_posts: highPerformingPosts || [],
        overall_insights: overallInsights,
      },
    });
  } catch (error) {
    console.error("Error in sample posts analytics GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  engagementRate: number,
  wordCount: number,
  characterCount: number
): string[] {
  const recommendations: string[] = [];

  if (engagementRate < 2) {
    recommendations.push("Try adding more engaging hooks or questions");
    recommendations.push("Consider sharing personal experiences or stories");
    recommendations.push("Use more interactive content formats");
  }

  if (wordCount > 300) {
    recommendations.push(
      "Consider breaking long posts into shorter, more digestible pieces"
    );
  }

  if (wordCount < 50) {
    recommendations.push(
      "Try adding more context or detail to provide more value"
    );
  }

  if (engagementRate >= 5) {
    recommendations.push(
      "Great performance! Consider creating similar content"
    );
    recommendations.push(
      "Analyze what made this post successful and replicate those elements"
    );
  }

  return recommendations;
}

export async function DELETE(request: NextRequest) {
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

    // Get the post ID from query params
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Delete the post (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from("sample_post_analytics")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in sample posts analytics DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateOverallInsights(posts: any[]): any {
  if (!posts || posts.length === 0) {
    return {
      total_posts: 0,
      average_engagement: 0,
      top_performing_content: [],
      recommendations: ["Add more sample posts to generate insights"],
    };
  }

  const totalEngagement = posts.reduce(
    (sum, post) => sum + (post.engagement_rate || 0),
    0
  );
  const averageEngagement = totalEngagement / posts.length;

  const topPerformingContent = posts
    .filter((post) => post.engagement_rate >= 5)
    .map((post) => ({
      content_preview: post.post_content.substring(0, 100) + "...",
      engagement_rate: post.engagement_rate,
      what_works: post.what_works,
    }));

  return {
    total_posts: posts.length,
    average_engagement: parseFloat(averageEngagement.toFixed(2)),
    high_performing_posts: posts.filter((post) => post.engagement_rate >= 5)
      .length,
    top_performing_content: topPerformingContent.slice(0, 3),
    overall_recommendations: [
      averageEngagement >= 5
        ? "Excellent performance! Keep using similar content strategies"
        : "Focus on creating more engaging, story-driven content",
      posts.length < 5
        ? "Add more sample posts to improve AI personalization"
        : "You have good data - the AI can now better match your style",
    ],
  };
}
