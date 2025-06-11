"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  Edit3,
  Target,
  CheckCircle,
  Clock,
  BarChart3,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { sampleDataSeeder } from "@/lib/utils/sample-data-seeder";
import { toast } from "sonner";

interface EditStats {
  total_edits: number;
  processed_edits: number;
  tone_adjustments: number;
  length_changes: number;
  structure_changes: number;
  word_choice_edits: number;
  style_improvements: number;
  minor_edits: number;
  moderate_edits: number;
  major_edits: number;
  avg_character_diff: number;
  edits_last_7_days: number;
  edits_last_30_days: number;
  last_learning_applied: string | null;
}

interface RecentEdit {
  id: number;
  edit_type: string;
  edit_significance: string;
  character_diff: number;
  processed_for_learning: boolean;
  learning_insights: any;
  created_at: string;
  original_content: string;
  edited_content: string;
}

interface LearningInsight {
  category: string;
  insight: string;
  confidence: number;
  examples: string[];
  improvement: string;
}

export default function AILearningProgress() {
  const { user } = useSimpleAuth();
  const [editStats, setEditStats] = useState<EditStats | null>(null);
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchLearningData();
    }
  }, [user]);

  const fetchLearningData = async () => {
    try {
      // Get user learning stats
      const { data: stats } = await supabase
        .from("user_learning_insights")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      setEditStats(stats);

      // Get recent edits
      const { data: edits } = await supabase
        .from("content_edits")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentEdits(edits || []);

      // Generate learning insights based on user preferences and edit patterns
      generateLearningInsights(stats, edits || []);
    } catch (error) {
      console.error("Error fetching learning data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningInsights = (stats: EditStats, edits: RecentEdit[]) => {
    const insights: LearningInsight[] = [];

    // Tone preferences
    if (stats?.tone_adjustments > 0) {
      insights.push({
        category: "Tone Preferences",
        insight: `You frequently adjust tone in your content (${stats.tone_adjustments} times)`,
        confidence: Math.min(90, 50 + stats.tone_adjustments * 10),
        examples: [
          "Making content more conversational",
          "Adding personal touches",
          "Adjusting formality level",
        ],
        improvement: "AI now generates content closer to your preferred tone",
      });
    }

    // Length preferences
    if (stats?.avg_character_diff && Math.abs(stats.avg_character_diff) > 50) {
      const trend = stats.avg_character_diff > 0 ? "expand" : "shorten";
      insights.push({
        category: "Content Length",
        insight: `You tend to ${trend} AI-generated content by ${Math.abs(
          Math.round(stats.avg_character_diff)
        )} characters on average`,
        confidence: 85,
        examples:
          trend === "expand"
            ? [
                "Adding more details",
                "Including examples",
                "Elaborating on points",
              ]
            : [
                "Removing fluff",
                "Being more concise",
                "Focusing on key points",
              ],
        improvement: `AI now generates ${
          trend === "expand" ? "more detailed" : "more concise"
        } content by default`,
      });
    }

    // Word choice patterns
    if (stats?.word_choice_edits > 2) {
      insights.push({
        category: "Word Choice",
        insight: `You've made ${stats.word_choice_edits} word choice improvements`,
        confidence: 75,
        examples: [
          "Replacing jargon with simpler terms",
          "Using industry-specific language",
          "Improving clarity",
        ],
        improvement: "AI vocabulary is adapting to your preferred style",
      });
    }

    // Structure improvements
    if (stats?.structure_changes > 1) {
      insights.push({
        category: "Content Structure",
        insight: `You've restructured content ${stats.structure_changes} times`,
        confidence: 80,
        examples: [
          "Reordering bullet points",
          "Changing paragraph flow",
          "Improving readability",
        ],
        improvement: "AI learns your preferred content organization",
      });
    }

    setLearningInsights(insights);
  };

  const handleSeedSampleData = async () => {
    if (!user) return;

    try {
      toast.info("Adding sample data to demonstrate AI learning...");

      await sampleDataSeeder.seedSampleEdits(user.id);
      await sampleDataSeeder.seedSampleGenerationHistory(user.id);

      // Refetch data to show the new sample data
      await fetchLearningData();

      toast.success(
        "Sample data added! This shows how your edits help the AI learn your style."
      );
    } catch (error) {
      console.error("Error seeding sample data:", error);
      toast.error("Failed to add sample data");
    }
  };

  const getEditTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tone_adjustment: "bg-blue-100 text-blue-800",
      length_change: "bg-green-100 text-green-800",
      structure_change: "bg-purple-100 text-purple-800",
      word_choice: "bg-yellow-100 text-yellow-800",
      style_improvement: "bg-pink-100 text-pink-800",
      factual_correction: "bg-red-100 text-red-800",
      cta_change: "bg-indigo-100 text-indigo-800",
      hook_improvement: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getEditTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tone_adjustment: "Tone",
      length_change: "Length",
      structure_change: "Structure",
      word_choice: "Word Choice",
      style_improvement: "Style",
      factual_correction: "Facts",
      cta_change: "Call to Action",
      hook_improvement: "Hook",
    };
    return labels[type] || type;
  };

  const calculateLearningProgress = () => {
    if (!editStats) return 0;
    const totalInteractions = editStats.total_edits;
    const progressRate = Math.min(100, (totalInteractions / 20) * 100); // 20 edits = 100% progress
    return progressRate;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const learningProgress = calculateLearningProgress();

  return (
    <div className="space-y-6">
      {/* Main Learning Progress Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-xl">AI Learning Progress</CardTitle>
              <CardDescription>
                See how your edits are teaching the AI your unique style
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {editStats?.total_edits || 0}
              </div>
              <div className="text-sm text-gray-600">Total Edits Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {editStats?.processed_edits || 0}
              </div>
              <div className="text-sm text-gray-600">Improvements Applied</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(learningProgress)}%
              </div>
              <div className="text-sm text-gray-600">Learning Progress</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Personalization Level</span>
              <span className="font-medium">
                {Math.round(learningProgress)}%
              </span>
            </div>
            <Progress value={learningProgress} className="h-3" />
            <p className="text-xs text-gray-600">
              {learningProgress < 25 &&
                "Just getting started! Keep editing to teach the AI your style."}
              {learningProgress >= 25 &&
                learningProgress < 50 &&
                "Good progress! The AI is learning your preferences."}
              {learningProgress >= 50 &&
                learningProgress < 75 &&
                "Excellent! The AI understands your style well."}
              {learningProgress >= 75 &&
                "Amazing! The AI is highly personalized to your style."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="edits">Recent Edits</TabsTrigger>
          <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {learningInsights.length > 0 ? (
            learningInsights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {insight.insight}
                      </p>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Improvement Applied
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          {insight.improvement}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-medium text-gray-500">
                          Examples:
                        </span>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {insight.examples.map((example, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Start Teaching the AI
                </h3>
                <p className="text-gray-600 mb-4">
                  Make some edits to AI-generated content to see learning
                  insights here
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSeedSampleData}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    See Demo Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edits" className="space-y-4">
          {recentEdits.length > 0 ? (
            recentEdits.map((edit) => (
              <Card key={edit.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getEditTypeColor(edit.edit_type)}>
                        {getEditTypeLabel(edit.edit_type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {edit.edit_significance}
                      </Badge>
                      {edit.processed_for_learning && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Learned
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(edit.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">
                        Original (AI)
                      </h5>
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-gray-600">
                        {edit.original_content.substring(0, 100)}...
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">
                        Your Edit
                      </h5>
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-gray-600">
                        {edit.edited_content.substring(0, 100)}...
                      </div>
                    </div>
                  </div>

                  {edit.character_diff !== 0 && (
                    <div className="mt-3 text-xs text-gray-500">
                      Character change: {edit.character_diff > 0 ? "+" : ""}
                      {edit.character_diff}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  No Edits Yet
                </h3>
                <p className="text-gray-600">
                  Your edit history will appear here once you start improving
                  AI-generated content
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Edit Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "Tone Adjustments",
                    value: editStats?.tone_adjustments || 0,
                  },
                  {
                    label: "Word Choice",
                    value: editStats?.word_choice_edits || 0,
                  },
                  {
                    label: "Style Improvements",
                    value: editStats?.style_improvements || 0,
                  },
                  {
                    label: "Length Changes",
                    value: editStats?.length_changes || 0,
                  },
                  {
                    label: "Structure Changes",
                    value: editStats?.structure_changes || 0,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last 7 days</span>
                  <span className="font-semibold">
                    {editStats?.edits_last_7_days || 0} edits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last 30 days</span>
                  <span className="font-semibold">
                    {editStats?.edits_last_30_days || 0} edits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Avg. length change
                  </span>
                  <span className="font-semibold">
                    {editStats?.avg_character_diff
                      ? `${Math.round(editStats.avg_character_diff)} chars`
                      : "N/A"}
                  </span>
                </div>
                {editStats?.last_learning_applied && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Last learning update
                    </span>
                    <span className="font-semibold text-green-600">
                      {new Date(
                        editStats.last_learning_applied
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
