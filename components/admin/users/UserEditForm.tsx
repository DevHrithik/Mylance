"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Target, Building, Globe } from "lucide-react";
import Link from "next/link";

interface UserEditFormProps {
  userId: string;
}

export default function UserEditForm({ userId }: UserEditFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state - only fields that exist in profiles table
  const [formData, setFormData] = useState({
    // Basic Profile
    first_name: "",
    email: "",
    linkedin_url: "",
    timezone: "",

    // Business Information
    business_type: "",
    business_size: "",
    business_stage: "",
    linkedin_importance: "",
    investment_willingness: "",
    posting_mindset: "",
    current_posting_frequency: "",
    client_attraction_methods: [] as string[],

    // ICP & Strategy
    ideal_target_client: "",
    client_pain_points: "",
    unique_value_proposition: "",
    proof_points: "",
    content_strategy: "",

    // Additional fields
    heard_about_mylance: "",
    content_pillars: [] as string[],
  });

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);

        // Handle specific error cases
        if (profileError.code === "PGRST116") {
          throw new Error(`User profile not found for ID: ${userId}`);
        } else if (
          profileError.message.includes("multiple (or no) rows returned")
        ) {
          throw new Error(
            `No profile found for user ID: ${userId}. User may not exist or you may not have permission to access it.`
          );
        } else {
          throw new Error(
            `Profile fetch failed: ${
              profileError.message || JSON.stringify(profileError)
            }`
          );
        }
      }

      if (!profileData) {
        throw new Error(`No profile found for user ID: ${userId}`);
      }

      // Populate form data
      setFormData({
        first_name: profileData.first_name || "",
        email: profileData.email || "",
        linkedin_url: profileData.linkedin_url || "",
        timezone: profileData.timezone || "",
        business_type: profileData.business_type || "",
        business_size: profileData.business_size || "",
        business_stage: profileData.business_stage || "",
        linkedin_importance: profileData.linkedin_importance || "",
        investment_willingness: profileData.investment_willingness || "",
        posting_mindset: profileData.posting_mindset || "",
        current_posting_frequency: profileData.current_posting_frequency || "",
        client_attraction_methods: Array.isArray(
          profileData.client_attraction_methods
        )
          ? profileData.client_attraction_methods
          : [],
        ideal_target_client: profileData.ideal_target_client || "",
        client_pain_points: profileData.client_pain_points || "",
        unique_value_proposition: profileData.unique_value_proposition || "",
        proof_points: profileData.proof_points || "",
        content_strategy: profileData.content_strategy || "",
        heard_about_mylance: profileData.heard_about_mylance || "",
        content_pillars: Array.isArray(profileData.content_pillars)
          ? profileData.content_pillars
          : [],
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error(
        `Failed to load user data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          email: formData.email,
          linkedin_url: formData.linkedin_url,
          timezone: formData.timezone,
          business_type: formData.business_type,
          business_size: formData.business_size,
          business_stage: formData.business_stage,
          linkedin_importance: formData.linkedin_importance,
          investment_willingness: formData.investment_willingness,
          posting_mindset: formData.posting_mindset,
          current_posting_frequency: formData.current_posting_frequency,
          client_attraction_methods: formData.client_attraction_methods,
          ideal_target_client: formData.ideal_target_client,
          client_pain_points: formData.client_pain_points,
          unique_value_proposition: formData.unique_value_proposition,
          proof_points: formData.proof_points,
          content_strategy: formData.content_strategy,
          heard_about_mylance: formData.heard_about_mylance,
          content_pillars: formData.content_pillars,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast.success("User profile updated successfully");
      router.push(`/admin/users/${userId}`);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/users/${userId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User
          </Link>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Basic Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) =>
                  handleInputChange("linkedin_url", e.target.value)
                }
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Business Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                value={formData.business_type}
                onChange={(e) =>
                  handleInputChange("business_type", e.target.value)
                }
                placeholder="e.g., Consulting, SaaS, E-commerce"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_size">Business Size</Label>
              <Input
                id="business_size"
                value={formData.business_size}
                onChange={(e) =>
                  handleInputChange("business_size", e.target.value)
                }
                placeholder="e.g., 1-10 employees"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_stage">Business Stage</Label>
              <Input
                id="business_stage"
                value={formData.business_stage}
                onChange={(e) =>
                  handleInputChange("business_stage", e.target.value)
                }
                placeholder="e.g., Startup, Growth, Mature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_importance">LinkedIn Importance</Label>
              <Input
                id="linkedin_importance"
                value={formData.linkedin_importance}
                onChange={(e) =>
                  handleInputChange("linkedin_importance", e.target.value)
                }
                placeholder="How important is LinkedIn to your business?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investment_willingness">
                Investment Willingness
              </Label>
              <Input
                id="investment_willingness"
                value={formData.investment_willingness}
                onChange={(e) =>
                  handleInputChange("investment_willingness", e.target.value)
                }
                placeholder="Willingness to invest in marketing"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heard_about_mylance">
                How did you hear about MyLance?
              </Label>
              <Input
                id="heard_about_mylance"
                value={formData.heard_about_mylance}
                onChange={(e) =>
                  handleInputChange("heard_about_mylance", e.target.value)
                }
                placeholder="Source of discovery"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LinkedIn Strategy Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            LinkedIn Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="posting_mindset">Posting Mindset</Label>
              <Input
                id="posting_mindset"
                value={formData.posting_mindset}
                onChange={(e) =>
                  handleInputChange("posting_mindset", e.target.value)
                }
                placeholder="Current approach to posting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_posting_frequency">
                Current Posting Frequency
              </Label>
              <Input
                id="current_posting_frequency"
                value={formData.current_posting_frequency}
                onChange={(e) =>
                  handleInputChange("current_posting_frequency", e.target.value)
                }
                placeholder="How often do you post?"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ICP & Strategy Card - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            ICP & Content Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ideal_target_client">Ideal Target Client</Label>
              <Textarea
                id="ideal_target_client"
                value={formData.ideal_target_client}
                onChange={(e) =>
                  handleInputChange("ideal_target_client", e.target.value)
                }
                placeholder="Describe the ideal target client..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_pain_points">Client Pain Points</Label>
              <Textarea
                id="client_pain_points"
                value={formData.client_pain_points}
                onChange={(e) =>
                  handleInputChange("client_pain_points", e.target.value)
                }
                placeholder="What pain points do your clients face?"
                rows={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unique_value_proposition">
                Unique Value Proposition
              </Label>
              <Textarea
                id="unique_value_proposition"
                value={formData.unique_value_proposition}
                onChange={(e) =>
                  handleInputChange("unique_value_proposition", e.target.value)
                }
                placeholder="What makes you unique?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof_points">Proof Points</Label>
              <Textarea
                id="proof_points"
                value={formData.proof_points}
                onChange={(e) =>
                  handleInputChange("proof_points", e.target.value)
                }
                placeholder="What proof points support your expertise?"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_strategy">Content Strategy</Label>
            <Textarea
              id="content_strategy"
              value={formData.content_strategy}
              onChange={(e) =>
                handleInputChange("content_strategy", e.target.value)
              }
              placeholder="Overall content strategy and approach..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
