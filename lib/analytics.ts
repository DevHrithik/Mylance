import { createClient } from "./supabase/client";

export interface PostPerformance {
  id: number;
  post_id: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  recorded_at: string;
  post?: {
    id: number;
    title: string;
    content: string;
    posted_at: string;
    content_type: string;
    topics: string[];
  };
}

export interface AnalyticsStats {
  totalImpressions: number;
  totalEngagements: number;
  averageEngagementRate: number;
  totalPosts: number;
  impressionGrowth?: number;
  engagementGrowth?: number;
}

export interface TopPost {
  id: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  post?: {
    id: number;
    title: string;
    content: string;
    posted_at: string;
    content_type: string;
  };
}

export interface AIInsight {
  id: number;
  insight_type: string;
  insight_data: any;
  confidence_score: number;
  performance_impact: number;
  recommendations: string[];
  created_at: string;
}

export async function getPostPerformanceData(
  userId: string
): Promise<PostPerformance[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_performance")
    .select(
      `
      *,
      posts!inner(
        id,
        title,
        content,
        posted_at,
        content_type,
        topics,
        user_id
      )
    `
    )
    .eq("posts.user_id", userId)
    .order("recorded_at", { ascending: false });

  if (error) {
    console.error("Error fetching post performance:", error);
    return [];
  }

  return data || [];
}

export async function getAnalyticsStats(
  userId: string
): Promise<AnalyticsStats> {
  const supabase = createClient();

  // Get all posts with analytics for this user
  const { data: allData, error } = await supabase
    .from("post_performance")
    .select(
      `
      impressions,
      likes,
      comments,
      shares,
      engagement_rate,
      recorded_at,
      posts!inner(user_id, posted_at)
    `
    )
    .eq("posts.user_id", userId);

  if (error) {
    console.error("Error fetching analytics stats:", error);
    return {
      totalImpressions: 0,
      totalEngagements: 0,
      averageEngagementRate: 0,
      totalPosts: 0,
    };
  }

  if (!allData || allData.length === 0) {
    return {
      totalImpressions: 0,
      totalEngagements: 0,
      averageEngagementRate: 0,
      totalPosts: 0,
    };
  }

  // Calculate current period (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const currentPeriodData = allData.filter(
    (item: any) => new Date(item.recorded_at) >= thirtyDaysAgo
  );

  // Calculate previous period (30-60 days ago)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const previousPeriodData = allData.filter((item: any) => {
    const recordedDate = new Date(item.recorded_at);
    return recordedDate >= sixtyDaysAgo && recordedDate < thirtyDaysAgo;
  });

  // Calculate totals for current period
  const currentTotals = currentPeriodData.reduce(
    (acc, curr) => ({
      impressions: acc.impressions + (curr.impressions || 0),
      engagements:
        acc.engagements +
        (curr.likes || 0) +
        (curr.comments || 0) +
        (curr.shares || 0),
      engagementRate:
        acc.engagementRate + (parseFloat(curr.engagement_rate) || 0),
      count: acc.count + 1,
    }),
    { impressions: 0, engagements: 0, engagementRate: 0, count: 0 }
  );

  // Calculate totals for previous period
  const previousTotals = previousPeriodData.reduce(
    (acc, curr) => ({
      impressions: acc.impressions + (curr.impressions || 0),
      engagements:
        acc.engagements +
        (curr.likes || 0) +
        (curr.comments || 0) +
        (curr.shares || 0),
      engagementRate:
        acc.engagementRate + (parseFloat(curr.engagement_rate) || 0),
      count: acc.count + 1,
    }),
    { impressions: 0, engagements: 0, engagementRate: 0, count: 0 }
  );

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const avgCurrentEngagement =
    currentTotals.count > 0
      ? currentTotals.engagementRate / currentTotals.count
      : 0;
  const avgPreviousEngagement =
    previousTotals.count > 0
      ? previousTotals.engagementRate / previousTotals.count
      : 0;

  return {
    totalImpressions: currentTotals.impressions,
    totalEngagements: currentTotals.engagements,
    averageEngagementRate: avgCurrentEngagement,
    totalPosts: currentTotals.count,
    impressionGrowth: calculateGrowth(
      currentTotals.impressions,
      previousTotals.impressions
    ),
    engagementGrowth: calculateGrowth(
      avgCurrentEngagement,
      avgPreviousEngagement
    ),
  };
}

