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
  RefreshCw,
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
  onRefresh?: () => void;
  refreshing?: boolean;
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
  onRefresh,
  refreshing = false,
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

    if (filteredPrompts.length === 0) {
      return [];
    }

    // Get all unique weeks that have prompts
    const weeksWithPrompts = new Set<string>();
    filteredPrompts.forEach((prompt) => {
      const date = new Date(prompt.scheduled_date! + "T00:00:00");
      // Get Monday of this week (week start)
      const dayOfWeek = date.getDay();
      const monday = new Date(date);
      // If it's Sunday (0), go back 6 days to Monday, otherwise go back dayOfWeek-1 days
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(date.getDate() - daysToMonday);

      const weekKey = `${monday.getFullYear()}-${String(
        monday.getMonth() + 1
      ).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
      weeksWithPrompts.add(weekKey);
    });

    // Generate all Monday-Wednesday-Friday combinations for weeks that have prompts
    const daysWithPrompts: DayWithPrompts[] = [];

    // Convert to array and sort weeks
    const sortedWeeks = Array.from(weeksWithPrompts).sort();

    sortedWeeks.forEach((weekStart) => {
      const mondayDate = new Date(weekStart + "T00:00:00");

      // Generate Monday, Wednesday, Friday for this week
      const postingDays = [0, 2, 4]; // Monday, Wednesday, Friday (offset from Monday)

      postingDays.forEach((dayOffset) => {
        const currentDate = new Date(mondayDate);
        currentDate.setDate(mondayDate.getDate() + dayOffset);

        const dateString = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

        // Get prompts for this specific date
        const dayPrompts = filteredPrompts.filter(
          (prompt) => prompt.scheduled_date === dateString
        );

        const dayName = weekDays[currentDate.getDay()];
        const monthName = monthNames[currentDate.getMonth()];

        daysWithPrompts.push({
          date: dateString,
          dayName: dayName || "Unknown",
          dayNumber: currentDate.getDate(),
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

  // Default to current week on initial load
  useEffect(() => {
    if (!selectedDate && prompts.length > 0) {
      const allDays = getAllDaysWithPrompts();
      if (allDays.length === 0) return;

      // Get current date and find the Monday of current week
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Sunday = 6 days back to Monday
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() - daysToMonday);

      const currentWeekMonday = `${currentMonday.getFullYear()}-${String(
        currentMonday.getMonth() + 1
      ).padStart(2, "0")}-${String(currentMonday.getDate()).padStart(2, "0")}`;

      // Find the page that contains the current week
      let currentWeekPageIndex = -1;
      for (let i = 0; i < allDays.length; i += DAYS_PER_PAGE) {
        const pageStartDay = allDays[i];
        if (pageStartDay) {
          const pageDate = new Date(pageStartDay.date + "T00:00:00");
          const pageDayOfWeek = pageDate.getDay();
          const pageDaysToMonday = pageDayOfWeek === 0 ? 6 : pageDayOfWeek - 1;
          const pageMonday = new Date(pageDate);
          pageMonday.setDate(pageDate.getDate() - pageDaysToMonday);

          const pageMondayString = `${pageMonday.getFullYear()}-${String(
            pageMonday.getMonth() + 1
          ).padStart(2, "0")}-${String(pageMonday.getDate()).padStart(2, "0")}`;

          if (pageMondayString >= currentWeekMonday) {
            currentWeekPageIndex = Math.floor(i / DAYS_PER_PAGE);
            break;
          }
        }
      }

      // If we found a current/future week, navigate to it
      if (currentWeekPageIndex >= 0) {
        setCurrentPage(currentWeekPageIndex);
      } else {
        // If no current/future week found, go to the last page
        const totalPages = Math.ceil(allDays.length / DAYS_PER_PAGE);
        setCurrentPage(Math.max(0, totalPages - 1));
      }
    }
  }, [prompts.length, selectedDate]);

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

    // Calculate the full week range (Monday to Sunday)
    const firstDate = new Date(firstDay.date + "T00:00:00");

    // Find the Monday of the first date's week
    const firstDayOfWeek = firstDate.getDay();
    const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const monday = new Date(firstDate);
    monday.setDate(firstDate.getDate() - daysToMonday);

    // Find the Sunday of the same week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const monthName = monthNames[monday.getMonth()];
    const mondayNum = monday.getDate();
    const sundayNum = sunday.getDate();
    const sundayMonth = monthNames[sunday.getMonth()];

    // If the week spans two months
    if (monday.getMonth() !== sunday.getMonth()) {
      return `${monthName} ${mondayNum} - ${sundayMonth} ${sundayNum}`;
    } else {
      return `${monthName} ${mondayNum}-${sundayNum}`;
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
    <Card className="border border-gray-200 bg-white flex flex-col min-h-[480px]">
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
          <div className="flex-shrink-0">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              HOOK
            </div>
            <div>
              <p className="text-sm text-gray-900 leading-relaxed">
                {prompt.hook}
              </p>
            </div>
          </div>

          {/* Prompt */}
          <div className="flex-1 min-h-0">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              PROMPT
            </div>
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {prompt.prompt_text}
              </p>
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
    <Card className="border border-dashed border-gray-300 bg-gray-50 flex flex-col min-h-[480px]">
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
              {/* Refresh Button */}
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </Button>
              )}

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
