"use client";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  className = "",
}: ProgressIndicatorProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className={`w-full shadow-md ${className}`}>
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-yellow-400 h-2 transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
