"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double execution in development
    if (initialized.current) return;
    initialized.current = true;

    const handleCallback = async () => {
      const supabase = createClient();

      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Callback error:", error);
          router.push("/login?error=" + encodeURIComponent(error.message));
          return;
        }

        if (data.session?.user) {
          // Get user profile to check admin status
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin, onboarding_completed")
            .eq("id", data.session.user.id)
            .single();

          // Redirect based on user type and onboarding status
          if (profile?.is_admin) {
            router.push("/admin");
          } else if (profile?.onboarding_completed) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          // No session, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Callback error:", error);
        router.push(
          "/login?error=" + encodeURIComponent("Authentication failed")
        );
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Completing sign in...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we redirect you.
          </p>
        </div>
      </div>
    </div>
  );
}
