"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import { ProgressIndicator } from "./ProgressIndicator";

interface OnboardingData {
  email: string;
  linkedinUrl: string;
  firstName: string;
  businessType: string;
  businessSize: string;
  businessStage: string;
  linkedinImportance: string;
  investmentWillingness: string;
  postingMindset: string;
  currentPostingFrequency: string;
  clientAttractionMethods: string[];
  idealTargetClient: string;
  clientPainPoints: string;
  uniqueValueProposition: string;
  proofPoints: string;
  heardAboutMylance: string;
  heardAboutMylanceOther?: string;
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    email: "",
    linkedinUrl: "",
    firstName: "",
    businessType: "",
    businessSize: "",
    businessStage: "",
    linkedinImportance: "",
    investmentWillingness: "",
    postingMindset: "",
    currentPostingFrequency: "",
    clientAttractionMethods: [],
    idealTargetClient: "",
    clientPainPoints: "",
    uniqueValueProposition: "",
    proofPoints: "",
    heardAboutMylance: "",
    heardAboutMylanceOther: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Initialize user email from auth and load existing onboarding data
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (user && user.email && !userError) {
          // First check if user has already completed onboarding
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed, is_admin")
            .eq("id", user.id)
            .single();

          if (profile?.onboarding_completed) {
            console.log(
              "User has already completed onboarding, redirecting..."
            );
            if (profile.is_admin) {
              window.location.href = "/admin";
            } else {
              window.location.href = "/product";
            }
            return;
          }

          setData((prev) => ({ ...prev, email: user.email! }));

          // Try to load existing onboarding data
          const { data: existingData, error: progressError } = await supabase
            .from("onboarding_progress")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (progressError) {
            console.error("Error loading onboarding progress:", progressError);
          } else if (existingData && existingData.data) {
            setData({ ...existingData.data });
            // Resume from the last step they were on
            if (existingData.current_step) {
              setCurrentStep(existingData.current_step);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    initializeUserData();
  }, [supabase]);

  // Save progress to database after each step
  const saveProgress = async (
    stepData: Partial<OnboardingData>,
    step: number
  ) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const updatedData = { ...data, ...stepData };

      const { error: upsertError } = await supabase
        .from("onboarding_progress")
        .upsert(
          {
            user_id: user.id,
            current_step: step,
            data: updatedData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (upsertError) {
        console.error("Error saving progress:", upsertError);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      // Don't block the user flow if saving fails
    }
  };

  const handleNext = async () => {
    if (isLoading) return;

    console.log(`Step ${currentStep}: Moving to next step`);

    // Handle admin user creation for step 3
    if (currentStep === 3 && data.firstName.toLowerCase() === "admin") {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log("Creating admin user...");
        const { error: adminError } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", user.id);

        if (adminError) {
          console.error("Admin creation error:", adminError);
          // Don't throw error if admin entry already exists
          if (
            !adminError.message.includes("duplicate") &&
            !adminError.message.includes("unique")
          ) {
            throw new Error(
              `Failed to create admin entry: ${adminError.message}`
            );
          }
          console.log("Admin entry already exists, continuing...");
        }

        console.log("Admin creation successful, redirecting to /admin");

        // Small delay to ensure state updates are complete
        setTimeout(() => {
          router.push("/admin");
        }, 100);
        return;
      } catch (err: any) {
        console.error("Admin creation error:", err);
        setError(err.message || "Failed to create admin user");
        setIsLoading(false);
        return;
      }
    }

    // After step 16, save onboarding data and redirect to product page
    if (currentStep === 16) {
      setIsLoading(true);
      console.log("Step 16: Completing onboarding...");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(
          "Step 16: Saving onboarding data with onboarding_completed = true..."
        );

        // Update user profile with onboarding data and mark as completed
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          email: data.email,
          first_name: data.firstName,
          linkedin_url: data.linkedinUrl,
          business_type: data.businessType,
          business_size: data.businessSize,
          business_stage: data.businessStage,
          linkedin_importance: data.linkedinImportance,
          investment_willingness: data.investmentWillingness,
          posting_mindset: data.postingMindset,
          current_posting_frequency: data.currentPostingFrequency,
          client_attraction_methods: data.clientAttractionMethods,
          ideal_target_client: data.idealTargetClient,
          client_pain_points: data.clientPainPoints,
          unique_value_proposition: data.uniqueValueProposition,
          proof_points: data.proofPoints,
          heard_about_mylance: data.heardAboutMylance,
          heard_about_mylance_other: data.heardAboutMylanceOther,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw new Error(`Failed to save profile: ${profileError.message}`);
        }

        console.log("✅ Profile updated with onboarding_completed = true");

        // Clear middleware cache to prevent stale data
        try {
          await fetch("/api/clear-cache", { method: "POST" });
          console.log("✅ Middleware cache cleared");
        } catch (e) {
          console.log("Cache clear failed, continuing...");
        }

        // Clear the onboarding progress since it's complete
        console.log("Step 16: Clearing onboarding progress...");
        await supabase
          .from("onboarding_progress")
          .delete()
          .eq("user_id", user.id);

        console.log(
          "✅ Onboarding completed! Force redirecting to product page..."
        );

        // Force hard redirect to bypass middleware cache
        window.location.href = "/product";
        return;
      } catch (err: any) {
        console.error("Failed to complete onboarding:", err);
        setError(
          err.message || "Failed to save your information. Please try again."
        );
        setIsLoading(false);
        return;
      }
    }

