"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Calendar, Edit, Library } from "lucide-react";
import { PromptData } from "@/hooks/useDashboardData";
import {
  FeedbackButton,
  QuickRating,
} from "@/components/common/FeedbackButton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PromptLibraryProps {
  prompts: PromptData[];
  onPromptsChange?: () => void;
  activeView: "calendar" | "library";
  onViewChange: (view: "calendar" | "library") => void;
}

// Map database categories to display categories
const mapCategory = (
  category: string
): "educational" | "story" | "question" | "promotional" | "personal" => {
  switch (category.toLowerCase()) {
    case "educational how-to post":
      return "educational";
    case "first-person anecdote":
      return "story";
    case "engagement-driven question":
      return "question";
    case "thought leadership/opinion piece":
      return "promotional";
    case "case study/success story":
      return "personal";
    case "listicle with a hook":
      return "educational";
    default:
      return "educational";
  }
};

const categoryColors = {
  educational: "bg-purple-100 text-purple-700 border-purple-200",
  story: "bg-blue-100 text-blue-700 border-blue-200",
  question: "bg-yellow-100 text-yellow-700 border-yellow-200",
  promotional: "bg-orange-100 text-orange-700 border-orange-200",
  personal: "bg-pink-100 text-pink-700 border-pink-200",
};

