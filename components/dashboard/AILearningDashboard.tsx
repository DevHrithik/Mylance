"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAILearning } from "@/hooks/useAILearning";
import {
  Brain,
  TrendingUp,
  Target,
  Calendar,
  Edit3,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface AILearningDashboardProps {
  className?: string;
}

export function AILearningDashboard({ className }: AILearningDashboardProps) {
  const {
    learningData,
    loading,
    error,
    getAILearningStatus,
    getLearningProgress,
    getDisplayInsights,
    getAppliedImprovements,
    getEnhancedLearningProgress,
    getLearningPatterns,
  } = useAILearning();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Failed to load AI learning data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const learningStatus = getAILearningStatus();
  const progress = getEnhancedLearningProgress();
  const insights = getDisplayInsights();
  const appliedImprovements = getAppliedImprovements();
  const learningPatterns = getLearningPatterns();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Learning Status Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`
                    ${
                      learningStatus.color === "green"
                        ? "border-green-500 text-green-700 bg-green-50"
                        : ""
                    }
                    ${
                      learningStatus.color === "blue"
                        ? "border-blue-500 text-blue-700 bg-blue-50"
                        : ""
                    }
                    ${
                      learningStatus.color === "yellow"
                        ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                        : ""
                    }
                    ${
                      learningStatus.color === "orange"
                        ? "border-orange-500 text-orange-700 bg-orange-50"
                        : ""
                    }
                  `}
                >
                  {learningStatus.status.replace("-", " ")}
                </Badge>
                <span className="text-sm text-gray-500">
                  {progress.toFixed(0)}% Complete
                </span>
              </div>
              <p className="text-sm text-gray-600 max-w-md">
                {learningStatus.message}
              </p>
            </div>
            {learningStatus.color === "green" && (
              <CheckCircle className="h-8 w-8 text-green-500" />
            )}
            {learningStatus.color === "blue" && (
              <Clock className="h-8 w-8 text-blue-500" />
            )}
            {learningStatus.color === "yellow" && (
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Learning Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{insight.icon}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      insight.color === "green"
                        ? "border-green-500 text-green-700"
                        : "border-gray-300"
                    }`}
                  >
                    {insight.title}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {insight.value}
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">
                    {insight.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Improvements Applied */}
      {appliedImprovements.length > 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Improvements Applied
            </CardTitle>
            <p className="text-sm text-gray-600">
              AI adaptations based on your editing patterns
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {appliedImprovements.slice(0, 4).map((improvement, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/60 rounded-lg border border-green-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {improvement.improvement_type}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-700 bg-green-50"
                      >
                        {(improvement.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-blue-500 text-blue-700 bg-blue-50"
                      >
                        {improvement.learned_from_edits} edits
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {improvement.description}
                  </p>
                  <div className="space-y-1">
                    {improvement.examples.slice(0, 2).map((example, i) => (
                      <p key={i} className="text-xs text-gray-500 italic">
                        &apos;• {example}&apos;
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Effectiveness:
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{
                          width: `${improvement.effectiveness_score * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {(improvement.effectiveness_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Patterns */}
      {learningPatterns.length > 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 opacity-50" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              Learning Patterns
            </CardTitle>
            <p className="text-sm text-gray-600">
              Emerging patterns from your edits
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              {learningPatterns.slice(0, 5).map((pattern, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/60 rounded-lg border border-purple-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {pattern.pattern_type}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-purple-500 text-purple-700 bg-purple-50 text-xs"
                      >
                        {pattern.frequency}x
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-purple-500"
                          style={{ opacity: pattern.consistency }}
                        />
                        <span className="text-xs text-gray-500">
                          {(pattern.consistency * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {pattern.examples.map((example, i) => (
                      <p key={i} className="text-xs text-gray-500">
                        • {example}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      {learningData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last 7 days</span>
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {learningData.trends.edits_last_7_days} edits
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Previous 7 days</span>
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {learningData.trends.edits_previous_7_days} edits
                    </span>
                  </div>
                </div>

                {learningData.trends.improvement_trend !== 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        className={`h-4 w-4 ${
                          learningData.trends.improvement_trend > 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <span className="text-sm">
                        {learningData.trends.improvement_trend > 0
                          ? "Improving"
                          : "Learning"}
                        :{" "}
                        <span
                          className={`font-medium ${
                            learningData.trends.improvement_trend > 0
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {learningData.trends.improvement_trend > 0 ? "+" : ""}
                          {learningData.trends.improvement_trend.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Edits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Recent Edits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {learningData.recent_edits
                  .slice(0, 5)
                  .map((edit: any, index: number) => (
                    <div
                      key={edit.id}
                      className="pb-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="space-y-1">
                        {edit.learning_insights?.learning_signals?.length >
                        0 ? (
                          edit.learning_insights.learning_signals
                            .slice(0, 2)
                            .map((signal: string, i: number) => (
                              <p
                                key={i}
                                className="text-sm text-gray-700 leading-relaxed"
                              >
                                • {signal}
                              </p>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            General content edit
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(edit.created_at).toLocaleDateString()} at{" "}
                          {new Date(edit.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                {learningData.recent_edits.length === 0 && (
                  <p className="text-sm text-gray-500">No recent edits</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Learning Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Learning Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Edits</span>
                    <span className="font-medium">
                      {learningData.learning_insights.total_edits}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Personalization Level</span>
                    <span className="font-medium">
                      {(
                        learningData.learning_insights.personalization_level *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Improvement Score</span>
                    <span className="font-medium">
                      {(
                        learningData.learning_insights.improvement_score * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confidence Score</span>
                    <span className="font-medium">
                      {(
                        learningData.learning_insights.confidence_score * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>

                {learningData.learning_insights.last_calculated_at && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Last updated:{" "}
                      {new Date(
                        learningData.learning_insights.last_calculated_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Getting Started Message */}
      {(!learningData || learningData.learning_insights.total_edits === 0) && (
        <Card className="border-dashed border-2 border-blue-200">
          <CardContent className="p-6 text-center">
            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Start Your AI Learning Journey
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Generate some AI content and start editing it! Every edit you make
              helps the AI learn your writing style and preferences.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Better Personalization</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Fewer Edits Needed</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Higher Quality Content</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
