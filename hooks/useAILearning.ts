import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface EditTrackingData {
  post_id?: number;
  original_content: string;
  edited_content: string;
  edit_type?: string;
  edit_significance?: "minor" | "moderate" | "major";
  generation_history_id?: number;
  edit_reason?: string;
  confidence_in_edit?: 1 | 2 | 3 | 4 | 5;
}

interface LearningInsights {
  total_edits: number;
  improvement_score: number;
  personalization_level: number;
  learning_velocity: number;
  confidence_score: number;
  last_calculated_at: string;
}

interface LearningTrends {
  improvement_trend: number;
  confidence_trend: number;
  edits_last_7_days: number;
  edits_previous_7_days: number;
}

interface LearningData {
  learning_insights: LearningInsights;
  recent_edits: any[];
  trends: LearningTrends;
  applied_improvements?: AppliedImprovement[];
  learning_patterns?: LearningPattern[];
}

interface AppliedImprovement {
  improvement_type: string;
  description: string;
  confidence: number;
  examples: string[];
  learned_from_edits: number;
  first_applied: string;
  effectiveness_score: number;
}

interface LearningPattern {
  pattern_type: string;
  frequency: number;
  consistency: number;
  last_seen: string;
  examples: string[];
}

export function useAILearning() {
  const { user } = useAuth();
  const [learningData, setLearningData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track an edit
  const trackEdit = async (editData: EditTrackingData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/posts/track-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to track edit");
      }

      const result = await response.json();

      // Refresh learning data after tracking an edit
      await fetchLearningData();

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to track edit";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch learning insights and data
  const fetchLearningData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/posts/track-edit", {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch learning data");
      }

      const data = await response.json();
      setLearningData(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch learning data";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load learning data when user changes
  useEffect(() => {
    if (user) {
      fetchLearningData();
    }
  }, [user]);

  // Helper to determine if AI is learning well
  const getAILearningStatus = () => {
    if (!learningData) return { status: "unknown", message: "Loading..." };

    const { learning_insights, trends } = learningData;
    const { total_edits, improvement_score, personalization_level } =
      learning_insights;
    const { improvement_trend } = trends;

    if (total_edits === 0) {
      return {
        status: "getting-started",
        message:
          "Start editing AI-generated content so I can learn your preferences!",
        color: "blue",
      };
    }

    if (total_edits < 5) {
      return {
        status: "learning",
        message: `Great start! I'm learning from your ${total_edits} edit${
          total_edits === 1 ? "" : "s"
        }. Keep editing to help me understand your style better.`,
        color: "yellow",
      };
    }

    if (improvement_trend > 10) {
      return {
        status: "improving",
        message:
          "Excellent! I'm getting better at matching your style. You're making fewer edits lately.",
        color: "green",
      };
    }

    if (personalization_level > 0.7) {
      return {
        status: "personalized",
        message:
          "I've learned your style well! My content should feel more natural to you now.",
        color: "green",
      };
    }

    if (improvement_trend < -10) {
      return {
        status: "adjusting",
        message:
          "I'm still learning your preferences. Your feedback helps me improve!",
        color: "orange",
      };
    }

    return {
      status: "learning",
      message:
        "I'm actively learning from your edits to create better content for you.",
      color: "blue",
    };
  };

  // Helper to get learning progress percentage
  const getLearningProgress = () => {
    if (!learningData) return 0;

    const { learning_insights } = learningData;
    const { total_edits, personalization_level, improvement_score } =
      learning_insights;

    // Calculate progress based on multiple factors
    const editsProgress = Math.min((total_edits / 20) * 30, 30); // Max 30% for edits
    const personalizationProgress = personalization_level * 40; // Max 40% for personalization
    const improvementProgress = improvement_score * 30; // Max 30% for improvement

    return Math.min(
      editsProgress + personalizationProgress + improvementProgress,
      100
    );
  };

  // Helper to get insights for display
  const getDisplayInsights = () => {
    if (!learningData) return [];

    const { learning_insights, trends } = learningData;
    const insights = [];

    if (learning_insights.total_edits > 0) {
      insights.push({
        title: "Total Edits Tracked",
        value: learning_insights.total_edits,
        description: "Number of times you've edited AI-generated content",
        icon: "✏️",
      });
    }

    if (trends.improvement_trend !== 0) {
      const isImproving = trends.improvement_trend > 0;
      insights.push({
        title: "AI Learning Trend",
        value: `${isImproving ? "+" : ""}${trends.improvement_trend.toFixed(
          1
        )}%`,
        description: isImproving
          ? "You're making fewer edits - AI is learning!"
          : "Still learning your preferences",
        icon: isImproving ? "📈" : "🔄",
        color: isImproving ? "green" : "blue",
      });
    }

    if (learning_insights.personalization_level > 0) {
      insights.push({
        title: "Personalization Level",
        value: `${(learning_insights.personalization_level * 100).toFixed(1)}%`,
        description: "How well AI understands your writing style",
        icon: "🎯",
      });
    }

    if (trends.edits_last_7_days >= 0) {
      insights.push({
        title: "Recent Activity",
        value: `${trends.edits_last_7_days} edits`,
        description: "Edits made in the last 7 days",
        icon: "📅",
      });
    }

    return insights;
  };

  // Helper to calculate applied improvements from edit data
  const getAppliedImprovements = (): AppliedImprovement[] => {
    if (!learningData || !learningData.recent_edits) return [];

    const improvements: AppliedImprovement[] = [];
    const editsByType: { [key: string]: any[] } = {};

    // Group edits by their learning signals
    learningData.recent_edits.forEach((edit) => {
      if (edit.learning_insights?.learning_signals) {
        edit.learning_insights.learning_signals.forEach((signal: string) => {
          const improvementType = categorizeImprovement(signal);
          if (!editsByType[improvementType]) {
            editsByType[improvementType] = [];
          }
          editsByType[improvementType].push({ edit, signal });
        });
      }
    });

    // Calculate applied improvements
    Object.entries(editsByType).forEach(([type, edits]) => {
      if (edits.length >= 2) {
        // Only show improvements with multiple examples
        const examples = edits.slice(0, 3).map((e) => e.signal);
        const confidence = Math.min(edits.length * 0.2, 1.0);
        const effectiveness = calculateEffectiveness(type, edits);

        improvements.push({
          improvement_type: type,
          description: getImprovementDescription(type),
          confidence,
          examples,
          learned_from_edits: edits.length,
          first_applied:
            edits[edits.length - 1].edit?.created_at ||
            edits[edits.length - 1].created_at,
          effectiveness_score: effectiveness,
        });
      }
    });

    return improvements.sort((a, b) => b.confidence - a.confidence);
  };

  // Helper to categorize improvements from learning signals
  const categorizeImprovement = (signal: string): string => {
    if (
      signal.includes("tone") ||
      signal.includes("professional") ||
      signal.includes("casual")
    ) {
      return "Tone Adjustment";
    }
    if (
      signal.includes("shorter") ||
      signal.includes("longer") ||
      signal.includes("length")
    ) {
      return "Content Length";
    }
    if (
      signal.includes("strategy") ||
      signal.includes("point") ||
      signal.includes("removed") ||
      signal.includes("added")
    ) {
      return "Content Structure";
    }
    if (
      signal.includes("emoji") ||
      signal.includes("formatting") ||
      signal.includes("bold")
    ) {
      return "Visual Formatting";
    }
    if (
      signal.includes("call-to-action") ||
      signal.includes("CTA") ||
      signal.includes("action")
    ) {
      return "Call-to-Action";
    }
    if (
      signal.includes("hook") ||
      signal.includes("opening") ||
      signal.includes("start")
    ) {
      return "Opening Hook";
    }
    return "Content Refinement";
  };

  // Helper to get improvement descriptions
  const getImprovementDescription = (type: string): string => {
    const descriptions: { [key: string]: string } = {
      "Tone Adjustment":
        "AI now better matches your preferred communication tone",
      "Content Length":
        "AI optimizes content length based on your editing patterns",
      "Content Structure":
        "AI learned your preferred content organization and flow",
      "Visual Formatting":
        "AI applies your preferred formatting and visual elements",
      "Call-to-Action": "AI creates CTAs that align with your engagement style",
      "Opening Hook":
        "AI crafts openings that match your attention-grabbing approach",
      "Content Refinement":
        "AI fine-tunes content based on your specific preferences",
    };
    return descriptions[type] || "AI has learned from your editing patterns";
  };

  // Helper to calculate improvement effectiveness
  const calculateEffectiveness = (type: string, edits: any[]): number => {
    // Simple effectiveness calculation based on edit frequency over time
    const recentEdits = edits.filter((e) => {
      const editDate = new Date(
        e.edit?.created_at || e.created_at || new Date()
      );
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return editDate > weekAgo;
    });

    // Higher effectiveness if fewer recent edits of same type (AI is improving)
    return Math.max(0.3, 1 - recentEdits.length / edits.length);
  };

  // Enhanced learning progress calculation
  const getEnhancedLearningProgress = () => {
    if (!learningData) return 0;

    const { learning_insights } = learningData;
    const { total_edits, personalization_level, improvement_score } =
      learning_insights;
    const appliedImprovements = getAppliedImprovements();

    // Base progress from edits and personalization
    const editsProgress = Math.min((total_edits / 15) * 25, 25); // Max 25% for edits
    const personalizationProgress = personalization_level * 35; // Max 35% for personalization
    const improvementProgress = improvement_score * 20; // Max 20% for improvement score

    // Bonus progress for applied improvements
    const improvementsBonus = Math.min(appliedImprovements.length * 4, 20); // Max 20% bonus

    return Math.min(
      editsProgress +
        personalizationProgress +
        improvementProgress +
        improvementsBonus,
      100
    );
  };

  // Helper to get learning patterns
  const getLearningPatterns = (): LearningPattern[] => {
    if (!learningData || !learningData.recent_edits) return [];

    const patterns: { [key: string]: any } = {};

    learningData.recent_edits.forEach((edit) => {
      if (edit.learning_insights?.learning_signals) {
        edit.learning_insights.learning_signals.forEach((signal: string) => {
          const patternType = categorizeImprovement(signal);
          if (!patterns[patternType]) {
            patterns[patternType] = {
              pattern_type: patternType,
              frequency: 0,
              examples: [],
              dates: [],
            };
          }
          patterns[patternType].frequency++;
          patterns[patternType].examples.push(signal);
          patterns[patternType].dates.push(edit.created_at);
        });
      }
    });

    return Object.values(patterns)
      .map((pattern: any) => ({
        ...pattern,
        consistency: calculateConsistency(pattern.dates),
        last_seen: pattern.dates[0], // Most recent
        examples: pattern.examples.slice(0, 2), // Top 2 examples
      }))
      .sort((a, b) => b.frequency - a.frequency);
  };

  // Helper to calculate pattern consistency
  const calculateConsistency = (dates: string[]): number => {
    if (dates.length < 2) return 0;

    const sortedDates = dates
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    const daysBetween = sortedDates
      .map((date, i) => {
        if (i === 0) return 0;
        const prevDate = sortedDates[i - 1];
        if (!prevDate) return 0;
        return (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter((days) => days > 0);

    if (daysBetween.length === 0) return 1;

    const avgDays = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;
    return Math.max(0, 1 - avgDays / 30); // More consistent if edits are closer together
  };

  return {
    learningData,
    loading,
    error,
    trackEdit,
    fetchLearningData,
    getAILearningStatus,
    getLearningProgress,
    getDisplayInsights,
    getAppliedImprovements,
    getEnhancedLearningProgress,
    getLearningPatterns,
  };
}
