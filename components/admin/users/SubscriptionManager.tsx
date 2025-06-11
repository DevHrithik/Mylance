"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { Database } from "@/lib/types/database";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type UsageTracking = Database["public"]["Tables"]["usage_tracking"]["Row"];

interface SubscriptionManagerProps {
  userId: string;
  onUpdate?: () => void;
}

export default function SubscriptionManager({
  userId,
  onUpdate,
}: SubscriptionManagerProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking[]>([]);

  const fetchSubscriptionData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (subError && subError.code !== "PGRST116") {
        console.error("Subscription error:", subError);
        throw new Error(
          `Subscription fetch failed: ${
            subError.message || JSON.stringify(subError)
          }`
        );
      }

      setSubscription(subData);

      // Fetch usage tracking
      const { data: usageData, error: usageError } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (usageError && usageError.code !== "42P01") {
        console.error("Usage tracking error:", usageError);
        throw new Error(
          `Usage tracking fetch failed: ${
            usageError.message || JSON.stringify(usageError)
          }`
        );
      }

      setUsage(usageData || []);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast.error(
        `Failed to load subscription data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const updateSubscriptionStatus = async (newStatus: string) => {
    if (!subscription) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: newStatus as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Subscription status updated successfully");
      await fetchSubscriptionData();
      onUpdate?.();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription status");
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePlanType = async (newPlan: string) => {
    if (!subscription) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan_type: newPlan as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Plan type updated successfully");
      await fetchSubscriptionData();
      onUpdate?.();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan type");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "starter":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Current Plan
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getPlanColor(subscription.plan_type)}>
                      {subscription.plan_type.toUpperCase()}
                    </Badge>
                    <Select
                      value={subscription.plan_type}
                      onValueChange={updatePlanType}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">
                          Professional
                        </SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status.toUpperCase()}
                    </Badge>
                    <Select
                      value={subscription.status}
                      onValueChange={updateSubscriptionStatus}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="past_due">Past Due</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Created
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(new Date(subscription.created_at), "MMM d, yyyy")}
                  </p>
                </div>

                {subscription.current_period_start && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Period Start
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(
                        new Date(subscription.current_period_start),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}

                {subscription.current_period_end && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Period End
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(
                        new Date(subscription.current_period_end),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                )}
              </div>

              {subscription.stripe_customer_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Stripe Customer ID
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {subscription.stripe_customer_id}
                  </p>
                </div>
              )}

              {subscription.stripe_subscription_id && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Stripe Subscription ID
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {subscription.stripe_subscription_id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Subscription Found
              </h3>
              <p className="text-gray-500">
                This user doesn&apos;t have an active subscription.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Tracking */}
      {usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Usage Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {item.feature_type}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Period: {format(new Date(item.period_start), "MMM d")} -{" "}
                      {format(new Date(item.period_end), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {item.usage_count} / {item.limit_amount}
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (item.usage_count / item.limit_amount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Period Info */}
      {subscription && subscription.current_period_end && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Next billing date:</span>
                <span className="font-medium">
                  {format(
                    new Date(subscription.current_period_end),
                    "MMMM d, yyyy"
                  )}
                </span>
              </div>

              {subscription.cancel_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancellation date:</span>
                  <span className="font-medium text-red-600">
                    {format(new Date(subscription.cancel_at), "MMMM d, yyyy")}
                  </span>
                </div>
              )}

              {subscription.canceled_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Canceled on:</span>
                  <span className="font-medium text-red-600">
                    {format(new Date(subscription.canceled_at), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              User&apos;s subscription will be cancelled at the end of the
              current billing period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
