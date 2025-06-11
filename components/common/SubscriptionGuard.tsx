"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function SubscriptionGuard({
  children,
  fallback,
  redirectTo = "/billing",
}: SubscriptionGuardProps) {
  const { hasAccess, isAdmin, loading, createCheckoutSession } =
    useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasAccess && !isAdmin && redirectTo) {
      router.push(redirectTo);
    }
  }, [loading, hasAccess, isAdmin, redirectTo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-gray-400 mr-2" />
            <CardTitle>Subscription Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You need an active subscription to access this feature.
          </p>
          <Button
            onClick={() => createCheckoutSession()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Subscribe Now
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/billing")}
            className="w-full"
          >
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
