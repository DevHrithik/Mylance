import { AdminFeedbackDashboard } from "@/components/admin/AdminFeedbackDashboard";
import { FeedbackAnalytics } from "@/components/admin/FeedbackAnalytics";
import { FeedbackTrends } from "@/components/admin/FeedbackTrends";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          User Feedback Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive analysis of user feedback to improve content quality and
          user experience
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FeedbackAnalytics />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <FeedbackTrends />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <FeedbackTrends />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <AdminFeedbackDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
