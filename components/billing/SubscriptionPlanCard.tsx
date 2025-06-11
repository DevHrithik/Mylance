"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";
import { STRIPE_CONFIG } from "@/lib/stripe/config";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionPlanCardProps {
  isCurrentPlan?: boolean;
}

export function SubscriptionPlanCard({
  isCurrentPlan = false,
}: SubscriptionPlanCardProps) {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession, hasAccess, isAdmin } = useSubscription();

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
      await createCheckoutSession();
    } catch (error) {
      console.error("Error subscribing:", error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`relative ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">Current Plan</Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Star className="h-6 w-6 text-yellow-500 mr-2" />
          <CardTitle className="text-xl">{STRIPE_CONFIG.PLAN_NAME}</CardTitle>
        </div>

        <div className="text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">${STRIPE_CONFIG.PRICE}</span>
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

        <div className="pt-4">
          {isAdmin ? (
            <Button disabled className="w-full">
              Admin Access Included
            </Button>
          ) : hasAccess ? (
            <Button disabled className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Subscribed
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Get Started Now
                </div>
              )}
            </Button>
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
  );
}
