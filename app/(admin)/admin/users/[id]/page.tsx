"use client";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  X,
  Check,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  MessageSquare,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  business_type: string | null;
  business_size: string | null;
  ideal_target_client: string | null;
  client_pain_points: string | null;
  unique_value_proposition: string | null;
  proof_points: string | null;
  content_strategy: string | null;
  content_pillars: string[];
  onboarding_completed: boolean;
  profile_locked: boolean;
  created_at: string;
  last_login_at: string | null;
  post_count: number;
  subscriptions?: {
    plan_type: string;
    status: string;
    current_period_end: string;
  }[];
}

export default function UserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingICP, setSavingICP] = useState(false);
  const [savingPillars, setSavingPillars] = useState(false);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [generatingPillars, setGeneratingPillars] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [upgradingSubscription, setUpgradingSubscription] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    business_type: "",
    business_size: "",
    ideal_target_client: "",
    client_pain_points: "",
    unique_value_proposition: "",
    content_strategy: "",
    content_pillars: ["", "", ""],
    proof_points: "",
  });
  const [originalData, setOriginalData] = useState(formData);
  const router = useRouter();

  const getUserData = useCallback(async () => {
    const supabase = createClient();

    // Fetch user profile data
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        first_name,
        business_type,
        business_size,
        ideal_target_client,
        client_pain_points,
        unique_value_proposition,
        proof_points,
        content_strategy,
        content_pillars,
        onboarding_completed,
        profile_locked,
        created_at,
        last_login_at
      `
      )
      .eq("id", resolvedParams.id)
      .single();

    if (userError) {
      notFound();
      return;
    }

    // Fetch subscription data separately to ensure it works
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan_type, status, current_period_end")
      .eq("user_id", resolvedParams.id);

    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
    }

    // Get post count
    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", resolvedParams.id);

    const userWithPostCount = {
      ...userData,
      post_count: postCount || 0,
      content_pillars: userData.content_pillars || [],
      subscriptions: subscriptionData || [],
    };

    setUser(userWithPostCount);

    // Ensure we always have 3 content pillars for editing
    const pillars = userData.content_pillars || [];
    const normalizedPillars = [...pillars];
    while (normalizedPillars.length < 3) {
      normalizedPillars.push("");
    }

    const initialFormData = {
      first_name: userData.first_name || "",
      business_type: userData.business_type || "",
      business_size: userData.business_size || "",
      ideal_target_client: userData.ideal_target_client || "",
      client_pain_points: userData.client_pain_points || "",
      unique_value_proposition: userData.unique_value_proposition || "",
      content_strategy: userData.content_strategy || "",
      content_pillars: normalizedPillars.slice(0, 3),
      proof_points: userData.proof_points || "",
    };

    setFormData(initialFormData);
    setOriginalData(initialFormData);
    setLoading(false);
  }, [resolvedParams.id]);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContentPillarChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      content_pillars: prev.content_pillars.map((pillar, i) =>
        i === index ? value : pillar
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    // Filter out empty content pillars
    const filteredPillars = formData.content_pillars.filter(
      (pillar) => pillar.trim() !== ""
    );

    const updateData = {
      ...formData,
      content_pillars: filteredPillars,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", resolvedParams.id);

    if (error) {
      toast.error("Failed to update user profile");
      console.error("Error updating user:", error);
    } else {
      toast.success("User profile updated successfully");
      setOriginalData(formData);
      // Refresh user data
      await getUserData();
    }

    setSaving(false);
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    const supabase = createClient();

    const updateData = {
      first_name: formData.first_name,
      business_type: formData.business_type,
      business_size: formData.business_size,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", resolvedParams.id);

    if (error) {
      toast.error("Failed to update user details");
      console.error("Error updating user details:", error);
    } else {
      toast.success("User details updated successfully");
      // Update original data for these fields
      setOriginalData((prev) => ({
        ...prev,
        first_name: formData.first_name,
        business_type: formData.business_type,
        business_size: formData.business_size,
      }));
      // Refresh user data
      await getUserData();
    }

    setSavingDetails(false);
  };

  const handleSaveICP = async () => {
    setSavingICP(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          ideal_target_client: formData.ideal_target_client,
          client_pain_points: formData.client_pain_points,
          unique_value_proposition: formData.unique_value_proposition,
          proof_points: formData.proof_points,
          content_strategy: formData.content_strategy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id);

      if (error) {
        throw new Error("Failed to update ICP data");
      }

      // Update original data state
      setOriginalData((prev) => ({
        ...prev,
        ideal_target_client: formData.ideal_target_client,
        client_pain_points: formData.client_pain_points,
        unique_value_proposition: formData.unique_value_proposition,
        proof_points: formData.proof_points,
        content_strategy: formData.content_strategy,
      }));
      // Refresh user data
      await getUserData();
      toast.success("ICP data updated successfully!");
    } catch (error) {
      console.error("Error updating ICP:", error);
      toast.error("Failed to update ICP data");
    } finally {
      setSavingICP(false);
    }
  };

  const handleSavePillars = async () => {
    setSavingPillars(true);
    const supabase = createClient();

    // Filter out empty content pillars
    const filteredPillars = formData.content_pillars.filter(
      (pillar) => pillar.trim() !== ""
    );

    const updateData = {
      content_pillars: filteredPillars,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", resolvedParams.id);

    if (error) {
      toast.error("Failed to update content pillars");
      console.error("Error updating content pillars:", error);
    } else {
      toast.success("Content pillars updated successfully");
      // Update original data for content pillars
      setOriginalData((prev) => ({
        ...prev,
        content_pillars: formData.content_pillars,
      }));
      // Refresh user data
      await getUserData();
    }

    setSavingPillars(false);
  };

  const handleCancel = () => {
    setFormData(originalData);
  };

  const handleMarkAsOnboarded = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Update profile_locked to false using direct SQL execution
      const { error } = await supabase
        .from("profiles")
        .update({
          profile_locked: false,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id);

      if (error) {
        console.error("Error updating profile lock:", error);
        toast.error("Failed to mark user as onboarded");
        return;
      }

      // Refresh user data to show updated status
      await getUserData();

      toast.success("User marked as onboarded successfully!");
    } catch (error) {
      console.error("Error marking user as onboarded:", error);
      toast.error("Failed to mark user as onboarded");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContentStrategy = async () => {
    setGeneratingStrategy(true);

    try {
      const response = await fetch("/api/admin/generate-content-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: resolvedParams.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content strategy");
      }

      // Update the form data with the generated strategy
      setFormData((prev) => ({
        ...prev,
        content_strategy: data.strategy,
      }));

      // Update the original data to reflect the change
      setOriginalData((prev) => ({
        ...prev,
        content_strategy: data.strategy,
      }));

      // Refresh user data to get the latest from database
      await getUserData();

      toast.success("Content strategy generated successfully!");
    } catch (error) {
      console.error("Error generating content strategy:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate content strategy"
      );
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const handleGenerateContentPillars = async () => {
    setGeneratingPillars(true);

    try {
      const response = await fetch("/api/admin/generate-content-pillars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: resolvedParams.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate content pillars");
      }

      // Update the form data with the generated pillars
      setFormData((prev) => ({
        ...prev,
        content_pillars: data.pillars,
      }));

      // Update the original data to reflect the change
      setOriginalData((prev) => ({
        ...prev,
        content_pillars: data.pillars,
      }));

      // Refresh user data to get the latest from database
      await getUserData();

      toast.success("Content pillars generated successfully!");
    } catch (error) {
      console.error("Error generating content pillars:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate content pillars"
      );
    } finally {
      setGeneratingPillars(false);
    }
  };

  const handleGeneratePrompts = async () => {
    setGeneratingPrompts(true);

    try {
      const response = await fetch("/api/admin/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: resolvedParams.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate prompts";

        // Handle specific error codes
        if (data.code === "quota_exceeded") {
          throw new Error(
            "⚠️ OpenAI API quota exceeded. Please check your billing at platform.openai.com and try again."
          );
        } else if (data.code === "auth_failed") {
          throw new Error(
            "🔑 OpenAI API authentication failed. Please check your API key configuration."
          );
        }

        throw new Error(errorMessage);
      }

      toast.success(`${data.count} prompts generated successfully!`);

      // Redirect to prompts page
      router.push(`/admin/users/${resolvedParams.id}/prompts`);
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate prompts"
      );
    } finally {
      setGeneratingPrompts(false);
    }
  };

  const handleUpgradeToMylancePremium = async () => {
    setUpgradingSubscription(true);
    const supabase = createClient();

    try {
      // Get current admin user for logging
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", resolvedParams.id)
        .single();

      if (existingSubscription) {
        // Update existing subscription to active
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_type: "monthly",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(), // 30 days from now
            canceled_at: null, // Clear any previous cancellation
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", resolvedParams.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase.from("subscriptions").insert({
          user_id: resolvedParams.id,
          plan_type: "monthly",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // Log admin activity
      if (currentUser) {
        // Get admin user record for logging
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", currentUser.id)
          .single();

        if (adminUser) {
          await supabase.from("admin_activity_log").insert({
            admin_id: adminUser.id,
            action: "upgrade_user_subscription",
            target_user_id: resolvedParams.id,
            target_type: "subscription",
            target_id: existingSubscription?.id?.toString(),
            details: {
              action: "manual_upgrade",
              new_plan: "monthly",
              previous_plan: existingSubscription?.plan_type || "free",
              admin_action: true,
            },
          });
        }
      }

      toast.success("User upgraded to Mylance Premium successfully!");

      // Refresh user data with a small delay to ensure database consistency
      setTimeout(async () => {
        await getUserData();
      }, 500);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast.error("Failed to upgrade user subscription");
    } finally {
      setUpgradingSubscription(false);
    }
  };

  // Check for changes in different sections
  const detailsChanged =
    formData.first_name !== originalData.first_name ||
    formData.business_type !== originalData.business_type ||
    formData.business_size !== originalData.business_size;

  const icpChanged =
    formData.ideal_target_client !== originalData.ideal_target_client ||
    formData.client_pain_points !== originalData.client_pain_points ||
    formData.unique_value_proposition !==
      originalData.unique_value_proposition ||
    formData.content_strategy !== originalData.content_strategy ||
    formData.proof_points !== originalData.proof_points;

  const pillarsChanged =
    JSON.stringify(formData.content_pillars) !==
    JSON.stringify(originalData.content_pillars);

  const hasChanges = detailsChanged || icpChanged || pillarsChanged;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    notFound();
  }

  const subscription = user.subscriptions?.[0];
  const userName = user.first_name || user.email.split("@")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                User Details
              </h2>
              <div className="flex items-center space-x-2">
                {detailsChanged && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          first_name: originalData.first_name,
                          business_type: originalData.business_type,
                          business_size: originalData.business_size,
                        }));
                      }}
                      disabled={savingDetails}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveDetails}
                      disabled={savingDetails}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {savingDetails ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <Input
                  value={user.email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Enter first name"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Business Type
                </label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value) =>
                    handleInputChange("business_type", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Business Size
                </label>
                <Select
                  value={formData.business_size}
                  onValueChange={(value) =>
                    handleInputChange("business_size", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="2-10">2-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="200+">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Subscription Plan
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <Input
                    value={subscription ? "Paid" : "Free"}
                    disabled
                    className="bg-gray-50"
                  />
                  {subscription && (
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        subscription.status === "active"
                          ? "bg-green-100 text-green-800"
                          : subscription.status === "canceled"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {subscription.status}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Posts Created
                </label>
                <Input
                  value={user.post_count.toString()}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              {subscription && subscription.current_period_end && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Subscription Period
                  </label>
                  <Input
                    value={`Ends on ${new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}`}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Onboarding Status
                </label>
                <Input
                  value={user.onboarding_completed ? "Completed" : "Pending"}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Profile Lock Status
                </label>
                <Input
                  value={user.profile_locked ? "Locked" : "Unlocked"}
                  disabled
                  className={`mt-1 ${
                    user.profile_locked
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Login
                </label>
                <Input
                  value={
                    user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : "Never"
                  }
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* ICP (Ideal Customer Profile) Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                ICP (Ideal Customer Profile)
              </h3>
              <div className="flex items-center space-x-2">
                {icpChanged && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          ideal_target_client: originalData.ideal_target_client,
                          client_pain_points: originalData.client_pain_points,
                          unique_value_proposition:
                            originalData.unique_value_proposition,
                          proof_points: originalData.proof_points,
                          content_strategy: originalData.content_strategy,
                        }));
                      }}
                      disabled={savingICP}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveICP}
                      disabled={savingICP}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {savingICP ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ideal Target Client
                </label>
                <Textarea
                  value={formData.ideal_target_client}
                  onChange={(e) =>
                    handleInputChange("ideal_target_client", e.target.value)
                  }
                  placeholder="Describe the ideal target client..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Client Pain Points
                </label>
                <Textarea
                  value={formData.client_pain_points}
                  onChange={(e) =>
                    handleInputChange("client_pain_points", e.target.value)
                  }
                  placeholder="Describe client pain points..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Unique Value Proposition
                </label>
                <Textarea
                  value={formData.unique_value_proposition}
                  onChange={(e) =>
                    handleInputChange(
                      "unique_value_proposition",
                      e.target.value
                    )
                  }
                  placeholder="Describe unique value proposition..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Proof Points
                </label>
                <Textarea
                  value={formData.proof_points}
                  onChange={(e) =>
                    handleInputChange("proof_points", e.target.value)
                  }
                  placeholder="Describe proof points, case studies, testimonials..."
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Content Strategy
                </label>
                <Textarea
                  value={formData.content_strategy}
                  onChange={(e) =>
                    handleInputChange("content_strategy", e.target.value)
                  }
                  placeholder="Describe the overall content strategy for LinkedIn..."
                  className="mt-1"
                  rows={4}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Overall strategy for LinkedIn content that aligns with
                  business goals and target audience
                </div>
              </div>
            </div>
          </div>

          {/* Content Pillars Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Content Pillars
              </h3>
              <div className="flex items-center space-x-2">
                {pillarsChanged && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          content_pillars: originalData.content_pillars,
                        }));
                      }}
                      disabled={savingPillars}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSavePillars}
                      disabled={savingPillars}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {savingPillars ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {formData.content_pillars.map((pillar, index) => (
                <div key={index}>
                  <label className="text-sm font-medium text-gray-500">
                    Content Pillar {index + 1}
                  </label>
                  <Input
                    value={pillar}
                    onChange={(e) =>
                      handleContentPillarChange(index, e.target.value)
                    }
                    placeholder={`Enter content pillar ${index + 1}...`}
                    className="mt-1"
                  />
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-2">
                Define 3 main topics/themes that guide your content strategy
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action Buttons */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {/* Subscription Management Button */}
              <button
                onClick={handleUpgradeToMylancePremium}
                disabled={upgradingSubscription || !!subscription}
                className={`w-full flex items-center justify-center p-4 rounded-lg shadow-lg transition-all duration-200 ease-in-out ${
                  upgradingSubscription || !!subscription
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:scale-105 hover:from-green-600 hover:to-green-700 cursor-pointer"
                }`}
              >
                <CreditCard className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {upgradingSubscription
                    ? "Upgrading..."
                    : subscription
                    ? "Already Premium User"
                    : "Upgrade to Mylance Premium"}
                </span>
              </button>

              {/* Mark as Onboarded Button */}
              <button
                onClick={handleMarkAsOnboarded}
                disabled={!user.profile_locked || loading}
                className={`w-full flex items-center justify-center p-4 rounded-lg shadow-lg transition-all duration-200 ease-in-out cursor-pointer ${
                  !user.profile_locked
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : loading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl transform hover:scale-105 hover:from-green-600 hover:to-green-700"
                }`}
              >
                <CheckCircle className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {loading
                    ? "Updating..."
                    : !user.profile_locked
                    ? "Already Onboarded"
                    : "Mark as Onboarded"}
                </span>
              </button>

              {/* Generate Content Strategy Button */}
              <button
                onClick={handleGenerateContentStrategy}
                disabled={generatingStrategy}
                className={`w-full flex items-center justify-center p-4 rounded-lg shadow-lg transform transition-all duration-200 ease-in-out cursor-pointer ${
                  generatingStrategy
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:scale-105 hover:from-blue-600 hover:to-blue-700"
                }`}
              >
                <Target className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {generatingStrategy
                    ? "Generating..."
                    : "Generate Content Strategy"}
                </span>
              </button>

              {/* Generate Content Pillars Button */}
              <button
                onClick={handleGenerateContentPillars}
                disabled={generatingPillars}
                className={`w-full flex items-center justify-center p-4 rounded-lg shadow-lg transform transition-all duration-200 ease-in-out cursor-pointer ${
                  generatingPillars
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl hover:scale-105 hover:from-purple-600 hover:to-purple-700"
                }`}
              >
                <Lightbulb className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {generatingPillars
                    ? "Generating..."
                    : "Generate Content Pillars"}
                </span>
              </button>

              {/* Generate Prompts Button */}
              <button
                onClick={handleGeneratePrompts}
                disabled={generatingPrompts}
                className={`w-full flex items-center justify-center p-4 rounded-lg shadow-lg transform transition-all duration-200 ease-in-out cursor-pointer ${
                  generatingPrompts
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-105 hover:from-orange-600 hover:to-orange-700"
                }`}
              >
                <Zap className="h-5 w-5 mr-3" />
                <span className="font-medium">
                  {generatingPrompts ? "Generating..." : "Generate Prompts"}
                </span>
              </button>

              {/* Manage Prompts Button */}
              <button
                onClick={() =>
                  router.push(`/admin/users/${resolvedParams.id}/prompts`)
                }
                className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out hover:from-indigo-600 hover:to-indigo-700 cursor-pointer"
              >
                <FileText className="h-5 w-5 mr-3" />
                <span className="font-medium">Manage Prompts</span>
              </button>

              {/* Feedbacks Button */}
              <button
                onClick={() =>
                  router.push(`/admin/users/${resolvedParams.id}/feedbacks`)
                }
                className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out hover:from-teal-600 hover:to-teal-700 cursor-pointer"
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                <span className="font-medium">Feedbacks</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