export async function getTopPosts(
  userId: string,
  limit: number = 5
): Promise<TopPost[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_performance")
    .select(
      `
      id,
      impressions,
      likes,
      comments,
      shares,
      engagement_rate,
      posts!inner(
        id,
        title,
        content,
        posted_at,
        content_type,
        user_id
      )
    `
    )
    .eq("posts.user_id", userId)
    .order("engagement_rate", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching top posts:", error);
    return [];
  }

  return (
    data?.map((item: any) => ({
      id: item.id,
      impressions: item.impressions,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
      engagement_rate: parseFloat(item.engagement_rate) || 0,
      post: {
        id: item.posts.id,
        title:
          item.posts.title ||
          `${item.posts.content?.substring(0, 50)}...` ||
          "Untitled Post",
        content: item.posts.content || "",
        posted_at: item.posts.posted_at,
        content_type: item.posts.content_type || "general",
      },
    })) || []
  );
}

export async function getAIInsights(userId: string): Promise<AIInsight[]> {
  const supabase = createClient();

  console.log("Fetching AI insights for user:", userId);

  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("confidence_score", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching AI insights:", error);
  }

  console.log("Found stored insights:", data?.length || 0);

  // If we have stored insights, return them
  if (data && data.length > 0) {
    return data;
  }

  // No stored insights found - generate new ones
  console.log(
    "No stored insights found, generating new insights for user:",
    userId
  );
  try {
    const newInsights = await generateAndSaveInsights(userId);
    return newInsights;
  } catch (error) {
    console.error("Error generating new insights:", error);
    return [];
  }
}

