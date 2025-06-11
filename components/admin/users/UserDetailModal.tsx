"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  User,
  Calendar,
  CreditCard,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  linkedin_url?: string | null;
  business_type?: string | null;
  business_size?: string | null;
  business_stage?: string | null;
  linkedin_importance?: string | null;
  investment_willingness?: string | null;
  posting_mindset?: string | null;
  current_posting_frequency?: string | null;
  client_attraction_methods?: string[] | null;
  ideal_target_client?: string | null;
  client_pain_points?: string | null;
  unique_value_proposition?: string | null;
  proof_points?: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  subscriptions?: {
    plan_type: "free" | "starter" | "professional" | "enterprise";
    status: "active" | "canceled" | "past_due" | "paused";
    current_period_end?: string | null;
  }[];
  post_count?: number;
}

interface UserDetailModalProps {
  user: UserWithDetails;
  onClose: () => void;
}

export default function UserDetailModal({
  user,
  onClose,
}: UserDetailModalProps) {
  const subscription = user.subscriptions?.[0];
  const planType = subscription?.plan_type || "free";
  const status = subscription?.status || "active";

  const getInitials = (firstName?: string | null, email?: string) => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  const formatUserName = (user: UserWithDetails) => {
    return user.first_name || user.email.split("@")[0];
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
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

  const getStatusBadgeColor = (status: string) => {
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

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                {getInitials(user.first_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{formatUserName(user)}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Account Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Plan</p>
                    <Badge className={getPlanBadgeColor(planType)}>
                      {planType.charAt(0).toUpperCase() + planType.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status === "active"
                          ? "bg-green-500"
                          : status === "canceled"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusBadgeColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Posts Created</p>
                    <p className="font-medium">{user.post_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Onboarding</p>
                    <p className="font-medium">
                      {user.onboarding_completed ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Business Information
              </h3>
              <div className="space-y-3">
                {user.business_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Business Type
                    </p>
                    <p className="text-gray-900">{user.business_type}</p>
                  </div>
                )}
                {user.business_size && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Business Size
                    </p>
                    <p className="text-gray-900">{user.business_size}</p>
                  </div>
                )}
                {user.business_stage && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Business Stage
                    </p>
                    <p className="text-gray-900">{user.business_stage}</p>
                  </div>
                )}
                {user.linkedin_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      LinkedIn Profile
                    </p>
                    <a
                      href={user.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>{user.linkedin_url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Content Strategy */}
            {(user.ideal_target_client ||
              user.client_pain_points ||
              user.unique_value_proposition ||
              user.proof_points) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Content Strategy
                </h3>
                <div className="space-y-3">
                  {user.ideal_target_client && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Ideal Target Client
                      </p>
                      <p className="text-gray-900">
                        {user.ideal_target_client}
                      </p>
                    </div>
                  )}
                  {user.client_pain_points && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Client Pain Points
                      </p>
                      <p className="text-gray-900">{user.client_pain_points}</p>
                    </div>
                  )}
                  {user.unique_value_proposition && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Unique Value Proposition
                      </p>
                      <p className="text-gray-900">
                        {user.unique_value_proposition}
                      </p>
                    </div>
                  )}
                  {user.proof_points && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Proof Points
                      </p>
                      <p className="text-gray-900">{user.proof_points}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Preferences */}
            {(user.linkedin_importance ||
              user.posting_mindset ||
              user.current_posting_frequency) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Content Preferences
                </h3>
                <div className="space-y-3">
                  {user.linkedin_importance && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        LinkedIn Importance
                      </p>
                      <p className="text-gray-900">
                        {user.linkedin_importance}
                      </p>
                    </div>
                  )}
                  {user.posting_mindset && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Posting Mindset
                      </p>
                      <p className="text-gray-900">{user.posting_mindset}</p>
                    </div>
                  )}
                  {user.current_posting_frequency && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Current Posting Frequency
                      </p>
                      <p className="text-gray-900">
                        {user.current_posting_frequency}
                      </p>
                    </div>
                  )}
                  {user.client_attraction_methods &&
                    user.client_attraction_methods.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Client Attraction Methods
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.client_attraction_methods.map(
                            (method, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {method}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Account Details */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Account Details
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">User ID</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {user.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Login</span>
                  <span>
                    {user.last_login_at
                      ? formatDistanceToNow(new Date(user.last_login_at), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span>
                    {formatDistanceToNow(new Date(user.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            {subscription && (
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Subscription</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Plan</span>
                    <Badge className={getPlanBadgeColor(planType)}>
                      {planType.charAt(0).toUpperCase() + planType.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge className={getStatusBadgeColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  {subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Ends</span>
                      <span>
                        {formatDistanceToNow(
                          new Date(subscription.current_period_end),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Prompts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-blue-600"
                >
                  <User className="h-4 w-4 mr-2" />
                  Impersonate User
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
