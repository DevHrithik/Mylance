"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);

    // Check if it's an auth-related error
    if (
      error.message?.includes("refresh_token_not_found") ||
      error.message?.includes("Invalid Refresh Token") ||
      error.message?.includes("JSON.parse") ||
      error.message?.includes("base64")
    ) {
      console.warn("Auth error detected, will reload page to clear session");
    }
  }

  handleRetry = () => {
    // Reset error state
    this.setState({ hasError: false, error: null });

    // Reload the page to start fresh and clear any session issues
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const isAuthError =
        this.state.error?.message?.includes("refresh_token_not_found") ||
        this.state.error?.message?.includes("Invalid Refresh Token") ||
        this.state.error?.message?.includes("JSON.parse") ||
        this.state.error?.message?.includes("base64");

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {isAuthError
                  ? "There was an issue with your authentication session. Please try again."
                  : "Something went wrong. Please try again."}
              </AlertDescription>
            </Alert>

            <Button
              onClick={this.handleRetry}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