export async function getEngagementOverTime(
  userId: string,
  days: number = 30
): Promise<{ date: string; engagement: number; impressions: number }[]> {
  const supabase = createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const { data, error } = await supabase
      .from("post_performance")
      .select(
        `
        recorded_at,
        impressions,
        engagement_rate,
        posts!inner(user_id, posted_at)
      `
      )
      .eq("posts.user_id", userId)
      .gte("recorded_at", startDate.toISOString())
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching engagement over time:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by date and calculate daily averages
    const groupedData = data.reduce(
      (
        acc: {
          [key: string]: {
            engagement: number;
            impressions: number;
            count: number;
          };
        },
        curr: any
      ) => {
        // Ensure we have a valid recorded_at date
        if (!curr.recorded_at) {
          return acc;
        }

        const dateString = new Date(curr.recorded_at)
          .toISOString()
          .split("T")[0];

        // Additional check to ensure we have a valid date string
        if (!dateString) {
          return acc;
        }

        if (!acc[dateString]) {
          acc[dateString] = { engagement: 0, impressions: 0, count: 0 };
        }

        acc[dateString].engagement += parseFloat(curr.engagement_rate) || 0;
        acc[dateString].impressions += curr.impressions || 0;
        acc[dateString].count += 1;

        return acc;
      },
      {}
    );

    return Object.entries(groupedData)
      .map(([date, stats]) => ({
        date,
        engagement: stats.count > 0 ? stats.engagement / stats.count : 0,
        impressions: stats.impressions,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (err) {
    console.error("Unexpected error in getEngagementOverTime:", err);
    return [];
  }
}

export async function generateDynamicInsights(
  userId: string,
  postPerformance: PostPerformance[]
): Promise<AIInsight[]> {
  const dynamicInsights: AIInsight[] = [];

  if (!postPerformance || postPerformance.length === 0) {
    return dynamicInsights;
  }

  // Analyze engagement patterns
  const avgEngagement =
    postPerformance.reduce(
      (sum, post) => sum + (post.engagement_rate || 0),
      0
    ) / postPerformance.length;
  const totalImpressions = postPerformance.reduce(
    (sum, post) => sum + post.impressions,
    0
  );
  const bestPost = postPerformance.reduce((best, current) =>
    (current.engagement_rate || 0) > (best.engagement_rate || 0)
      ? current
      : best
  );

  // Content Length Analysis
  const avgContentLength =
    postPerformance
      .filter((post) => post.post?.content)
      .reduce((sum, post) => sum + (post.post?.content?.length || 0), 0) /
    postPerformance.filter((post) => post.post?.content).length;

  if (avgContentLength > 0) {
    const lengthInsight: AIInsight = {
      id: Date.now(),
      insight_type: "content_length_optimization",
      insight_data: {
        current_avg_length: Math.round(avgContentLength),
        optimal_range: avgContentLength > 300 ? "200-250" : "250-350",
        performance_correlation:
          avgEngagement > 3 ? "positive" : "needs_improvement",
      },
      confidence_score: 0.82,
      performance_impact: avgContentLength > 300 ? 12.5 : 18.3,
      recommendations: [
        avgContentLength > 300
          ? "Try shorter, more concise posts for better engagement"
          : "Consider adding more detail to your posts for higher value",
        "Break long content into multiple posts or carousels",
        "Test different lengths and measure engagement rates",
      ],
      created_at: new Date().toISOString(),
    };
    dynamicInsights.push(lengthInsight);
  }

  // Consistency Analysis
  const postFrequency = postPerformance.length;
  if (postFrequency > 0) {
    const consistencyInsight: AIInsight = {
      id: Date.now() + 1,
      insight_type: "posting_consistency",
      insight_data: {
        current_frequency: postFrequency,
        recommended_frequency:
          postFrequency < 3 ? "3-4 per week" : "maintain current pace",
        consistency_score: postFrequency >= 3 ? 85 : 60,
      },
      confidence_score: 0.78,
      performance_impact: postFrequency < 3 ? 25.0 : 8.5,
      recommendations: [
        postFrequency < 3
          ? "Increase posting frequency to 3-4 times per week for better reach"
          : "Maintain your current posting schedule - it's working well",
        "Create a content calendar for consistent posting",
        "Batch content creation to maintain consistency",
      ],
      created_at: new Date().toISOString(),
    };
    dynamicInsights.push(consistencyInsight);
  }

  // Performance Variance Analysis
  const engagementRates = postPerformance.map((p) => p.engagement_rate || 0);
  const maxEngagement = Math.max(...engagementRates);
  const minEngagement = Math.min(...engagementRates);
  const variance = maxEngagement - minEngagement;

  if (variance > 2) {
    const varianceInsight: AIInsight = {
      id: Date.now() + 2,
      insight_type: "performance_stability",
      insight_data: {
        engagement_variance: variance.toFixed(1),
        best_performing_rate: maxEngagement.toFixed(1),
        improvement_potential: (maxEngagement - avgEngagement).toFixed(1),
      },
      confidence_score: 0.86,
      performance_impact: variance * 3.2,
      recommendations: [
        "Analyze your best-performing post to identify success patterns",
        `Your top post achieved ${maxEngagement.toFixed(
          1
        )}% engagement - replicate this style`,
        "Create templates based on your highest-performing content",
        "A/B test different content formats to reduce variance",
      ],
      created_at: new Date().toISOString(),
    };
    dynamicInsights.push(varianceInsight);
  }

  // Engagement Type Analysis
  const totalLikes = postPerformance.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = postPerformance.reduce(
    (sum, post) => sum + post.comments,
    0
  );
  const totalShares = postPerformance.reduce(
    (sum, post) => sum + post.shares,
    0
  );

  const likeRate =
    totalImpressions > 0 ? (totalLikes / totalImpressions) * 100 : 0;
  const commentRate =
    totalImpressions > 0 ? (totalComments / totalImpressions) * 100 : 0;
  const shareRate =
    totalImpressions > 0 ? (totalShares / totalImpressions) * 100 : 0;

  if (commentRate < likeRate * 0.2) {
    const engagementTypeInsight: AIInsight = {
      id: Date.now() + 3,
      insight_type: "engagement_depth",
      insight_data: {
        like_rate: likeRate.toFixed(2),
        comment_rate: commentRate.toFixed(2),
        comment_to_like_ratio: (commentRate / likeRate).toFixed(2),
        engagement_depth: "shallow",
      },
      confidence_score: 0.75,
      performance_impact: 22.8,
      recommendations: [
        "Ask questions at the end of your posts to encourage comments",
        "Share controversial or thought-provoking opinions",
        "Respond to every comment to build community",
        "Create polls and ask for opinions to boost interaction",
      ],
      created_at: new Date().toISOString(),
    };
    dynamicInsights.push(engagementTypeInsight);
  }

  // Save insights to database if any were generated
  if (dynamicInsights.length > 0) {
    console.log(
      `Generated ${dynamicInsights.length} dynamic insights, saving to database...`
    );
    await saveInsightsToDatabase(userId, dynamicInsights);
  }

  return dynamicInsights;
}

export async function saveInsightsToDatabase(
  userId: string,
  insights: AIInsight[]
): Promise<boolean> {
  const supabase = createClient();

  try {
    // First, deactivate old insights
    const { error: deactivateError } = await supabase
      .from("ai_insights")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (deactivateError) {
      console.error("Error deactivating old insights:", deactivateError);
    }

    // Insert new insights
    const insightsToInsert = insights.map((insight) => ({
      user_id: userId,
      insight_type: insight.insight_type,
      insight_data: insight.insight_data,
      confidence_score: insight.confidence_score,
      performance_impact: insight.performance_impact,
      recommendations: insight.recommendations,
      is_active: true,
    }));

    const { error } = await supabase
      .from("ai_insights")
      .insert(insightsToInsert);

    if (error) {
      console.error("Error saving insights to database:", error);
      return false;
    }

    console.log(
      `Saved ${insights.length} insights to database for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error("Error in saveInsightsToDatabase:", error);
    return false;
  }
}

export async function generateAIInsightsWithOpenAI(
  userId: string,
  posts: any[],
  performanceData: PostPerformance[]
): Promise<AIInsight[]> {
  console.log("Generating AI insights with OpenAI for user:", userId);

  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log("OpenAI API key not found, falling back to dynamic insights");
    return generateDynamicInsights(userId, performanceData);
  }

  try {
    // Prepare data for OpenAI analysis
    const postsAnalysis = posts.slice(0, 10).map((post) => ({
      content_type: post.content_type,
      content_length: post.content?.length || 0,
      engagement_rate:
        performanceData.find((p) => p.post_id === post.id)?.engagement_rate ||
        0,
      impressions:
        performanceData.find((p) => p.post_id === post.id)?.impressions || 0,
      likes: performanceData.find((p) => p.post_id === post.id)?.likes || 0,
      comments:
        performanceData.find((p) => p.post_id === post.id)?.comments || 0,
      shares: performanceData.find((p) => p.post_id === post.id)?.shares || 0,
      content_snippet: post.content?.substring(0, 200) || "",
    }));

    const systemPrompt = `You are an AI analytics expert specializing in LinkedIn content performance analysis. 
    
    Analyze the provided post data and generate actionable insights for improving LinkedIn engagement. 
    
    Return your response as a JSON array of insights, each with this exact structure:
    {
      "insight_type": "content_optimization|posting_consistency|engagement_patterns|audience_behavior|content_strategy",
      "insight_data": {
        "key_findings": ["finding1", "finding2"],
        "metrics": {"metric1": "value1", "metric2": "value2"},
        "patterns": ["pattern1", "pattern2"]
      },
      "confidence_score": 0.85,
      "performance_impact": 18.5,
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
    }
    
    Focus on:
    - Content types that perform best
    - Optimal content length patterns
    - Engagement pattern analysis
    - Posting consistency insights
    - Audience behavior patterns
    
    Generate 3-5 different insights covering different aspects.`;

    const userPrompt = `Analyze this LinkedIn performance data:
    
    POSTS ANALYSIS:
    ${JSON.stringify(postsAnalysis, null, 2)}
    
    OVERALL METRICS:
    - Total posts analyzed: ${posts.length}
    - Average engagement rate: ${(
      performanceData.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) /
      performanceData.length
    ).toFixed(2)}%
    - Total impressions: ${performanceData.reduce(
      (sum, p) => sum + p.impressions,
      0
    )}
    - Total likes: ${performanceData.reduce((sum, p) => sum + p.likes, 0)}
    - Total comments: ${performanceData.reduce((sum, p) => sum + p.comments, 0)}
    - Total shares: ${performanceData.reduce((sum, p) => sum + p.shares, 0)}
    
    Generate insights that will help this user improve their LinkedIn content performance.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${
          process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
        }`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Parse the JSON response
    let parsedInsights;
    try {
      // Clean the response and parse JSON
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsedInsights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw content:", content);
      throw new Error("Failed to parse OpenAI response");
    }

    // Convert to our AIInsight format
    const aiInsights: AIInsight[] = parsedInsights.map(
      (insight: any, index: number) => ({
        id: Date.now() + index,
        insight_type: insight.insight_type,
        insight_data: insight.insight_data,
        confidence_score: insight.confidence_score,
        performance_impact: insight.performance_impact,
        recommendations: insight.recommendations,
        created_at: new Date().toISOString(),
      })
    );

    console.log(`Generated ${aiInsights.length} AI insights with OpenAI`);
    return aiInsights;
  } catch (error) {
    console.error("Error generating AI insights with OpenAI:", error);
    // Fallback to dynamic insights
    console.log("Falling back to dynamic insights generation");
    return generateDynamicInsights(userId, performanceData);
  }
}

export async function generateAndSaveInsights(
  userId: string
): Promise<AIInsight[]> {
  console.log("Starting insights generation for user:", userId);

  try {
    // Get user's posts and performance data
    const [posts, performanceData] = await Promise.all([
      getUserPosts(userId),
      getPostPerformanceData(userId),
    ]);

    console.log(
      `Found ${posts.length} posts and ${performanceData.length} performance records`
    );

    let insights: AIInsight[] = [];

    if (posts.length > 0 && performanceData.length > 0) {
      // Try OpenAI first, fallback to dynamic insights
      insights = await generateAIInsightsWithOpenAI(
        userId,
        posts,
        performanceData
      );
    } else if (performanceData.length > 0) {
      // Only performance data available, use dynamic insights
      insights = await generateDynamicInsights(userId, performanceData);
    } else {
      // No data available, create generic insights
      insights = await generateGenericInsights(userId);
    }

    // Save insights to database
    if (insights.length > 0) {
      const saved = await saveInsightsToDatabase(userId, insights);
      if (saved) {
        console.log("Successfully generated and saved insights");
        return insights;
      }
    }

    return insights;
  } catch (error) {
    console.error("Error in generateAndSaveInsights:", error);
    return [];
  }
}

async function getUserPosts(userId: string): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }

  return data || [];
}

async function generateGenericInsights(userId: string): Promise<AIInsight[]> {
  return [
    {
      id: Date.now(),
      insight_type: "getting_started",
      insight_data: {
        message: "Welcome to LinkedIn analytics!",
        next_steps: [
          "Create your first post",
          "Add performance metrics",
          "Build consistency",
        ],
      },
      confidence_score: 0.9,
      performance_impact: 25.0,
      recommendations: [
        "Start by creating 3-5 posts per week to build momentum",
        "Focus on sharing valuable insights from your expertise",
        "Add performance metrics to your posts to unlock AI insights",
        "Engage with your audience by asking questions in your posts",
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: Date.now() + 1,
      insight_type: "content_strategy",
      insight_data: {
        strategy: "Build authority through consistent valuable content",
        focus_areas: [
          "Industry insights",
          "Personal experiences",
          "Educational content",
        ],
      },
      confidence_score: 0.85,
      performance_impact: 30.0,
      recommendations: [
        "Share one personal story or lesson learned per week",
        "Create educational content that solves specific problems",
        "Comment thoughtfully on industry leaders' posts to increase visibility",
        "Use data and specific examples to support your points",
      ],
      created_at: new Date().toISOString(),
    },
  ];
}
