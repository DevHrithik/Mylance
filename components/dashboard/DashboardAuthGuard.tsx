"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";

interface User {
  id: string;
  email: string;
  user_metadata?: any;
  first_name?: string | null;
  onboarding_completed?: boolean;
}

interface DashboardAuthGuardProps {
  children: React.ReactNode;
  user: User | null;
}

export default function DashboardAuthGuard({
  children,
  user,
}: DashboardAuthGuardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(!user); // Don't show loading if we have server user data
  const [isAuthenticated, setIsAuthenticated] = useState(!!user); // Set immediately if we have user
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we have user data from server, use it immediately
        if (user) {
          setIsAuthenticated(true);
          setIsLoading(false);

          // Check onboarding status and redirect if needed
          if (user.onboarding_completed === false) {
            router.push("/onboarding");
          }
          return;
        }

        // Only do client-side check if no server user data
        setIsLoading(true);
        setError(null);

        const {
          data: { user: clientUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Client auth error:", userError);
          setError(`Authentication error: ${userError.message}`);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (!clientUser) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check onboarding status for client-side user
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", clientUser.id)
          .single();

        if (profile?.onboarding_completed === false) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Auth guard error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Unknown authentication error"
        );
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, router, supabase]);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              You need to be logged in to access your dashboard.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <Button onClick={handleLogin} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated - render the dashboard content
  return <>{children}</>;
}
