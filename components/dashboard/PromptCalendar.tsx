"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Library,
  Archive,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  FeedbackButton,
  QuickRating,
} from "@/components/common/FeedbackButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContentPrompt {
  id: number;
  category: string;
  pillar_number?: number;
  pillar_description?: string;
  prompt_text: string;
  hook: string;
  is_used: boolean;
  scheduled_date: string | null;
  pushed_to_calendar: boolean;
  created_at?: string;
  updated_at?: string;
}

interface GeneratedPost {
  id: number;
  title: string | null;
  content: string;
  status: "draft" | "used" | "archived";
  content_type: string;
  posted_at: string | null;
  created_at: string;
  hashtags?: string[];
  performance?: {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface DayWithPrompts {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  prompts: ContentPrompt[];
}

interface PromptCalendarProps {
  prompts: ContentPrompt[];
  posts?: GeneratedPost[];
  onPromptsChange: () => void;
  selectedDate?: string | null;
  activeView: "calendar" | "library";
  onViewChange: (view: "calendar" | "library") => void;
  onMakeDefault?: () => void;
}

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function PromptCalendar({
  prompts,
  posts,
  onPromptsChange,
  selectedDate,
  activeView,
  onViewChange,
}: PromptCalendarProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const DAYS_PER_PAGE = 3; // Three days per page

  // Archive a prompt
  const handleArchivePrompt = async (promptId: number) => {
    try {
      const { error } = await supabase
        .from("content_prompts")
        .update({ is_used: true })
        .eq("id", promptId);

      if (error) {
        console.error("Error archiving prompt:", error);
        toast.error("Failed to archive prompt");
        return;
      }

      toast.success("Prompt archived successfully");
      onPromptsChange(); // Refresh the data
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to archive prompt");
    }
  };

  // Unarchive a prompt
  const handleUnarchivePrompt = async (promptId: number) => {
    try {
      const { error } = await supabase
        .from("content_prompts")
        .update({ is_used: false })
        .eq("id", promptId);

      if (error) {
        console.error("Error unarchiving prompt:", error);
        toast.error("Failed to unarchive prompt");
        return;
      }

      toast.success("Prompt unarchived successfully");
      onPromptsChange(); // Refresh the data
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to unarchive prompt");
    }
  };

  const getAllDaysWithPrompts = (): DayWithPrompts[] => {
    // Get all dates that have prompts that are pushed to calendar
    const filteredPrompts = prompts.filter(
      (prompt) => prompt.scheduled_date && prompt.pushed_to_calendar === true
    );

    // Get all unique weeks that have prompts
    const weeksWithPrompts = new Set<string>();
    filteredPrompts.forEach((prompt) => {
      const date = new Date(prompt.scheduled_date! + "T00:00:00Z");
      // Get Monday of this week (week start)
      const dayOfWeek = date.getUTCDay();
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - dayOfWeek + 1);
      const weekKey = `${monday.getUTCFullYear()}-${String(
        monday.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
      weeksWithPrompts.add(weekKey);
    });

    // Generate all Monday-Wednesday-Friday combinations for weeks that have prompts
    const daysWithPrompts: DayWithPrompts[] = [];

    // Convert to array and sort weeks
    const sortedWeeks = Array.from(weeksWithPrompts).sort();

    sortedWeeks.forEach((weekStart) => {
      const mondayDate = new Date(weekStart + "T00:00:00Z");

      // Generate Monday, Wednesday, Friday for this week
      const postingDays = [0, 2, 4]; // Monday, Wednesday, Friday (offset from Monday)

      postingDays.forEach((dayOffset) => {
        const currentDate = new Date(mondayDate);
        currentDate.setUTCDate(mondayDate.getUTCDate() + dayOffset);

        const dateString = `${currentDate.getUTCFullYear()}-${String(
          currentDate.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(
          2,
          "0"
        )}`;

        // Get prompts for this specific date
        const dayPrompts = filteredPrompts.filter(
          (prompt) => prompt.scheduled_date === dateString
        );

        const dayName = weekDays[currentDate.getUTCDay()];
        const monthName = monthNames[currentDate.getUTCMonth()];

        daysWithPrompts.push({
          date: dateString,
          dayName: dayName || "Unknown",
          dayNumber: currentDate.getUTCDate(),
          monthName: monthName || "Unknown",
          prompts: dayPrompts,
        });
      });
    });

    return daysWithPrompts;
  };

  // Navigate to page containing selected date
  useEffect(() => {
    if (selectedDate && prompts.length > 0) {
      const allDays = getAllDaysWithPrompts();
      const targetIndex = allDays.findIndex((day) => day.date === selectedDate);

      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / DAYS_PER_PAGE);
        setCurrentPage(targetPage);
      }
    }
  }, [selectedDate, prompts]);

  const navigatePage = (direction: "prev" | "next") => {
    const allDays = getAllDaysWithPrompts();
    const totalPages = Math.ceil(allDays.length / DAYS_PER_PAGE);

    setCurrentPage((prev) => {
      if (direction === "prev") {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(totalPages - 1, prev + 1);
      }
    });
  };

  const handlePickPrompt = (prompt: ContentPrompt) => {
    // Redirect to posts create page with prompt data as URL params
    const params = new URLSearchParams({
      prompt: prompt.id.toString(),
      hook: prompt.hook,
      category: prompt.category,
      prompt_text: prompt.prompt_text,
    });

    router.push(`/posts/create?${params.toString()}`);
  };

  const allDaysWithPrompts = getAllDaysWithPrompts();
  const totalPages = Math.ceil(allDaysWithPrompts.length / DAYS_PER_PAGE);
  const startIndex = currentPage * DAYS_PER_PAGE;
  const endIndex = startIndex + DAYS_PER_PAGE;
  const currentDays = allDaysWithPrompts.slice(startIndex, endIndex);

  const formatPageInfo = () => {
    if (allDaysWithPrompts.length === 0) return "No scheduled prompts";

    // Get the first and last dates of the current page (should be 3 days: Mon, Wed, Fri)
    const firstDay = currentDays[0];
    const lastDay = currentDays[currentDays.length - 1];

    if (!firstDay || !lastDay) return "No scheduled prompts";

    // Since we now show Monday-Wednesday-Friday in groups of 3,
    // we want to show the week range
    const firstDate = new Date(firstDay.date + "T00:00:00Z");
    const lastDate = new Date(lastDay.date + "T00:00:00Z");

    // Check if this is a complete week (Mon-Wed-Fri of same week)
    const firstMonday = new Date(firstDate);
    const firstDayOfWeek = firstDate.getUTCDay();
    firstMonday.setUTCDate(firstDate.getUTCDate() - firstDayOfWeek + 1);

    const lastMonday = new Date(lastDate);
    const lastDayOfWeek = lastDate.getUTCDay();
    lastMonday.setUTCDate(lastDate.getUTCDate() - lastDayOfWeek + 1);

    // If both dates are in the same week, show "Week of [Monday date]"
    if (firstMonday.getTime() === lastMonday.getTime()) {
      const mondayNum = firstMonday.getUTCDate();
      const monthName = monthNames[firstMonday.getUTCMonth()];
      return `${monthName} ${mondayNum}-${mondayNum + 4}`;
    } else {
      // Multiple weeks, show range
      const firstMondayNum = firstMonday.getUTCDate();
      const lastFridayNum = lastMonday.getUTCDate() + 4;
      const firstMonth = monthNames[firstMonday.getUTCMonth()];
      const lastMonth = monthNames[lastMonday.getUTCMonth()];

      if (firstMonth === lastMonth) {
        return `${firstMonth} ${firstMondayNum}-${lastFridayNum}`;
      } else {
        return `${firstMonth} ${firstMondayNum} - ${lastMonth} ${lastFridayNum}`;
      }
    }
  };

  // Component for rendering a prompt card
  const PromptCard = ({
    prompt,
    index,
  }: {
    prompt: ContentPrompt;
    index: number;
  }) => (
    <Card className="border border-gray-200 bg-white flex flex-col h-[480px]">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Upper section - fixed height */}
        <div className="flex-shrink-0 space-y-3">
          {/* Upper right corner status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1">
              {/* Rating stars */}
              <div onClick={(e) => e.stopPropagation()}>
                <QuickRating type="prompt" targetId={prompt.id} />
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Badge
                variant={prompt.is_used ? "secondary" : "secondary"}
                className={`text-xs px-2 py-1 ${
                  prompt.is_used
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {prompt.is_used ? "Used" : "New"}
              </Badge>
              {!prompt.is_used ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchivePrompt(prompt.id);
                        }}
                        className="h-5 w-5 p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Archive this prompt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnarchivePrompt(prompt.id);
                        }}
                        className="h-5 w-5 p-1 text-blue-500 hover:text-blue-700"
                      >
                        <Archive className="h-3 w-3 rotate-180" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unarchive this prompt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Type of post with feedback button */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
            >
              {prompt.category}
            </Badge>
            <div onClick={(e) => e.stopPropagation()}>
              <FeedbackButton
                type="prompt"
                targetId={prompt.id}
                title={prompt.hook}
                content={prompt.prompt_text}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
              >
                📝
              </FeedbackButton>
            </div>
          </div>
        </div>

        {/* Content section - flexible height */}
        <div className="flex-1 min-h-0 space-y-3 mt-3">
          {/* Hook */}
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              HOOK
            </div>
            <div className="max-h-20 overflow-hidden">
              <p className="text-sm text-gray-900 leading-relaxed">
                {prompt.hook}
              </p>
              {prompt.hook.length > 80 && (
                <div className="text-xs text-gray-500 mt-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-800"
                      >
                        Read more...
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Full Content</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            HOOK
                          </h4>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {prompt.hook}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            PROMPT
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {prompt.prompt_text}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div className="flex-1 min-h-0">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              PROMPT
            </div>
            <div className="max-h-40 overflow-hidden">
              <p className="text-sm text-gray-700 leading-relaxed">
                {prompt.prompt_text}
              </p>
              {prompt.prompt_text.length > 150 && (
                <div className="text-xs text-gray-500 mt-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-800"
                      >
                        Read more...
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Full Content</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            HOOK
                          </h4>
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {prompt.hook}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            PROMPT
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {prompt.prompt_text}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Button section - fixed at bottom */}
        <div className="flex-shrink-0 mt-4">
          <Button
            size="sm"
            onClick={() => handlePickPrompt(prompt)}
            disabled={prompt.is_used}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {prompt.is_used ? "Used" : "Select"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Component for empty prompt slot
  const EmptyPromptCard = ({ slotText }: { slotText: string }) => (
    <Card className="border border-dashed border-gray-300 bg-gray-50 flex flex-col h-[480px]">
      <CardContent className="p-4 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">No prompt</div>
          <div className="text-sm text-gray-400">{slotText}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">
              Content Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              {/* Overall Feedback Button */}
              <FeedbackButton
                type="prompt"
                targetId={0}
                title="Overall Prompt Quality"
                content="Provide feedback on the overall quality and usefulness of your content prompts"
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Overall Feedback</span>
              </FeedbackButton>

              {/* Week Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePage("prev")}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[120px] text-center">
                  {formatPageInfo()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePage("next")}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Toggle */}
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
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6">
          {currentDays.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No prompts in calendar</p>
                <p className="text-gray-400 text-sm mt-2">
                  Only prompts pushed to calendar will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 h-full">
              {currentDays.map((day) => (
                <div key={day.date} className="flex flex-col space-y-4">
                  {/* Day Header */}
                  <div className="text-center py-4 bg-gray-50 rounded border">
                    <div className="text-base font-semibold text-gray-900">
                      {day.dayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {day.monthName} {day.dayNumber}
                    </div>
                  </div>

                  {/* First Prompt */}
                  {day.prompts[0] ? (
                    <PromptCard prompt={day.prompts[0]} index={0} />
                  ) : (
                    <EmptyPromptCard slotText="for this slot" />
                  )}

                  {/* Second Prompt */}
                  {day.prompts[1] ? (
                    <PromptCard prompt={day.prompts[1]} index={1} />
                  ) : (
                    <EmptyPromptCard slotText="for the day" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
