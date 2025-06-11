"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDebug() {
  const supabase = createClient();
  const [authState, setAuthState] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const checkAuth = async () => {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        setAuthState({ error: userError.message });
        return;
      }

      if (!user) {
        setAuthState({ authenticated: false });
        return;
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setAuthState({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
        },
        adminData,
        adminError: adminError?.message,
      });

      setIsAdmin(!!adminData);
    } catch (error) {
      console.error("Debug error:", error);
      setAuthState({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Admin Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
        <div className="mt-2">
          <strong>Is Admin:</strong>{" "}
          {isAdmin === null ? "Checking..." : isAdmin ? "Yes" : "No"}
        </div>
      </CardContent>
    </Card>
  );
}
