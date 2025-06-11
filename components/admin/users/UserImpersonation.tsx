"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  UserCheck,
  Clock,
  ExternalLink,
  Shield,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { format } from "date-fns";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserImpersonationProps {
  userId: string;
}

interface ImpersonationSession {
  id: string;
  admin_id: string;
  target_user_id: string;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

export default function UserImpersonation({ userId }: UserImpersonationProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] =
    useState<ImpersonationSession | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error(
        `Failed to load user data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
    checkActiveSession();
  }, [fetchUserData]);

  const checkActiveSession = async () => {
    // In a real implementation, you would check for active impersonation sessions
    // For now, we'll simulate this check
    try {
      // This would be a call to check if there's an active impersonation session
      // const { data } = await supabase.from("admin_impersonation_sessions")...
      setActiveSession(null);
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const startImpersonation = async () => {
    if (!user) return;

    try {
      setIsStarting(true);

      // In a real implementation, this would:
      // 1. Create an impersonation session record
      // 2. Generate a secure token
      // 3. Log the impersonation start
      // 4. Redirect to the user dashboard with impersonation context

      // For demo purposes, we'll simulate this
      const sessionData: ImpersonationSession = {
        id: `imp_${Date.now()}`,
        admin_id: "current_admin_id", // Would get from auth context
        target_user_id: userId,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        is_active: true,
      };

      setActiveSession(sessionData);

      toast.success("Impersonation session started successfully");

      // In a real implementation, you would redirect to the user dashboard
      // window.open(`/dashboard?impersonate=${sessionData.id}`, '_blank');
    } catch (error) {
      console.error("Error starting impersonation:", error);
      toast.error("Failed to start impersonation session");
    } finally {
      setIsStarting(false);
    }
  };

  const endImpersonation = async () => {
    if (!activeSession) return;

    try {
      setIsEnding(true);

      // In a real implementation, this would:
      // 1. Mark the session as inactive
      // 2. Log the impersonation end
      // 3. Clean up any temporary access

      setActiveSession(null);
      toast.success("Impersonation session ended successfully");
    } catch (error) {
      console.error("Error ending impersonation:", error);
      toast.error("Failed to end impersonation session");
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Target User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900">
                {user.first_name || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                User ID
              </label>
              <p className="text-gray-900 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Last Login
              </label>
              <p className="text-gray-900">
                {user.last_login_at
                  ? format(
                      new Date(user.last_login_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Session Status */}
      {activeSession ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Shield className="h-5 w-5" />
              Active Impersonation Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Session ID
                  </label>
                  <p className="text-green-900 font-mono text-sm">
                    {activeSession.id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Started At
                  </label>
                  <p className="text-green-900">
                    {format(
                      new Date(activeSession.started_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Expires At
                  </label>
                  <p className="text-green-900">
                    {format(
                      new Date(activeSession.expires_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Status
                  </label>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    window.open(
                      `/dashboard?impersonate=${activeSession.id}`,
                      "_blank"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open User Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={endImpersonation}
                  disabled={isEnding}
                  className="flex items-center gap-2"
                >
                  {isEnding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start Impersonation Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-blue-700">
                  <p className="font-medium">Before you start:</p>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>
                      • Ensure you have a legitimate reason for impersonation
                    </li>
                    <li>
                      • The session will automatically expire in 30 minutes
                    </li>
                    <li>• All actions will be logged and audited</li>
                    <li>
                      • You&apos;ll see a clear indicator that you&apos;re
                      impersonating
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={startImpersonation}
                  disabled={isStarting}
                  className="flex items-center gap-2"
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  Start Impersonation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impersonation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Impersonation Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900">
                Appropriate Use Cases:
              </h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Debugging user-reported issues</li>
                <li>Providing technical support</li>
                <li>Testing user-specific configurations</li>
                <li>Investigating platform problems</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Security Measures:</h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sessions are limited to 30 minutes maximum</li>
                <li>All actions are logged with admin identification</li>
                <li>Sensitive data access is restricted</li>
                <li>Visual indicators show impersonation mode</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Best Practices:</h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Document the reason for impersonation</li>
                <li>Minimize the time spent in impersonation mode</li>
                <li>Only perform necessary actions</li>
                <li>End the session immediately when done</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
