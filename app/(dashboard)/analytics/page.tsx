import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | Mylance",
  description:
    "Track your LinkedIn content performance and AI learning progress",
};

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track your LinkedIn content performance and AI learning progress
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
