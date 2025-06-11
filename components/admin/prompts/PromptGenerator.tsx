"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Sparkles,
  User,
  Clock,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DatabasePrompt } from "@/lib/openai/types";

interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  ideal_target_client?: string | null;
  client_pain_points?: string | null;
  unique_value_proposition?: string | null;
  proof_points?: string | null;
  energizing_topics?: string | null;
  decision_makers?: string | null;
  content_strategy?: string | null;
}

interface PromptGeneratorProps {
  selectedUser: UserWithDetails | null;
  onUserSelect: (user: UserWithDetails | null) => void;
  users: UserWithDetails[];
}

interface GenerationResult {
  prompts: DatabasePrompt[];
  stats: {
    totalGenerated: number;
    totalTokens: number;
    generationTime: number;
  };
}

export default function PromptGenerator({
  selectedUser,
  onUserSelect,
  users,
}: PromptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastGeneration, setLastGeneration] = useState<GenerationResult | null>(
    null
  );

  const handleGeneratePrompts = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // More realistic progress simulation for batch generation
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 85) return prev; // Stop at 85% until completion
        return prev + Math.random() * 8;
      });
    }, 2000); // Faster updates for Netlify limits

    try {
      console.log("Starting prompt generation for user:", selectedUser.id);

      // Call Next.js API route with Netlify-compatible timeout (12 seconds max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 12000); // 12 seconds timeout for Netlify Functions

      const response = await fetch("/api/admin/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response properly
      if (!response.ok) {
        let errorMessage = "Failed to generate prompts";

        try {
          const errorData = await response.text();
          if (errorData) {
            const parsed = JSON.parse(errorData);
            errorMessage = parsed.error || errorMessage;

            // Handle specific error codes
            if (parsed.code === "quota_exceeded") {
              errorMessage =
                "⚠️ OpenAI API quota exceeded. Please check your billing at platform.openai.com and try again.";
            } else if (parsed.code === "auth_failed") {
              errorMessage =
                "🔑 OpenAI API authentication failed. Please check your API key configuration.";
            }
          }
        } catch (e) {
          // If response is not JSON or empty, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      // Parse response safely
      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error("Empty response from server");
        }
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Invalid response format from server");
      }

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      console.log("Prompt generation successful:", data);

      // Update progress to completion
      setGenerationProgress(100);

      // Create result object matching the expected format
      const result: GenerationResult = {
        prompts: data.prompts || [],
        stats: {
          totalGenerated: data.count || 0,
          totalTokens: data.total_tokens || 0,
          generationTime: data.generation_time || 0,
        },
      };

      setLastGeneration(result);

      toast.success(
        `✅ Successfully generated ${data.count} prompts${
          data.batches_completed ? ` in ${data.batches_completed} batches` : ""
        } for ${selectedUser.first_name || selectedUser.email}`
      );
    } catch (error) {
      console.error("Error generating prompts:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error(
            "Request timed out. This is likely due to Netlify's function timeout. Please try again with a smaller batch."
          );
        } else if (error.message.includes("499")) {
          toast.error(
            "Client disconnected. The server may still be processing. Please wait and check if prompts were generated."
          );
        } else if (error.message.includes("fetch")) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("An unexpected error occurred while generating prompts");
      }
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const formatUserName = (user: UserWithDetails) => {
    return user.first_name || user.email.split("@")[0];
  };

  const hasRequiredData = (user: UserWithDetails | null) => {
    if (!user) return false;
    return !!(
      user.ideal_target_client &&
      user.client_pain_points &&
      user.unique_value_proposition &&
      user.proof_points
    );
  };

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Select User</span>
          </CardTitle>
          <CardDescription>
            Choose a user to generate LinkedIn content prompts for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedUser?.id || ""}
            onValueChange={(userId) => {
              const user = users.find((u) => u.id === userId) || null;
              onUserSelect(user);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <span>{formatUserName(user)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {user.email}
                    </Badge>
                    {hasRequiredData(user) ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* User Profile Summary */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>User Profile Summary</CardTitle>
            <CardDescription>
              Content strategy data for {formatUserName(selectedUser)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Ideal Target Client
                </h4>
                <p className="text-sm text-gray-900">
                  {selectedUser.ideal_target_client || "Not provided"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Client Pain Points
                </h4>
                <p className="text-sm text-gray-900">
                  {selectedUser.client_pain_points || "Not provided"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Unique Value Proposition
                </h4>
                <p className="text-sm text-gray-900">
                  {selectedUser.unique_value_proposition || "Not provided"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  Proof Points
                </h4>
                <p className="text-sm text-gray-900">
                  {selectedUser.proof_points || "Not provided"}
                </p>
              </div>
            </div>

            {!hasRequiredData(selectedUser) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">
                      Incomplete Profile Data
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">
                      This user is missing some required profile information.
                      Prompt generation may be less effective.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Settings */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Generate Content Prompts</span>
            </CardTitle>
            <CardDescription>
              Generate 20 LinkedIn content prompts in optimized batches for
              Netlify compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">
                    Batch Generation Process
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Prompts are generated in 2 batches of 10 for optimal
                    performance within Netlify timeout limits.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGeneratePrompts}
              disabled={isGenerating || !selectedUser}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating 20 Prompts...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate 20 Prompts
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Batch Generation Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} />
                <div className="text-xs text-gray-600 text-center">
                  Generating prompts in batches to ensure reliable delivery...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {lastGeneration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Generation Complete</span>
            </CardTitle>
            <CardDescription>
              Latest generation results and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">
                    Prompts Generated
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {lastGeneration.stats.totalGenerated}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    Tokens Used
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {lastGeneration.stats.totalTokens.toLocaleString()}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    Generation Time
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {(lastGeneration.stats.generationTime / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
