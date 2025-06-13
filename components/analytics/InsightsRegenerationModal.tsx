"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Zap,
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

interface InsightsRegenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
}

const GENERATION_STEPS = [
  {
    id: 1,
    title: "Analyzing Your Content",
    description: "Reviewing your posts and performance data...",
    icon: BarChart3,
    duration: 2000,
  },
  {
    id: 2,
    title: "AI Pattern Recognition",
    description: "Identifying engagement patterns and trends...",
    icon: Brain,
    duration: 3000,
  },
  {
    id: 3,
    title: "Generating Insights",
    description: "Creating personalized recommendations...",
    icon: Target,
    duration: 2500,
  },
  {
    id: 4,
    title: "Optimizing Strategies",
    description: "Finalizing actionable insights for better performance...",
    icon: TrendingUp,
    duration: 1500,
  },
];

export function InsightsRegenerationModal({
  open,
  onOpenChange,
  isGenerating,
}: InsightsRegenerationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isGenerating) {
      // If generation stopped, complete the progress
      if (progress > 0 && progress < 100) {
        setProgress(100);
        setCompletedSteps([0, 1, 2, 3]); // Mark all steps as completed
        setCurrentStep(GENERATION_STEPS.length); // Set to completion state
      } else {
        // Reset everything when not generating and no progress
        setCurrentStep(0);
        setProgress(0);
        setCompletedSteps([]);
      }
      return;
    }

    // Start the step progression
    let stepIndex = 0;
    const totalSteps = GENERATION_STEPS.length;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 3, 90); // Cap at 90% until API completion
        return newProgress;
      });
    }, 150);

    const stepProgression = () => {
      if (stepIndex < totalSteps) {
        setCurrentStep(stepIndex);

        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, stepIndex]);
          stepIndex++;
          stepProgression();
        }, GENERATION_STEPS[stepIndex]?.duration || 0);
      }
    };

    stepProgression();

    return () => {
      clearInterval(progressInterval);
    };
  }, [isGenerating, progress]);

  useEffect(() => {
    if (!isGenerating && progress === 100) {
      // Auto-close modal after completion
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    }
  }, [isGenerating, progress, onOpenChange]);

  const getCurrentStepIcon = () => {
    if (currentStep < GENERATION_STEPS.length) {
      const IconComponent = GENERATION_STEPS[currentStep]?.icon;
      return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
    }
    return <CheckCircle className="h-6 w-6 text-green-600" />;
  };

  const getCurrentStepInfo = () => {
    if (currentStep < GENERATION_STEPS.length) {
      return GENERATION_STEPS[currentStep];
    }
    return {
      title: "Insights Generated!",
      description: "Your personalized AI insights are ready to view.",
    };
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Prevent closing during generation unless user explicitly wants to
        if (isGenerating && !newOpen) {
          // Could add a confirmation dialog here if needed
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside during generation
          if (isGenerating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Insights Generation
          </DialogTitle>
          <DialogDescription>
            Our AI is analyzing your content to generate personalized insights
            and recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step */}
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 shadow-sm">
            <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm border">
              <div
                className={`transition-all duration-300 ${
                  isGenerating ? "animate-pulse" : ""
                }`}
              >
                {getCurrentStepIcon()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                {getCurrentStepInfo()?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {getCurrentStepInfo()?.description}
              </p>
            </div>
            {isGenerating && (
              <div className="flex-shrink-0">
                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Processing Steps:
            </h4>
            <div className="space-y-2">
              {GENERATION_STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(index);
                const isCurrent = currentStep === index && isGenerating;
                const isPending = index > currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      isCompleted
                        ? "bg-green-50 border border-green-200"
                        : isCurrent
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? "text-green-800 font-medium"
                          : isCurrent
                          ? "text-blue-800 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <div className="ml-auto">
                        <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              💡 Pro Tip
            </h4>
            <p className="text-sm text-yellow-700">
              The more performance data you have, the more accurate and
              personalized your AI insights will be. Consider adding analytics
              for your recent posts!
            </p>
          </div>

          {/* Completion Message */}
          {!isGenerating && progress === 100 && (
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
              <div className="animate-bounce">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              </div>
              <h3 className="font-semibold text-green-800 mb-1">
                🎉 Insights Generated Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Your personalized AI insights are now available in the
                dashboard.
              </p>
              <div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full inline-block">
                ✨ Ready to boost your LinkedIn performance!
              </div>
            </div>
          )}

          {/* Fun Facts */}
          {isGenerating && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-200 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">
                🤖 Did you know?
              </h4>
              <p className="text-sm text-indigo-700">
                Our AI analyzes over 15 different engagement metrics and content
                patterns to provide you with actionable insights that can
                improve your LinkedIn performance by up to 40%!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