    // Save progress before moving to next step
    await saveProgress({}, currentStep + 1);

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field: keyof OnboardingData, value: string) => {
    const currentValues = data[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    updateData(field, newValues);
  };

  const getValidationError = () => {
    switch (currentStep) {
      case 1:
        if (!data.email) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          return "Please enter a valid email address";
        break;
      case 2:
        if (!data.linkedinUrl) return "LinkedIn URL is required";
        if (!data.linkedinUrl.includes("linkedin.com/in/"))
          return "Please enter a valid LinkedIn profile URL";
        break;
      default:
        return null;
    }
    return null;
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      case 2:
        return (
          data.linkedinUrl && data.linkedinUrl.includes("linkedin.com/in/")
        );
      case 3:
        return data.firstName.trim().length > 0;
      case 4:
        return data.businessType.trim().length > 0;
      case 5:
        return data.businessSize.trim().length > 0;
      case 6:
        return data.businessStage.trim().length > 0;
      case 7:
        return data.linkedinImportance.trim().length > 0;
      case 8:
        return data.investmentWillingness.trim().length > 0;
      case 9:
        return data.postingMindset.trim().length > 0;
      case 10:
        return data.currentPostingFrequency.trim().length > 0;
      case 11:
        return data.clientAttractionMethods.length > 0;
      case 12:
        return data.idealTargetClient.trim().length > 0;
      case 13:
        return data.clientPainPoints.trim().length > 0;
      case 14:
        return data.uniqueValueProposition.trim().length > 0;
      case 15:
        return data.proofPoints.trim().length > 0;
      case 16:
        const isOtherSelected =
          data.heardAboutMylance === "Other (please specify)";
        return (
          data.heardAboutMylance.trim().length > 0 &&
          (!isOtherSelected ||
            (data.heardAboutMylanceOther?.trim().length || 0) > 0)
        );
      default:
        return true;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && validateStep()) {
      handleNext();
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      // Allow line breaks with Shift+Enter
      return;
    } else if (e.key === "Enter" && validateStep()) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderStep = () => {
    const commonClasses =
      "min-h-screen flex items-center justify-center p-6 relative overflow-hidden";

    const backgroundShapes = (
      <>
        <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-400 rounded-full opacity-80 -translate-x-32 -translate-y-32"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-80 translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full opacity-80 -translate-x-32 translate-y-32"></div>
      </>
    );

    // Back button component (like the design shown)
    const BackButton = () =>
      currentStep > 1 && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
      );

    switch (currentStep) {
      case 1:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-2xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">1 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What&apos;s the best email for you to receive leads and
                  communications from Mylance?
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  We respect your privacy and will use your email only to send
                  you valuable updates and information
                </p>
              </div>

              <div className="mb-8">
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateData("email", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="hrithikroy@buildmvpfa.st"
                  className="text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none text-center placeholder:text-gray-400"
                />
                {data.email && !validateStep() && (
                  <p className="text-red-500 text-sm mt-2">
                    {getValidationError()}
                  </p>
                )}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-2xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">2 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  LinkedIn Profile URL:
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  So we can capture your professional headline, experience, and
                  other relevant details to build a strategy for you. Make sure
                  it follows the format https://www.linkedin.com/in/
                </p>
              </div>

              <div className="mb-8">
                <Input
                  type="url"
                  value={data.linkedinUrl}
                  onChange={(e) => updateData("linkedinUrl", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://"
                  className="text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none text-center placeholder:text-gray-400"
                />
                {data.linkedinUrl && !validateStep() && (
                  <p className="text-red-500 text-sm mt-2">
                    {getValidationError()}
                  </p>
                )}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-2xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">3 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What&apos;s your first name?
                </h1>
              </div>

              <div className="mb-8">
                <Input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => updateData("firstName", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer here..."
                  className="text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none text-center placeholder:text-gray-400"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={!validateStep() || isLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {data.firstName.toLowerCase() === "admin"
                      ? "Creating admin..."
                      : "Loading..."}
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 4:
        const businessTypes = [
          {
            id: "A",
            text: "I'm an independent consultant or fractional executive",
          },
          {
            id: "B",
            text: "I run an agency (e.g., marketing agency or digital agency)",
          },
          {
            id: "C",
            text: "I'm creator (e.g., sell courses, influencer, etc.)",
          },
          {
            id: "D",
            text: "I run an established small or medium sized business",
          },
          { id: "E", text: "I run a start-up" },
          { id: "F", text: "Other" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">4 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What kind of business do you have? (Select the option that
                  best describes your business type and size.)
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {businessTypes.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateData("businessType", option.text)}
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.businessType === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 5:
        const businessSizes = [
          { id: "A", text: "It's just me!" },
          { id: "B", text: "2-10 employees" },
          { id: "C", text: "11-50" },
          { id: "D", text: "51-250" },
          { id: "E", text: "250+" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-2xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">5 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What&apos;s the size of your business?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {businessSizes.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateData("businessSize", option.text)}
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.businessSize === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 6:
        const businessStages = [
          {
            id: "A",
            text: "Just getting started - looking for my first client / customers",
          },
          { id: "B", text: "1-3 months across 1-3 clients / customers" },
          { id: "C", text: "3-12 months across 3-5 clients / customers" },
          { id: "D", text: "1-2 years with 10+ clients / customers" },
          {
            id: "E",
            text: "3+ years with a consistent client / customer base",
          },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">6 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How far along is your business?
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  Select what most closely represents your business
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {businessStages.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateData("businessStage", option.text)}
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.businessStage === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 7:
        const importanceOptions = [
          { id: "A", text: "Not at all important" },
          { id: "B", text: "Somewhat important" },
          { id: "C", text: "Very important" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">7 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How important do you believe LinkedIn content is to your
                  marketing / business development efforts?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {importanceOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      updateData("linkedinImportance", option.text)
                    }
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.linkedinImportance === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 8:
        const investmentOptions = [
          {
            id: "A",
            text: "Not at all willing: I don't want to invest in marketing for my business.",
          },
          {
            id: "B",
            text: "Somewhat willing: I'd consider a small investment (up to $100 per month) if I see clear value.",
          },
          {
            id: "C",
            text: "Moderately willing: I'm open to investing a moderate amount ($100-$500 per month).",
          },
          {
            id: "D",
            text: "Very willing: I'm eager to invest and understand growing my business takes a real investment ($500 - $1,500 per month)",
          },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-4xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">8 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How willing are you to invest in marketing for your business?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {investmentOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      updateData("investmentWillingness", option.text)
                    }
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.investmentWillingness === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 9:
        const mindsetOptions = [
          {
            id: "A",
            text: "I love posting and do it regularly – just want help making it more effective.",
          },
          {
            id: "B",
            text: "I believe in it but struggle to post consistently or know what to say.",
          },
          {
            id: "C",
            text: "I know I should be posting, but I haven't really started yet.",
          },
          { id: "D", text: "I'm skeptical about posting on LinkedIn." },
          { id: "E", text: "I'm not interested in posting content at all." },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-4xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">9 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What&apos;s your current mindset around posting content on
                  LinkedIn?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {mindsetOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateData("postingMindset", option.text)}
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.postingMindset === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 10:
        const frequencyOptions = [
          { id: "A", text: "Never" },
          { id: "B", text: "A few times per month" },
          { id: "C", text: "Multiple few times per week" },
          { id: "D", text: "Daily" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-2xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">10 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How often do you post on LinkedIn right now?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      updateData("currentPostingFrequency", option.text)
                    }
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.currentPostingFrequency === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 11:
        const attractionMethods = [
          { id: "A", text: "I don't have any clients" },
          { id: "B", text: "Personal network, word of mouth, and referrals" },
          {
            id: "C",
            text: "Online content (LinkedIn, Instagram, X, YouTube, etc.)",
          },
          { id: "D", text: "Outbound outreach (LinkedIn, email, etc.)" },
          { id: "E", text: "Online communities or marketplaces" },
          { id: "F", text: "Other" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">11 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How do you currently attract clients / customers?
                </h1>
                <p className="text-gray-600 italic text-base mb-4">
                  Select all that apply
                </p>
                <p className="text-teal-600 text-base mb-8">
                  Choose as many as you like
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {attractionMethods.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      toggleMultiSelect("clientAttractionMethods", option.text)
                    }
                    className={`w-full p-5 border-2 rounded-lg text-left transition-colors text-lg cursor-pointer ${
                      data.clientAttractionMethods.includes(option.text)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 12:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">12 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  In 2-3 sentences, describe your ideal target client. The more
                  specific and detailed, the better
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  My ideal clients are early stage B2B, Fintech, SaaS companies
                  with 50-100 employees located in the United States
                </p>
              </div>

              <div className="mb-8">
                <Textarea
                  value={data.idealTargetClient}
                  onChange={(e) =>
                    updateData("idealTargetClient", e.target.value)
                  }
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your answer here..."
                  className="min-h-32 text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Shift ⇧ + Enter ↵ to make a line break
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 13:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">13 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  Describe your client&apos;s typical top pain points (that you
                  solve).
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  E.g. 1. Struggle to generate consistent leads, 2. Poor
                  conversion rates due to misalignment between marketing and
                  sales, 3. Difficulty measuring marketing ROI
                </p>
              </div>

              <div className="mb-8">
                <Textarea
                  value={data.clientPainPoints}
                  onChange={(e) =>
                    updateData("clientPainPoints", e.target.value)
                  }
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your answer here..."
                  className="min-h-32 text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Shift ⇧ + Enter ↵ to make a line break
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">14 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  Describe the top 2-3 ways you provide unique value to your
                  clients (building on the pain points they have in the previous
                  question)
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  E.g., I build a repeatable lead generation engine using modern
                  tactics, define clear ICP, and set up channel tracking for
                  qualified leads. I implement lead scoring, and optimize sales
                  enablement for better conversions.
                </p>
              </div>

              <div className="mb-8">
                <Textarea
                  value={data.uniqueValueProposition}
                  onChange={(e) =>
                    updateData("uniqueValueProposition", e.target.value)
                  }
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your answer here..."
                  className="min-h-32 text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Shift ⇧ + Enter ↵ to make a line break
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                Continue
              </Button>

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 15:
        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">15 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  What are 2-3 &apos;proof points&apos; that back up your value
                  add?
                </h1>
                <p className="text-gray-600 italic text-base mb-8">
                  E.g. 1. Increased lead generation by 35% within 3 months
                  through a revamped content strategy and targeted paid ads.
                  <br />
                  2. Aligned sales and marketing teams, improving lead
                  conversion rates by 22% in just 6 weeks.
                  <br />
                  3. Implemented a new analytics framework, resulting in a 15%
                  increase in marketing ROI year-over-year.
                </p>
              </div>

              <div className="mb-8">
                <Textarea
                  value={data.proofPoints}
                  onChange={(e) => updateData("proofPoints", e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Type your answer here..."
                  className="min-h-32 text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none resize-none placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Shift ⇧ + Enter ↵ to make a line break
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!validateStep() || isLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                {isLoading ? "Saving..." : "Continue"}
              </Button>

              {error && <p className="text-red-600 mt-4">{error}</p>}

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      case 16:
        const hearAboutOptions = [
          { id: "A", text: "LinkedIn" },
          { id: "B", text: "Twitter / X" },
          { id: "C", text: "Google Search" },
          { id: "D", text: "Referred by a friend" },
          { id: "E", text: "Podcast" },
          { id: "F", text: "Newsletter" },
          { id: "G", text: "Community or Slack group" },
          { id: "H", text: "YouTube" },
          { id: "I", text: "Other (please specify)" },
        ];

        return (
          <div className={commonClasses}>
            <BackButton />
            {backgroundShapes}
            <div className="relative z-10 max-w-3xl w-full text-center">
              <div className="mb-8">
                <span className="text-teal-600 text-xl font-medium">16 →</span>
                <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
                  How did you hear about Mylance?
                </h1>
              </div>

              <div className="space-y-4 mb-8">
                {hearAboutOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateData("heardAboutMylance", option.text)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors text-lg ${
                      data.heardAboutMylance === option.text
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-300 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-teal-600 mr-3 text-lg">
                      {option.id}
                    </span>
                    {option.text}
                  </button>
                ))}
              </div>

              {/* Show text input only if "Other" is selected */}
              {data.heardAboutMylance === "Other (please specify)" && (
                <div className="mb-8">
                  <Input
                    type="text"
                    value={data.heardAboutMylanceOther || ""}
                    onChange={(e) =>
                      updateData("heardAboutMylanceOther", e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Please specify..."
                    className="text-xl border-0 border-b-4 border-teal-500 rounded-none bg-transparent focus:ring-0 focus:outline-none text-center placeholder:text-gray-400"
                  />
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={!validateStep() || isLoading}
                className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-3 rounded font-medium text-lg"
              >
                {isLoading ? "Saving..." : "Continue"}
              </Button>

              {error && <p className="text-red-600 mt-4">{error}</p>}

              <div className="mt-16">
                <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Progress Bar at the very top */}
      <div className="w-full shadow-md">
        <ProgressIndicator currentStep={currentStep} totalSteps={16} />
      </div>
      {renderStep()}
    </>
  );
}
