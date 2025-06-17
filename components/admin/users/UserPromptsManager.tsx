"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  Wand2,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

interface ContentPrompt {
  id: number;
  user_id: string;
  category: string;
  pillar_number: number | null;
  pillar_description: string | null;
  prompt_text: string;
  hook: string;
  is_generated_by_admin: boolean;
  is_used: boolean;
  scheduled_date: string | null;
  created_by_admin: string | null;
  created_at: string;
  updated_at: string;
}

interface UserPromptsManagerProps {
  userId: string;
}

const CONTENT_CATEGORIES = [
  "First-person anecdote",
  "Listicle with a hook",
  "Educational how-to post",
  "Thought leadership/opinion piece",
  "Case study/success story",
  "Engagement-driven question",
];

export default function UserPromptsManager({
  userId,
}: UserPromptsManagerProps) {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [prompts, setPrompts] = useState<ContentPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<ContentPrompt | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    category: "",
    pillar_number: 1,
    pillar_description: "",
    prompt_text: "",
    hook: "",
    scheduled_date: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchPrompts();
  }, [userId]);

  const fetchUserData = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error(
        `Failed to load user data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);

      // Check if content_prompts table exists
      const { data, error } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error && error.code !== "42P01") {
        // Table doesn't exist error
        console.error("Prompts error:", error);
        throw new Error(
          `Prompts fetch failed: ${error.message || JSON.stringify(error)}`
        );
      }

      setPrompts(data as ContentPrompt[]);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      // If table doesn't exist, just show empty state
      setPrompts([]);
      if (error instanceof Error && !error.message.includes("does not exist")) {
        toast.error(`Failed to load prompts: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generatePromptsForUser = async () => {
    if (!user) return;

    try {
      setIsGenerating(true);

      const response = await fetch("/api/admin/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompts");
      }

      const result = await response.json();
      toast.success(`Generated ${result.promptsCreated} prompts for user`);

      // Refresh prompts
      await fetchPrompts();
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast.error("Failed to generate prompts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPrompt = (prompt: ContentPrompt) => {
    setSelectedPrompt(prompt);
    setEditForm({
      category: prompt.category,
      pillar_number: prompt.pillar_number || 1,
      pillar_description: prompt.pillar_description || "",
      prompt_text: prompt.prompt_text,
      hook: prompt.hook,
      scheduled_date: prompt.scheduled_date || "",
    });
    setIsEditing(true);
    setIsEditDialogOpen(true);
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      const { error } = await supabase
        .from("content_prompts")
        .update({
          category: editForm.category,
          pillar_number: editForm.pillar_number,
          pillar_description: editForm.pillar_description,
          prompt_text: editForm.prompt_text,
          hook: editForm.hook,
          scheduled_date: editForm.scheduled_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPrompt.id);

      if (error) throw error;

      toast.success("Prompt updated successfully");
      setIsEditing(false);
      setSelectedPrompt(null);
      setIsEditDialogOpen(false);
      await fetchPrompts();
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Failed to update prompt");
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    try {
      const { error } = await supabase
        .from("content_prompts")
        .delete()
        .eq("id", promptId);

      if (error) throw error;

      toast.success("Prompt deleted successfully");
      await fetchPrompts();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error("Failed to delete prompt");
    }
  };

  const togglePromptUsed = async (prompt: ContentPrompt) => {
    try {
      const { error } = await supabase
        .from("content_prompts")
        .update({
          is_used: !prompt.is_used,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prompt.id);

      if (error) throw error;

      toast.success(`Prompt marked as ${!prompt.is_used ? "used" : "unused"}`);
      await fetchPrompts();
    } catch (error) {
      console.error("Error updating prompt status:", error);
      toast.error("Failed to update prompt status");
    }
  };

  const getPromptStats = () => {
    const total = prompts.length;
    const used = prompts.filter((p) => p.is_used).length;
    const scheduled = prompts.filter((p) => p.scheduled_date).length;
    const byCategory = prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, used, scheduled, byCategory };
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

  const stats = getPromptStats();

  return (
    <div className="space-y-6">
      {/* Header with Generation Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Prompts for {user.first_name || user.email}
          </h3>
          <p className="text-sm text-gray-500">
            Manage AI-generated content prompts and scheduling
          </p>
        </div>
        <Button
          onClick={generatePromptsForUser}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Generate New Prompts
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Prompts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.used}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.scheduled}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total - stats.used}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList>
          <TabsTrigger value="prompts">All Prompts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4">
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No prompts generated yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Generate AI-powered content prompts based on this user&apos;s
                  ICP and business profile.
                </p>
                <Button
                  onClick={generatePromptsForUser}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Generate Prompts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Content Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Pillar</TableHead>
                      <TableHead>Hook</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prompts.map((prompt) => (
                      <TableRow key={prompt.id}>
                        <TableCell>
                          <Badge variant="outline">{prompt.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {prompt.pillar_number && (
                            <Badge variant="secondary">
                              Pillar {prompt.pillar_number}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {prompt.hook}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={prompt.is_used ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => togglePromptUsed(prompt)}
                          >
                            {prompt.is_used ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {prompt.is_used ? "Used" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {prompt.scheduled_date ? (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {format(new Date(prompt.scheduled_date), "MMM d")}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedPrompt(prompt)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPrompt(prompt)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePrompt(prompt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usage Rate</span>
                    <span className="font-medium">
                      {stats.total > 0
                        ? Math.round((stats.used / stats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Prompts Remaining
                    </span>
                    <span className="font-medium">
                      {stats.total - stats.used}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Scheduled Content
                    </span>
                    <span className="font-medium">{stats.scheduled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Prompt View/Edit Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {isEditing ? "Edit Prompt" : "View Prompt"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPrompt(null);
                    setIsEditing(false);
                  }}
                >
                  ×
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pillar_number">Pillar Number</Label>
                      <Select
                        value={editForm.pillar_number.toString()}
                        onValueChange={(value) =>
                          setEditForm((prev) => ({
                            ...prev,
                            pillar_number: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Pillar 1</SelectItem>
                          <SelectItem value="2">Pillar 2</SelectItem>
                          <SelectItem value="3">Pillar 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scheduled_date">
                        Scheduled Date
                        <span className="text-xs text-gray-500 ml-2">
                          (Only Monday, Wednesday, Friday allowed)
                        </span>
                      </Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={editForm.scheduled_date}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          if (selectedDate) {
                            // Validate it's M/W/F
                            const date = new Date(selectedDate + "T00:00:00");
                            const dayOfWeek = date.getDay();
                            if (
                              dayOfWeek !== 1 &&
                              dayOfWeek !== 3 &&
                              dayOfWeek !== 5
                            ) {
                              toast.error(
                                "Please select Monday, Wednesday, or Friday only"
                              );
                              return;
                            }
                          }
                          setEditForm((prev) => ({
                            ...prev,
                            scheduled_date: selectedDate,
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pillar_description">
                      Pillar Description
                    </Label>
                    <Input
                      id="pillar_description"
                      value={editForm.pillar_description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          pillar_description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of the content pillar"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hook">Hook</Label>
                    <Textarea
                      id="hook"
                      value={editForm.hook}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          hook: e.target.value,
                        }))
                      }
                      placeholder="Engaging hook for the content"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prompt_text">Prompt Text</Label>
                    <Textarea
                      id="prompt_text"
                      value={editForm.prompt_text}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          prompt_text: e.target.value,
                        }))
                      }
                      placeholder="Full prompt text"
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSavePrompt}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedPrompt.category}</Badge>
                    {selectedPrompt.pillar_number && (
                      <Badge variant="secondary">
                        Pillar {selectedPrompt.pillar_number}
                      </Badge>
                    )}
                    <Badge
                      variant={selectedPrompt.is_used ? "default" : "secondary"}
                    >
                      {selectedPrompt.is_used ? "Used" : "Available"}
                    </Badge>
                  </div>

                  <div>
                    <Label>Hook</Label>
                    <p className="mt-1 text-gray-900">{selectedPrompt.hook}</p>
                  </div>

                  <div>
                    <Label>Prompt</Label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {selectedPrompt.prompt_text}
                    </p>
                  </div>

                  {selectedPrompt.pillar_description && (
                    <div>
                      <Label>Pillar Description</Label>
                      <p className="mt-1 text-gray-900">
                        {selectedPrompt.pillar_description}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => togglePromptUsed(selectedPrompt)}
                    >
                      Mark as {selectedPrompt.is_used ? "Unused" : "Used"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pillar Number</Label>
                <Select
                  value={editForm.pillar_number.toString()}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      pillar_number: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Pillar 1</SelectItem>
                    <SelectItem value="2">Pillar 2</SelectItem>
                    <SelectItem value="3">Pillar 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pillar Description</Label>
              <Input
                value={editForm.pillar_description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    pillar_description: e.target.value,
                  }))
                }
                placeholder="Brief description of the content pillar"
              />
            </div>

            <div className="space-y-2">
              <Label>Hook</Label>
              <Input
                value={editForm.hook}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, hook: e.target.value }))
                }
                placeholder="Engaging hook for the post"
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt Text</Label>
              <Textarea
                value={editForm.prompt_text}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    prompt_text: e.target.value,
                  }))
                }
                placeholder="Full prompt text for content generation"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Scheduled Date
                <span className="text-xs text-gray-500 ml-2">
                  (Only Monday, Wednesday, Friday allowed)
                </span>
              </Label>
              <Input
                type="date"
                value={editForm.scheduled_date}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate) {
                    // Validate it's M/W/F
                    const date = new Date(selectedDate + "T00:00:00");
                    const dayOfWeek = date.getDay();
                    if (dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5) {
                      toast.error(
                        "Please select Monday, Wednesday, or Friday only"
                      );
                      return;
                    }
                  }
                  setEditForm((prev) => ({
                    ...prev,
                    scheduled_date: selectedDate,
                  }));
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePrompt}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
