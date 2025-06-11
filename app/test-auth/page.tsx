"use client";

import { AutoLoginTest } from "@/components/auth/AutoLoginTest";

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Auto-Login System Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page allows you to test the auto-login functionality. Use this
            to verify that authentication works properly in development and
            production.
          </p>
        </div>

        <AutoLoginTest />

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-700">
              Access this page at <code className="font-mono">/test-auth</code>{" "}
              to test auto-login functionality
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
