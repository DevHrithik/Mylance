import { Metadata } from "next";
import { Suspense } from "react";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";

export const metadata: Metadata = {
  title: "Sign In | Mylance",
  description: "Sign in to your Mylance account with a magic link",
};

export default function LoginPage() {
  return (
    <AuthErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <MagicLinkForm mode="signin" />
      </Suspense>
    </AuthErrorBoundary>
  );
}
