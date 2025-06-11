"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/authStore";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // The redirect will happen automatically
    } catch (error) {
      console.error("Google sign in error:", error);
      setIsLoading(false);
      // You could add toast notification here
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FcGoogle className="w-4 h-4 mr-2" />
      )}
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
}
