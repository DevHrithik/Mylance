"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function CallbackPage() {
  const router = useRouter();
  const initialized = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    // Prevent double execution in development
    if (initialized.current) return;
    initialized.current = true;

    const handleCallback = async () => {
      try {
        setStatus("Verifying authentication...");
        const supabase = createClient();

        // Set a 8 second timeout for the entire auth process
        const authTimeout = setTimeout(() => {
          console.error("Auth callback timeout");
          setStatus("Taking longer than expected...");
          router.push(
            "/login?error=" +
              encodeURIComponent("Authentication timeout. Please try again.")
          );
        }, 8000);

        // Handle the auth callback with shorter timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 6000)
        );

        const { data, error } = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as any;

        clearTimeout(authTimeout);

        if (error) {
          console.error("Callback error:", error);
          router.push("/login?error=" + encodeURIComponent(error.message));
          return;
        }

        if (data.session?.user) {
          setStatus("Loading profile...");

          // Get user profile with faster timeout
          const profilePromise = supabase
            .from("profiles")
            .select("is_admin, onboarding_completed")
            .eq("id", data.session.user.id)
            .single();

          const profileTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Profile check timeout")), 3000)
          );

          try {
            const { data: profile } = (await Promise.race([
              profilePromise,
              profileTimeoutPromise,
            ])) as any;

            setStatus("Redirecting...");

            // Redirect based on user type and onboarding status
            if (profile?.is_admin) {
              router.replace("/admin");
            } else if (profile?.onboarding_completed) {
              router.replace("/dashboard");
            } else {
              router.replace("/onboarding");
            }
          } catch (profileError) {
            console.warn("Profile fetch failed, using fallback:", profileError);
            // Fallback: redirect to onboarding if profile fetch fails
            setStatus("Redirecting to setup...");
            router.replace("/onboarding");
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

    // Add a small delay to ensure DOM is ready
    timeoutRef.current = setTimeout(handleCallback, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Completing sign in...</h2>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
}
