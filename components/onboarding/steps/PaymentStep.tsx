"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Star, Loader2, AlertCircle } from "lucide-react";
import { STRIPE_CONFIG } from "@/lib/stripe/config";
import { useSubscription } from "@/hooks/useSubscription";

interface PaymentStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function PaymentStep({ onNext, onSkip }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    createCheckoutSession,
    hasAccess,
    isAdmin,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useSubscription();

  // Debug subscription status
  useEffect(() => {
    console.log("PaymentStep - Subscription status:", {
      hasAccess,
      isAdmin,
      subscriptionLoading,
      subscriptionError,
    });
  }, [hasAccess, isAdmin, subscriptionLoading, subscriptionError]);

  const features = [
    "Personalized onboarding call",
    "Custom content plan with your voice",
    "Content pillars development",
    "Monthly strategic roadmap",
    "Weekly prompts every Monday",
    "Content crafted from your experiences",
    "Post 3x/week with clear guidance",
    "Weekly email alerts for refinement",
    "Client conversation optimization",
    "Authority building strategy",
  ];

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting checkout session creation...");

      // Check if Stripe config is available
      if (!STRIPE_CONFIG.PRICE_ID) {
        throw new Error(
          "Stripe configuration is missing. Please contact support."
        );
      }

      await createCheckoutSession();
      // If we reach here without redirect, it means there was an issue
      console.log("Checkout session created but no redirect occurred");

      // Add a timeout as fail-safe
      setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError(
            "Redirect to payment page is taking longer than expected. Please try again or contact support."
          );
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error subscribing:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error occurred. Please try again or contact support."
      );
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onNext();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-400 rounded-full opacity-80 -translate-x-32 -translate-y-32"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-80 translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full opacity-80 -translate-x-32 translate-y-32"></div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-teal-600 text-xl font-medium">
            Final Step →
          </span>
          <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
            Ready to Transform Your LinkedIn Presence?
          </h1>
          <p className="text-gray-600 italic text-base mb-8">
            Complete your setup and start building your authority today
          </p>
        </div>

        {/* Error Alert */}
        {(error || subscriptionError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Payment Error</p>
              <p>{error || subscriptionError}</p>
            </div>
          </div>
        )}

        <Card className="relative shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              <CardTitle className="text-xl">
                {STRIPE_CONFIG.PLAN_NAME}
              </CardTitle>
            </div>

            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">
                  ${STRIPE_CONFIG.PRICE}
                </span>
                <span className="text-gray-600 ml-1">
                  /{STRIPE_CONFIG.BILLING_PERIOD}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Billed monthly</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm text-gray-600 text-center">
              {STRIPE_CONFIG.PLAN_DESCRIPTION}
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">What&apos;s included:</h4>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 space-y-3">
              {isAdmin ? (
                <Button
                  onClick={handleContinue}
                  className="w-full bg-teal-500 hover:bg-teal-600"
                >
                  Continue as Admin
                </Button>
              ) : hasAccess ? (
                <Button
                  onClick={handleContinue}
                  className="w-full bg-teal-500 hover:bg-teal-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Continue - Already Subscribed
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </div>
                    )}
                  </Button>

                  {onSkip && (
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="w-full"
                      disabled={loading}
                    >
                      Skip for Now
                    </Button>
                  )}
                </>
              )}
            </div>

            {!hasAccess && !isAdmin && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Cancel anytime • No hidden fees • 30-day money-back guarantee
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-16 text-center">
          <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
        </div>
      </div>
    </div>
  );
}
