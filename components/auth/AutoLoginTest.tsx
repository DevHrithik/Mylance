"use client";

import { useState } from "react";
import { useNetlifyAutoAuth } from "@/components/providers/NetlifyAutoAuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AutoLoginTest() {
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("password123");
  const [testResult, setTestResult] = useState<string>("");

  const {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasCompletedOnboarding,
    error,
    login,
    logout,
    refresh,
    autoRedirect,
  } = useNetlifyAutoAuth();

  const handleTestLogin = async () => {
    setTestResult("Testing login...");
    try {
      const result = await login(testEmail, testPassword);
      if (result.success) {
        setTestResult("✅ Login successful! Auto-redirect should occur.");
      } else {
        setTestResult(`❌ Login failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Login error: ${error}`);
    }
  };

  const handleTestLogout = async () => {
    setTestResult("Testing logout...");
    try {
      await logout();
      setTestResult("✅ Logout successful! Should redirect to login.");
    } catch (error) {
      setTestResult(`❌ Logout error: ${error}`);
    }
  };

  const handleTestRedirect = () => {
    const redirectPath = autoRedirect();
    if (redirectPath) {
      setTestResult(`✅ Would redirect to: ${redirectPath}`);
    } else {
      setTestResult("ℹ️ No redirect needed for current state");
    }
  };

  const handleRefresh = async () => {
    setTestResult("Refreshing auth state...");
    try {
      await refresh();
      setTestResult("✅ Auth state refreshed");
    } catch (error) {
      setTestResult(`❌ Refresh error: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Auto-Login System Test
          {isLoading && (
            <Badge variant="secondary" className="animate-pulse">
              Loading...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Auth State */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Current Auth State</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span>{" "}
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Loading:</span>{" "}
              <Badge variant={isLoading ? "destructive" : "secondary"}>
                {isLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Admin:</span>{" "}
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Onboarding:</span>{" "}
              <Badge variant={hasCompletedOnboarding ? "default" : "secondary"}>
                {hasCompletedOnboarding ? "Complete" : "Pending"}
              </Badge>
            </div>
          </div>

          {user && (
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">User Info:</h4>
              <div className="text-sm text-green-700 space-y-1">
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Name:</strong> {user.full_name || "Not set"}
                </div>
                <div>
                  <strong>ID:</strong> {user.id}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-1">Error:</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Test Controls</h3>

          {!isAuthenticated ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Test email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="password"
                  placeholder="Test password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <Button onClick={handleTestLogin} className="w-full">
                🔑 Test Login (with Auto-Redirect)
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleTestLogout}
              variant="destructive"
              className="w-full"
            >
              🚪 Test Logout
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleTestRedirect} variant="outline">
              🔄 Test Redirect Logic
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              ♻️ Refresh Auth State
            </Button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Test Result</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono">{testResult}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <details className="space-y-2">
          <summary className="font-semibold text-lg cursor-pointer">
            🐛 Debug Information
          </summary>
          <div className="p-3 bg-gray-50 rounded-lg">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(
                {
                  pathname:
                    typeof window !== "undefined"
                      ? window.location.pathname
                      : "SSR",
                  userAgent:
                    typeof window !== "undefined" ? navigator.userAgent : "SSR",
                  localStorage:
                    typeof window !== "undefined"
                      ? Object.keys(localStorage).filter((k) =>
                          k.startsWith("sb-")
                        )
                      : "SSR",
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>

        {/* Instructions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">💡 Test Instructions</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Open this page in an incognito window</p>
            <p>2. Try logging in with test credentials</p>
            <p>3. Observe auto-redirect behavior</p>
            <p>4. Refresh the page - you should stay logged in</p>
            <p>5. Test logout functionality</p>
            <p>6. Check the browser console for detailed logs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
