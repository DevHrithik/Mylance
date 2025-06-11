import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Settings | Mylance",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and app preferences
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive email updates about your content performance
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ai-insights">AI Insights</Label>
                <p className="text-sm text-gray-600">
                  Get notified when AI has new recommendations
                </p>
              </div>
              <Switch id="ai-insights" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performance-alerts">Performance Alerts</Label>
                <p className="text-sm text-gray-600">
                  Alerts when posts perform exceptionally well or poorly
                </p>
              </div>
              <Switch id="performance-alerts" />
            </div>
          </CardContent>
        </Card>

        {/* Content Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="default-tone">Default Content Tone</Label>
              <Select defaultValue="professional">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-length">Preferred Content Length</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">
                    Short (&lt; 500 characters)
                  </SelectItem>
                  <SelectItem value="medium">
                    Medium (500-1000 characters)
                  </SelectItem>
                  <SelectItem value="long">
                    Long (&gt; 1000 characters)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-hashtags">Auto-generate Hashtags</Label>
                <p className="text-sm text-gray-600">
                  Automatically suggest relevant hashtags for posts
                </p>
              </div>
              <Switch id="auto-hashtags" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* AI Learning */}
        <Card>
          <CardHeader>
            <CardTitle>AI Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performance-tracking">
                  Performance Tracking
                </Label>
                <p className="text-sm text-gray-600">
                  Allow AI to learn from your post performance data
                </p>
              </div>
              <Switch id="performance-tracking" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="content-analysis">Content Analysis</Label>
                <p className="text-sm text-gray-600">
                  Analyze content patterns to improve future suggestions
                </p>
              </div>
              <Switch id="content-analysis" defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="learning-frequency">
                Learning Update Frequency
              </Label>
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-retention">Data Retention</Label>
                <p className="text-sm text-gray-600">
                  Keep post performance data for analysis
                </p>
              </div>
              <Switch id="data-retention" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics-sharing">Analytics Sharing</Label>
                <p className="text-sm text-gray-600">
                  Share anonymized data to improve AI models
                </p>
              </div>
              <Switch id="analytics-sharing" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-red-700">Delete Account</Label>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
