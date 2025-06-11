"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Download,
  Star,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import { SubscriptionPlanCard } from "./SubscriptionPlanCard";
import { format } from "date-fns";

interface BillingData {
  subscription: any;
  profile: any;
  usage: any;
}

interface BillingContentProps {
  initialData: BillingData;
  userId: string;
}

export function BillingContent({ initialData, userId }: BillingContentProps) {
  const [loading, setLoading] = useState(false);
  const { subscription, profile, usage } = initialData;

  const hasActiveSubscription =
    subscription && subscription.status === "active";

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-green-100 text-green-700 border-green-200",
      trialing: "bg-blue-100 text-blue-700 border-blue-200",
      past_due: "bg-yellow-100 text-yellow-700 border-yellow-200",
      canceled: "bg-red-100 text-red-700 border-red-200",
      incomplete: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return (
      <Badge
        className={
          statusColors[status as keyof typeof statusColors] ||
          statusColors.incomplete
        }
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Free"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {!hasActiveSubscription && (
        <Alert className="border-blue-200 bg-blue-50">
          <Star className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Ready to unlock premium features?</strong> Subscribe to
            access unlimited AI content generation, advanced analytics, and
            more.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasActiveSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(subscription.status)}
                      <span className="text-lg font-semibold">
                        Premium Plan
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Full access to all features
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
                  {subscription.current_period_end && (
                    <div className="flex justify-between">
                      <span>Next billing:</span>
                      <span>{formatDate(subscription.current_period_end)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={loading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStatusBadge("free")}
                  <span className="text-lg font-semibold">Free Plan</span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Limited features and usage
                </p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Generations</span>
                  <span className="text-gray-600">
                    {usage?.ai_generations || 0} /{" "}
                    {hasActiveSubscription ? "∞" : "10"}
                  </span>
                </div>
                <Progress
                  value={
                    hasActiveSubscription
                      ? 45
                      : Math.min(((usage?.ai_generations || 0) / 10) * 100, 100)
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Posts Created</span>
                  <span className="text-gray-600">
                    {usage?.posts_created || 0} /{" "}
                    {hasActiveSubscription ? "∞" : "20"}
                  </span>
                </div>
                <Progress
                  value={
                    hasActiveSubscription
                      ? 60
                      : Math.min(((usage?.posts_created || 0) / 20) * 100, 100)
                  }
                  className="h-2"
                />
              </div>

              {!hasActiveSubscription && (usage?.ai_generations || 0) > 7 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Approaching your free plan limits
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plan Options */}
      {!hasActiveSubscription && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Plans
          </h3>
          <SubscriptionPlanCard isCurrentPlan={false} />
        </div>
      )}

      {/* Account Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium">
                {profile?.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-medium">
                {formatDate(profile?.created_at || new Date().toISOString())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Plan Status</span>
              <span className="text-sm font-medium">
                {hasActiveSubscription ? "Premium" : "Free"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Posts</span>
              <span className="text-sm font-medium">
                {usage?.total_posts || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">AI Generations</span>
              <span className="text-sm font-medium">
                {usage?.total_ai_generations || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Type</span>
              <Badge
                className={
                  hasActiveSubscription
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }
              >
                {hasActiveSubscription ? "Premium" : "Free"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing History - Only show if has subscription */}
      {hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Billing history will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
