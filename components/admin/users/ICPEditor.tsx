"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface ICPEditorProps {
  userId: string;
  onSave?: () => void;
}

export default function ICPEditor({ userId, onSave }: ICPEditorProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [icpData, setIcpData] = useState({
    ideal_target_client: "",
    client_pain_points: "",
    unique_value_proposition: "",
    proof_points: "",
    energizing_topics: "",
    decision_makers: "",
    content_strategy: "",
  });

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile error:", error);
        throw new Error(
          `Profile fetch failed: ${error.message || JSON.stringify(error)}`
        );
      }

      if (!data) {
        throw new Error(`No profile found for user ID: ${userId}`);
      }

      setUser(data);
      setIcpData({
        ideal_target_client: data.ideal_target_client || "",
        client_pain_points: data.client_pain_points || "",
        unique_value_proposition: data.unique_value_proposition || "",
        proof_points: data.proof_points || "",
        energizing_topics: data.energizing_topics || "",
        decision_makers: data.decision_makers || "",
        content_strategy: data.content_strategy || "",
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          ideal_target_client: icpData.ideal_target_client,
          client_pain_points: icpData.client_pain_points,
          unique_value_proposition: icpData.unique_value_proposition,
          proof_points: icpData.proof_points,
          energizing_topics: icpData.energizing_topics,
          decision_makers: icpData.decision_makers,
          content_strategy: icpData.content_strategy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("ICP data updated successfully");
      onSave?.();
    } catch (error) {
      console.error("Error updating ICP data:", error);
      toast.error("Failed to update ICP data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Ideal Customer Profile (ICP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="ideal_target_client">Ideal Target Client</Label>
          <Textarea
            id="ideal_target_client"
            value={icpData.ideal_target_client}
            onChange={(e) =>
              setIcpData((prev) => ({
                ...prev,
                ideal_target_client: e.target.value,
              }))
            }
            placeholder="Describe the ideal customer profile in detail..."
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Define who your ideal customer is, including demographics, company
            size, role, etc.
          </p>
        </div>

        <div>
          <Label htmlFor="client_pain_points">Client Pain Points</Label>
          <Textarea
            id="client_pain_points"
            value={icpData.client_pain_points}
            onChange={(e) =>
              setIcpData((prev) => ({
                ...prev,
                client_pain_points: e.target.value,
              }))
            }
            placeholder="What are the main challenges and pain points your ICP faces?"
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            List the specific problems, challenges, and frustrations your ideal
            customers experience.
          </p>
        </div>

        <div>
          <Label htmlFor="unique_value_proposition">
            Unique Value Proposition
          </Label>
          <Textarea
            id="unique_value_proposition"
            value={icpData.unique_value_proposition}
            onChange={(e) =>
              setIcpData((prev) => ({
                ...prev,
                unique_value_proposition: e.target.value,
              }))
            }
            placeholder="What unique value do you provide that others don't?"
            rows={3}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Clearly articulate what makes your solution unique and valuable.
          </p>
        </div>

        <div>
          <Label htmlFor="proof_points">Proof Points & Credibility</Label>
          <Textarea
            id="proof_points"
            value={icpData.proof_points}
            onChange={(e) =>
              setIcpData((prev) => ({ ...prev, proof_points: e.target.value }))
            }
            placeholder="Evidence of your expertise, results, testimonials, case studies..."
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include specific results, testimonials, case studies,
            certifications, or other credibility markers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="energizing_topics">Energizing Topics</Label>
            <Textarea
              id="energizing_topics"
              value={icpData.energizing_topics}
              onChange={(e) =>
                setIcpData((prev) => ({
                  ...prev,
                  energizing_topics: e.target.value,
                }))
              }
              placeholder="Topics that energize and inspire you to create content..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              What subjects do you love talking about?
            </p>
          </div>

          <div>
            <Label htmlFor="decision_makers">Decision Makers</Label>
            <Textarea
              id="decision_makers"
              value={icpData.decision_makers}
              onChange={(e) =>
                setIcpData((prev) => ({
                  ...prev,
                  decision_makers: e.target.value,
                }))
              }
              placeholder="Who are the key decision makers in your ICP organizations?"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identify the roles and titles of people who make purchasing
              decisions.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="content_strategy">Content Strategy</Label>
          <Textarea
            id="content_strategy"
            value={icpData.content_strategy}
            onChange={(e) =>
              setIcpData((prev) => ({
                ...prev,
                content_strategy: e.target.value,
              }))
            }
            placeholder="Overall content strategy and approach for reaching your ICP..."
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your high-level approach to content creation and
            distribution.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save ICP Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
