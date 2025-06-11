"use client";

import { FeedbackButton } from "@/components/common/FeedbackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestFeedbackPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback System Test</h1>
        <p className="text-gray-600">
          Test the feedback functionality for prompts and posts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Prompt Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Test Prompt Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This is a sample prompt for testing feedback functionality.
            </p>
            <p className="text-sm">
              <strong>Hook:</strong> &quot;Here&apos;s a counterintuitive
              insight about remote work...&quot;
            </p>
            <FeedbackButton
              type="prompt"
              targetId={1}
              title="Sample Prompt"
              content="Here's a counterintuitive insight about remote work..."
            />
          </CardContent>
        </Card>

        {/* Test Post Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Test Post Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This is a sample generated post for testing feedback
              functionality.
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              🚀 The future of work isn&apos;t just remote—it&apos;s
              outcome-driven. After 3 years of helping 50+ companies transition
              to remote-first operations...
            </div>
            <FeedbackButton
              type="post"
              targetId={1}
              title="Sample Generated Post"
              content="🚀 The future of work isn't just remote—it's outcome-driven. After 3 years of helping 50+ companies transition to remote-first operations..."
              generationHistoryId={1}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
