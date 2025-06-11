"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";

interface ClearSessionButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ClearSessionButton({
  variant = "outline",
  size = "default",
  className = "",
}: ClearSessionButtonProps) {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearSession = async () => {
    setIsClearing(true);

    try {
      // Show confirmation dialog
      const confirmed = window.confirm(
        "This will clear your current session and redirect you to login. Continue?"
      );

      if (!confirmed) {
        setIsClearing(false);
        return;
      }


      // Wait a moment then redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      console.error("Error clearing session:", error);
      setIsClearing(false);

      // Fallback: just reload the page
      window.location.reload();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearSession}
      disabled={isClearing}
      className={className}
    >
      {isClearing ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Clearing...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Session
        </>
      )}
    </Button>
  );
}
