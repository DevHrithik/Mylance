"use client";

import { useState, useEffect, useCallback, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatSimpleDate,
  formatDateForInput,
  formatDateForDatabase,
} from "@/lib/utils/date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Edit,
  Trash2,
  RotateCcw,
  CalendarDays,
  Plus,
  MessageSquare,
  Filter,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ContentPrompt {
  id: number;
  category: string;
  pillar_number: number;
  pillar_description: string;
  prompt_text: string;
  hook: string;
  is_used: boolean;
  scheduled_date: string | null;
  pushed_to_calendar: boolean;
  created_at: string;
  feedback_rating?: number;
  feedback_text?: string;
  improvement_suggestions?: string;
  feedback_given_at?: string;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  content_pillars?: string[];
}

type FilterType = "all" | "pushed" | "used" | "feedback" | "remaining";

export default function UserPromptsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [prompts, setPrompts] = useState<ContentPrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<ContentPrompt[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [pushingToCalendar, setPushingToCalendar] = useState<{
    [key: number]: boolean;
  }>({});
  const [pushingAllToCalendar, setPushingAllToCalendar] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ContentPrompt | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    category: "",
    pillar_description: "",
    prompt_text: "",
    hook: "",
    scheduled_date: "",
  });
  const [deletePromptId, setDeletePromptId] = useState<number | null>(null);
  const [feedbackPrompt, setFeedbackPrompt] = useState<ContentPrompt | null>(
    null
  );
  const [feedbackForm, setFeedbackForm] = useState({
    rating: "",
    feedback_text: "",
    improvement_suggestions: "",
  });
  const [savingFeedback, setSavingFeedback] = useState(false);

  const categories = [
    "First-person anecdote",
    "Listicle with a hook",
    "Educational how-to post",
    "Thought leadership/opinion piece",
    "Case study/success story",
    "Engagement-driven question",
  ];

  // Filter prompts based on active filter
  useEffect(() => {
    let filtered = [...prompts];

    switch (activeFilter) {
      case "pushed":
        filtered = prompts.filter((p) => p.pushed_to_calendar);
        break;
      case "used":
        filtered = prompts.filter((p) => p.is_used);
        break;
      case "feedback":
        filtered = prompts.filter((p) => p.feedback_rating);
        break;
      case "remaining":
        filtered = prompts.filter((p) => !p.is_used);
        break;
      default:
        filtered = prompts;
    }

    setFilteredPrompts(filtered);
  }, [prompts, activeFilter]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Fetch user data with content pillars
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email, first_name, content_pillars")
        .eq("id", resolvedParams.id)
        .single();

      if (userError || !userData) {
        console.error("User not found:", userError);
        toast.error("User not found");
        // Use window.location instead of router.push to avoid navigation issues
        window.location.href = "/admin/users";
        return;
      }

      setUser(userData);

      // Fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", resolvedParams.id)
        .eq("is_generated_by_admin", true)
        .order("scheduled_date", { ascending: true });

      if (promptsError) {
        console.error("Error fetching prompts:", promptsError);
        toast.error("Failed to fetch prompts");
      } else {
        setPrompts(promptsData || []);
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegeneratePrompts = async () => {
    setRegenerating(true);

    try {
      const response = await fetch("/api/admin/generate-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: resolvedParams.id,
          includeFeedback: true, // Include feedback for better prompts
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate prompts");
      }

      toast.success(`${data.count} prompts regenerated successfully!`);
      await fetchData();
    } catch (error) {
      console.error("Error regenerating prompts:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to regenerate prompts"
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handlePushToCalendar = async (promptId: number) => {
    setPushingToCalendar((prev) => ({ ...prev, [promptId]: true }));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_prompts")
        .update({ pushed_to_calendar: true })
        .eq("id", promptId);

      if (error) {
        throw new Error("Failed to update calendar status");
      }

      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.id === promptId
            ? { ...prompt, pushed_to_calendar: true }
            : prompt
        )
      );

      toast.success("Prompt pushed to calendar!");
    } catch (error) {
      console.error("Error pushing to calendar:", error);
      toast.error("Failed to push to calendar");
    } finally {
      setPushingToCalendar((prev) => ({ ...prev, [promptId]: false }));
    }
  };

  const handlePushAllToCalendar = async () => {
    setPushingAllToCalendar(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_prompts")
        .update({ pushed_to_calendar: true })
        .eq("user_id", resolvedParams.id)
        .eq("is_generated_by_admin", true);

      if (error) {
        throw new Error("Failed to update calendar status");
      }

      setPrompts((prev) =>
        prev.map((prompt) => ({ ...prompt, pushed_to_calendar: true }))
      );

      toast.success("All prompts pushed to calendar!");
    } catch (error) {
      console.error("Error pushing all to calendar:", error);
      toast.error("Failed to push all to calendar");
    } finally {
      setPushingAllToCalendar(false);
    }
  };

  const handleEditPrompt = (prompt: ContentPrompt) => {
    setEditingPrompt(prompt);

    // Get the actual pillar description from user's content pillars, fallback to stored description
    const actualPillarDescription =
      user?.content_pillars?.[prompt.pillar_number - 1] ||
      prompt.pillar_description ||
      `Pillar ${prompt.pillar_number}`;

    setEditForm({
      category: prompt.category,
      pillar_description: actualPillarDescription,
      prompt_text: prompt.prompt_text,
      hook: prompt.hook,
      scheduled_date: formatDateForInput(prompt.scheduled_date),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPrompt) return;

    try {
      const supabase = createClient();

      const formattedDate = formatDateForDatabase(editForm.scheduled_date);

      console.log("Updating prompt:", editingPrompt.id, "with data:", {
        category: editForm.category,
        pillar_description: editForm.pillar_description,
        prompt_text: editForm.prompt_text,
        hook: editForm.hook,
        scheduled_date: formattedDate,
      });

      const { data, error } = await supabase
        .from("content_prompts")
        .update({
          category: editForm.category,
          pillar_description: editForm.pillar_description,
          prompt_text: editForm.prompt_text,
          hook: editForm.hook,
          scheduled_date: formattedDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPrompt.id)
        .select();

      if (error) {
        console.error("Database update error:", error);
        throw new Error(`Failed to update prompt: ${error.message}`);
      }

      console.log("Database update successful:", data);

      // Update local state
      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.id === editingPrompt.id
            ? {
                ...prompt,
                category: editForm.category,
                pillar_description: editForm.pillar_description,
                prompt_text: editForm.prompt_text,
                hook: editForm.hook,
                scheduled_date: formattedDate || editForm.scheduled_date,
              }
            : prompt
        )
      );

      setEditingPrompt(null);
      toast.success("Prompt updated successfully!");

      // Refresh data from database to ensure consistency
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Failed to update prompt");
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_prompts")
        .delete()
        .eq("id", promptId);

      if (error) {
        console.error("Delete error:", error);
        throw new Error(`Failed to delete prompt: ${error.message}`);
      }

      setPrompts((prev) => prev.filter((prompt) => prompt.id !== promptId));
      setDeletePromptId(null);
      toast.success("Prompt deleted successfully!");
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete prompt"
      );
    }
  };

  const handleOpenFeedback = (prompt: ContentPrompt) => {
    setFeedbackPrompt(prompt);
    setFeedbackForm({
      rating: prompt.feedback_rating?.toString() || "",
      feedback_text: prompt.feedback_text || "",
      improvement_suggestions: prompt.improvement_suggestions || "",
    });
  };

  const handleSaveFeedback = async () => {
    if (!feedbackPrompt) return;

    setSavingFeedback(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_prompts")
        .update({
          feedback_rating: parseInt(feedbackForm.rating),
          feedback_text: feedbackForm.feedback_text,
          improvement_suggestions: feedbackForm.improvement_suggestions,
          feedback_given_at: new Date().toISOString(),
        })
        .eq("id", feedbackPrompt.id);

      if (error) {
        throw new Error("Failed to save feedback");
      }

      // Update the local state
      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.id === feedbackPrompt.id
            ? {
                ...prompt,
                feedback_rating: parseInt(feedbackForm.rating),
                feedback_text: feedbackForm.feedback_text,
                improvement_suggestions: feedbackForm.improvement_suggestions,
                feedback_given_at: new Date().toISOString(),
              }
            : prompt
        )
      );

      setFeedbackPrompt(null);
      toast.success("Feedback saved successfully!");
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Failed to save feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const clearFilter = () => {
    setActiveFilter("all");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">User not found</div>
      </div>
    );
  }

  const userName = user.first_name || user.email.split("@")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/${user.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Content Prompts for {userName}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <p>{user.email}</p>
              <span className="text-gray-400">•</span>
              <p>{prompts.length} prompts total</p>
            </div>
            {activeFilter !== "all" && (
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered: {filteredPrompts.length} of {prompts.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRegeneratePrompts}
            disabled={regenerating}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {regenerating ? "Regenerating..." : "Regenerate Prompts"}
          </Button>
          <Button
            onClick={handleRegeneratePrompts}
            disabled={regenerating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {regenerating ? "Generating..." : "Generate New Prompts"}
          </Button>
          <Button
            onClick={handlePushAllToCalendar}
            disabled={pushingAllToCalendar || prompts.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {pushingAllToCalendar ? "Pushing..." : "Push All to Calendar"}
          </Button>
        </div>
      </div>

      {/* Stats - Now Clickable Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => handleFilterChange("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prompts.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === "pushed" ? "ring-2 ring-green-500 bg-green-50" : ""
          }`}
          onClick={() => handleFilterChange("pushed")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pushed to Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter((p) => p.pushed_to_calendar).length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === "used" ? "ring-2 ring-purple-500 bg-purple-50" : ""
          }`}
          onClick={() => handleFilterChange("used")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter((p) => p.is_used).length}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === "feedback"
              ? "ring-2 ring-orange-500 bg-orange-50"
              : ""
          }`}
          onClick={() => handleFilterChange("feedback")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter((p) => p.feedback_rating).length}
            </div>
            {prompts.filter((p) => p.feedback_rating).length > 0 && (
              <div className="text-xs text-gray-500">
                Avg:{" "}
                {(
                  prompts
                    .filter((p) => p.feedback_rating)
                    .reduce((sum, p) => sum + (p.feedback_rating || 0), 0) /
                  prompts.filter((p) => p.feedback_rating).length
                ).toFixed(1)}
                /5
              </div>
            )}
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            activeFilter === "remaining"
              ? "ring-2 ring-gray-500 bg-gray-50"
              : ""
          }`}
          onClick={() => handleFilterChange("remaining")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prompts.filter((p) => !p.is_used).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prompts List */}
      {filteredPrompts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeFilter === "all"
                ? "No Prompts Found"
                : `No ${activeFilter} prompts found`}
            </CardTitle>
            <CardDescription>
              {activeFilter === "all"
                ? "Generate prompts for this user to get started."
                : `No prompts match the current filter. Try a different filter or generate new prompts.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeFilter === "all" ? (
              <Button onClick={handleRegeneratePrompts} disabled={regenerating}>
                <Plus className="h-4 w-4 mr-2" />
                {regenerating ? "Generating..." : "Generate Prompts"}
              </Button>
            ) : (
              <Button onClick={clearFilter} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPrompts.map((prompt, index) => (
            <Card key={prompt.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs">
                      Prompt #{prompts.findIndex((p) => p.id === prompt.id) + 1}
                    </Badge>
                    <Badge variant="secondary">{prompt.category}</Badge>
                    {prompt.pushed_to_calendar && (
                      <Badge className="bg-green-100 text-green-800">
                        <CalendarCheck className="h-3 w-3 mr-1" />
                        In Calendar
                      </Badge>
                    )}
                    {prompt.is_used && (
                      <Badge className="bg-blue-100 text-blue-800">Used</Badge>
                    )}
                    {prompt.feedback_rating && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Feedback: {prompt.feedback_rating}/5
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFeedback(prompt)}
                      className={
                        prompt.feedback_rating
                          ? "text-orange-600 hover:text-orange-700 border-orange-200"
                          : "text-blue-600 hover:text-blue-700"
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Feedback
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePromptId(prompt.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {!prompt.pushed_to_calendar && (
                      <Button
                        size="sm"
                        onClick={() => handlePushToCalendar(prompt.id)}
                        disabled={pushingToCalendar[prompt.id]}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {pushingToCalendar[prompt.id]
                          ? "Pushing..."
                          : "Push to Calendar"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Hook:</h4>
                    <p className="text-gray-700 italic">{prompt.hook}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Prompt:</h4>
                    <p className="text-gray-700">{prompt.prompt_text}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Content Pillar:
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {user?.content_pillars?.[prompt.pillar_number - 1] ||
                        prompt.pillar_description ||
                        `Pillar ${prompt.pillar_number}`}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Scheduled for: {formatSimpleDate(prompt.scheduled_date)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Created {new Date(prompt.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPrompt}
        onOpenChange={() => setEditingPrompt(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to the prompt details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Pillar Description</label>
              <Textarea
                value={editForm.pillar_description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    pillar_description: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Describe the content pillar this prompt relates to..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hook</label>
              <Textarea
                value={editForm.hook}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, hook: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={editForm.prompt_text}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    prompt_text: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input
                type="date"
                value={editForm.scheduled_date}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    scheduled_date: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={!!feedbackPrompt}
        onOpenChange={() => setFeedbackPrompt(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {feedbackPrompt?.feedback_rating
                ? "Edit Feedback"
                : "Provide Feedback"}
            </DialogTitle>
            <DialogDescription>
              Your feedback helps us generate better prompts for this user in
              the future.
              {feedbackPrompt?.feedback_given_at && (
                <span className="block text-xs text-gray-500 mt-1">
                  Last updated:{" "}
                  {new Date(
                    feedbackPrompt.feedback_given_at
                  ).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating (1-5)</label>
              <Select
                value={feedbackForm.rating}
                onValueChange={(value) =>
                  setFeedbackForm((prev) => ({ ...prev, rating: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Poor</SelectItem>
                  <SelectItem value="2">2 - Below Average</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={feedbackForm.feedback_text}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    feedback_text: e.target.value,
                  }))
                }
                placeholder="What did you like or dislike about this prompt?"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Improvement Suggestions
              </label>
              <Textarea
                value={feedbackForm.improvement_suggestions}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    improvement_suggestions: e.target.value,
                  }))
                }
                placeholder="How can we improve this type of prompt for this user?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackPrompt(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveFeedback}
              disabled={savingFeedback || !feedbackForm.rating}
            >
              {savingFeedback
                ? "Saving..."
                : feedbackPrompt?.feedback_rating
                ? "Update Feedback"
                : "Save Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletePromptId}
        onOpenChange={() => setDeletePromptId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePromptId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletePromptId && handleDeletePrompt(deletePromptId)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
