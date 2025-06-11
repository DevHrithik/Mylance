"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Download,
  Settings,
  Zap,
  FileText,
  TrendingUp,
  Lock,
  Star,
} from "lucide-react";
import Link from "next/link";
import { SubscriptionPlanCard } from "@/components/billing/SubscriptionPlanCard";
import { useSubscription } from "@/hooks/useSubscription";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

export default function BillingPage() {
  const { hasAccess, isAdmin, subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription plan card if user doesn't have access
  if (!hasAccess && !isAdmin) {
    return (
      <div className="p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unlock Your LinkedIn Content Potential
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get access to our comprehensive LinkedIn content system and start
            building your thought leadership today.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SubscriptionPlanCard />
        </div>

        <div className="mt-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">
              Subscribe to access all features
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <Zap className="h-4 w-4 mr-2 text-blue-500" />
              AI Content Generation
            </div>
            <div className="flex items-center justify-center">
              <FileText className="h-4 w-4 mr-2 text-green-500" />
              Content Planning
            </div>
            <div className="flex items-center justify-center">
              <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
              Performance Analytics
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show billing dashboard for subscribed users
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and view usage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                {isAdmin ? (
                  <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700">
                    <Star className="h-3 w-3 mr-1" />
                    Monthly
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {isAdmin ? "Admin Access" : STRIPE_CONFIG.PLAN_NAME}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isAdmin
                      ? "Full access to all features"
                      : "Complete LinkedIn content system with done-with-you approach"}
                  </p>
                </div>
                {!isAdmin && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">${STRIPE_CONFIG.PRICE}</p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                )}
              </div>

              {!isAdmin && (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                    <Button variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment
                    </Button>
                  </div>

                  {subscription && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Next billing date:{" "}
                        <span className="font-medium">
                          {formatDate(subscription.current_period_end)}
                        </span>
                      </p>
                      {subscription.cancel_at && (
                        <p className="text-sm text-orange-600 mt-1">
                          Subscription will cancel on:{" "}
                          <span className="font-medium">
                            {formatDate(subscription.cancel_at)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Usage This Month */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">AI Generations</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {isAdmin ? "Unlimited" : "32 / ∞"}
                  </span>
                </div>
                {!isAdmin && <Progress value={32} className="h-2" />}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Posts Created</span>
                  </div>
                  <span className="text-sm text-gray-600">28</span>
                </div>
                <Progress value={28} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">
                      Weekly Prompts Delivered
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">4 / 4</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          {!isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Billing History</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscription && subscription.current_period_start && (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">${STRIPE_CONFIG.PRICE}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(subscription.current_period_start)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200"
                        >
                          Paid
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isAdmin && (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Invoices
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Methods
                  </Button>
                </>
              )}
              <Link href="/dashboard">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium mb-2">Next Steps</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Complete your onboarding</li>
                  <li>• Set up your content pillars</li>
                  <li>• Schedule your first post</li>
                  <li>• Connect with our team</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
