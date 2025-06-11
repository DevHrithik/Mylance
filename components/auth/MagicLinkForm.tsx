"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useNetlifyAutoAuth } from "@/components/providers/NetlifyAutoAuthProvider";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface MagicLinkFormProps {
  mode: "signin" | "signup";
  className?: string;
}

export function MagicLinkForm({ mode, className }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    signup,
    isAuthenticated,
    isLoading: authLoading,
    autoRedirect,
  } = useNetlifyAutoAuth();

  const isSignUp = mode === "signup";
  const title = isSignUp ? "Create your account" : "Welcome back";
  const description = isSignUp
    ? "Enter your email and password to create your Mylance account"
    : "Enter your email and password to sign in to your account";
  const buttonText = isSignUp ? "Create account" : "Sign in";

  // Instant auth check - redirect immediately if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log("MagicLinkForm: User already authenticated, redirecting...");
      const redirectPath = autoRedirect();
      if (redirectPath) {
        router.replace(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, autoRedirect, router]);

  // Handle URL errors
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      const decodedError = decodeURIComponent(urlError);
      setError(decodedError);

      // Clean up URL by removing error parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Note: NetlifyAutoAuthProvider handles automatic redirects for authenticated users

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        console.log("Attempting signup with:", email);
        const result = await signup(email, password);
        console.log("Signup result:", result);

        if (!result.success) {
          setError(result.error || "Signup failed");
        } else {
          setSuccess("Account created successfully! Redirecting...");
          // NetlifyAutoAuthProvider will handle the redirect automatically
        }
      } else {
        console.log("Attempting login with:", email);
        const result = await login(email, password);
        console.log("Login result:", result);

        if (!result.success) {
          setError(result.error || "Login failed");
        } else {
          setSuccess("Login successful! Redirecting...");
          // NetlifyAutoAuthProvider will handle the redirect automatically
        }
      }
    } catch (err: Error | unknown) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("Invalid login credentials")) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
        } else if (err.message.includes("Email not confirmed")) {
          errorMessage =
            "Please check your email and click the confirmation link before signing in.";
        } else if (err.message.includes("Email already registered")) {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const isValidEmail = email ? validateEmail(email) : true;
  const isValidPassword = password ? validatePassword(password) : true;
  const canSubmit = email && password && isValidEmail && isValidPassword;

  // Show loading while checking existing auth
  if (authLoading) {
    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-sm text-gray-600">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={cn(!isValidEmail && "border-red-500")}
            />
            {!isValidEmail && (
              <p className="text-sm text-red-500">
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={cn(!isValidPassword && "border-red-500")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isValidPassword && (
              <p className="text-sm text-red-500">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton />

        {!isSignUp && (
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push("/signup")}
              className="text-sm"
            >
              Don&apos;t have an account? Sign up
            </Button>
          </div>
        )}

        {isSignUp && (
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
