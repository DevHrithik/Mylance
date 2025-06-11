"use client";

import { ProgressIndicator } from "./ProgressIndicator";

interface OnboardingStepWrapperProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export function OnboardingStepWrapper({
  currentStep,
  totalSteps,
  children,
}: OnboardingStepWrapperProps) {
  const backgroundShapes = (
    <>
      <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-400 rounded-full opacity-80 -translate-x-32 -translate-y-32"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-80 translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full opacity-80 -translate-x-32 translate-y-32"></div>
    </>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Progress Bar - Full width at top */}
      <div className="relative z-30 w-full">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>

      {/* Background shapes */}
      <div className="absolute inset-0">{backgroundShapes}</div>

      {/* Content */}
      <div className="relative z-20 flex-1 flex items-center justify-center p-6 min-h-screen">
        {children}
      </div>
    </div>
  );
}