export function PromptLibrary({
  prompts,
  onPromptsChange,
  activeView,
  onViewChange,
}: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");
  const [showUsedPrompts, setShowUsedPrompts] = useState(false);
  const [contentPillars, setContentPillars] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const supabase = createClient();

  // Fetch user's content pillars
  useEffect(() => {
    const fetchContentPillars = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("content_pillars")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching content pillars:", error);
          return;
        }

        if (
          profileData?.content_pillars &&
          Array.isArray(profileData.content_pillars)
        ) {
          setContentPillars(profileData.content_pillars);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchContentPillars();
  }, [supabase]);

  // Get pillar content by number
  const getPillarContent = (pillarNumber: number): string => {
    if (!contentPillars || contentPillars.length === 0) {
      return `Pillar ${pillarNumber}`;
    }

    const pillarIndex = pillarNumber - 1;
    if (pillarIndex < contentPillars.length) {
      const content = contentPillars[pillarIndex] || `Pillar ${pillarNumber}`;
      return `Pillar ${pillarNumber}: ${content}`;
    }

    return `Pillar ${pillarNumber}`;
  };

  // Handle schedule date update
  const handleUpdateScheduleDate = async () => {
    if (!editingPrompt || !newScheduleDate) return;

    try {
      const { error } = await supabase
        .from("content_prompts")
        .update({ scheduled_date: newScheduleDate })
        .eq("id", editingPrompt.id);

      if (error) {
        console.error("Error updating schedule date:", error);
        toast.error("Failed to update schedule date");
        return;
      }

      toast.success("Schedule date updated successfully");
      setIsDialogOpen(false);
      setEditingPrompt(null);
      setNewScheduleDate("");

      // Call the callback to refresh data in parent component
      if (onPromptsChange) {
        onPromptsChange();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update schedule date");
    }
  };

  // Transform database prompts to display format
  const displayPrompts = prompts.map((prompt) => ({
    id: prompt.id.toString(),
    title:
      prompt.prompt_text.length > 100
        ? prompt.prompt_text.substring(0, 100) + "..."
        : prompt.prompt_text,
    hook: prompt.hook,
    category: mapCategory(prompt.category),
    theme: getPillarContent(prompt.pillar_number || 1),
    tags: [prompt.category.toLowerCase().replace(/\s+/g, "-")],
    scheduledDate: prompt.scheduled_date,
    isUsed: prompt.is_used,
    pillarNumber: prompt.pillar_number,
  }));

  const filteredPrompts = displayPrompts
    .filter((prompt) => {
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType =
        selectedType === "all" || prompt.category === selectedType;
      const matchesTheme =
        selectedTheme === "all" || prompt.theme === selectedTheme;

      // Filter by used/available status
      const matchesUsedFilter = showUsedPrompts
        ? prompt.isUsed
        : !prompt.isUsed;

      return matchesSearch && matchesType && matchesTheme && matchesUsedFilter;
    })
    .sort((a, b) => {
      // Sort by scheduled date: most recently upcoming to furthest future
      // Prompts without scheduled dates go to the end
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1; // a goes to end
      if (!b.scheduledDate) return -1; // b goes to end

      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);

      return dateA.getTime() - dateB.getTime(); // Ascending order (earliest first)
    });

  const uniqueThemes = Array.from(
    new Set(displayPrompts.map((prompt) => prompt.theme))
  );

  const renderPromptCard = (prompt: (typeof displayPrompts)[0]) => (
    <Card
      key={prompt.id}
      className={`hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col ${
        prompt.isUsed ? "opacity-60" : ""
      }`}
      onClick={() => {
        // Navigate to create post page with prompt data
        window.location.href = `/posts/create?prompt=${prompt.id}`;
      }}
    >
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Category Badge and Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  categoryColors[prompt.category]
                }`}
              >
                {prompt.category}
              </span>
              {prompt.isUsed && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  Used
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center space-x-1 text-xs h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPrompt(prompt);
                  setNewScheduleDate(prompt.scheduledDate || "");
                  setIsDialogOpen(true);
                }}
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Edit Date</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center space-x-1 text-xs h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/posts/create?prompt=${prompt.id}`;
                }}
                disabled={prompt.isUsed}
              >
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {prompt.scheduledDate ? "Scheduled" : "Schedule"}
                </span>
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="min-h-0">
            <h3 className="font-semibold text-gray-900 leading-tight text-sm break-words">
              {prompt.title}
            </h3>
          </div>

          {/* Hook */}
          <div className="min-h-0">
            <p className="text-gray-600 text-xs leading-relaxed break-words">
              <span className="font-medium">Hook:</span> {prompt.hook}
            </p>
          </div>

          {/* Theme and Scheduled Date */}
          <div className="space-y-3 flex-1">
            <div className="text-xs text-gray-500 break-words min-h-0">
              {prompt.theme}
            </div>

            {prompt.scheduledDate && (
              <div className="text-xs text-blue-600 font-medium">
                Scheduled: {new Date(prompt.scheduledDate).toLocaleDateString()}
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {prompt.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Feedback Section */}
          <div
            className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto"
            onClick={(e) => e.stopPropagation()} // Prevent card click
          >
            <QuickRating type="prompt" targetId={parseInt(prompt.id)} />
            <FeedbackButton
              type="prompt"
              targetId={parseInt(prompt.id)}
              title={prompt.title}
              content={prompt.hook}
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-3"
            >
              Feedback
            </FeedbackButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="w-full space-y-6">
        {/* View Toggle Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prompt Library</h2>
            <p className="text-gray-600 mt-1">
              Plan, schedule, and manage your LinkedIn content strategy
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {prompts.length} total prompts,{" "}
              {prompts.filter((p) => !p.is_used).length} available
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeView === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("calendar")}
                className="flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </Button>
              <Button
                variant={activeView === "library" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("library")}
                className="flex items-center space-x-2"
              >
                <Library className="h-4 w-4" />
                <span>Library</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts, hooks, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                {uniqueThemes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme.length > 30 ? theme.substring(0, 30) + "..." : theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={!showUsedPrompts ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowUsedPrompts(false)}
                className="flex items-center space-x-2 text-xs px-3"
              >
                <span>Available</span>
                <span className="text-xs opacity-75">
                  ({displayPrompts.filter((p) => !p.isUsed).length})
                </span>
              </Button>
              <Button
                variant={showUsedPrompts ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowUsedPrompts(true)}
                className="flex items-center space-x-2 text-xs px-3"
              >
                <span>Used</span>
                <span className="text-xs opacity-75">
                  ({displayPrompts.filter((p) => p.isUsed).length})
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPrompts.map(renderPromptCard)}
        </div>

        {/* Empty State */}
        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No prompts found matching your criteria
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* No prompts at all */}
        {prompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No prompts available yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Contact your admin to generate prompts for your account
            </p>
          </div>
        )}
      </div>

      {/* Edit Schedule Date Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Scheduled Date
              </label>
              <Input
                type="date"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingPrompt(null);
                  setNewScheduleDate("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateScheduleDate}>Update Date</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
