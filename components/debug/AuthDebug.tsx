"use client";

import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useEffect } from "react";

export function AuthDebug() {
  const { user, isAuthenticated, isLoading, isAdmin } = useSimpleAuth();

  useEffect(() => {
    console.log("Auth Debug:", {
      user: user
        ? { id: user.id, email: user.email, is_admin: user.is_admin }
        : null,
      isAuthenticated,
      isLoading,
      isAdmin,
      currentPath: window.location.pathname,
    });
  }, [user, isAuthenticated, isLoading, isAdmin]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-xs">
      <div>
        <strong>Auth State:</strong>
      </div>
      <div>Loading: {isLoading ? "YES" : "NO"}</div>
      <div>Authenticated: {isAuthenticated ? "YES" : "NO"}</div>
      <div>Admin: {isAdmin ? "YES" : "NO"}</div>
      <div>User: {user ? user.email : "None"}</div>
      <div>
        Path: {typeof window !== "undefined" ? window.location.pathname : "SSR"}
      </div>
    </div>
  );
}
