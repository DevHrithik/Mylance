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

    const datesWithPrompts = new Set(
      filteredPrompts.map((prompt) => prompt.scheduled_date!)
    );

    // Convert to DayWithPrompts objects and sort by date
    const daysWithPrompts: DayWithPrompts[] = Array.from(datesWithPrompts)
      .map((dateString) => {
        // Parse date string as UTC to avoid timezone shifts
        const dateParts = dateString.split("-").map(Number);

        let date: Date;

        // Validate that we have exactly 3 parts and all are valid numbers
        if (dateParts.length !== 3 || dateParts.some(isNaN)) {
          console.error(`Invalid date string: ${dateString}`);
          // Fallback to current date if invalid
          const fallbackDate = new Date();
          const year = fallbackDate.getFullYear();
          const month = fallbackDate.getMonth() + 1;
          const day = fallbackDate.getDate();
          date = new Date(Date.UTC(year, month - 1, day));
        } else {
          const year = dateParts[0]!;
          const month = dateParts[1]!;
          const day = dateParts[2]!;
          date = new Date(Date.UTC(year, month - 1, day));
        }

        const dayPrompts = filteredPrompts.filter(
          (prompt) => prompt.scheduled_date === dateString
        );

        const dayName = weekDays[date.getUTCDay()];
        const monthName = monthNames[date.getUTCMonth()];

        return {
          date: dateString,
          dayName: dayName || "Unknown",
          dayNumber: date.getUTCDate(),
          monthName: monthName || "Unknown",
          prompts: dayPrompts,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.date + "T00:00:00Z").getTime() -
          new Date(b.date + "T00:00:00Z").getTime()
      );

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

    // Get the first and last dates of the current page
    const firstDay = currentDays[0];
    const lastDay = currentDays[currentDays.length - 1];

    if (!firstDay || !lastDay) return "No scheduled prompts";

    // Parse dates to get readable format
    const firstDate = new Date(firstDay.date + "T00:00:00Z");
    const lastDate = new Date(lastDay.date + "T00:00:00Z");

    // Format as "Week of Jun 10" or "Jun 10-12" if different dates
    if (firstDay.date === lastDay.date) {
      return `${firstDay.monthName} ${firstDay.dayNumber}`;
    } else if (firstDay.monthName === lastDay.monthName) {
      return `${firstDay.monthName} ${firstDay.dayNumber}-${lastDay.dayNumber}`;
    } else {
      return `${firstDay.monthName} ${firstDay.dayNumber} - ${lastDay.monthName} ${lastDay.dayNumber}`;
    }
  };

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
                    <Card className="border border-gray-200 bg-white flex-1 flex flex-col min-h-[320px]">
                      <CardContent className="p-4 flex-1 flex flex-col space-y-4">
                        {/* Upper right corner status */}
                        <div className="flex items-start justify-between flex-shrink-0">
                          <div className="flex items-center space-x-1">
                            {/* Rating stars */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <QuickRating
                                type="prompt"
                                targetId={day.prompts[0]!.id}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge
                              variant={
                                day.prompts[0]!.is_used
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs px-2 py-1"
                            >
                              {day.prompts[0]!.is_used ? "Used" : "New"}
                            </Badge>
                            {!day.prompts[0]!.is_used ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchivePrompt(day.prompts[0]!.id);
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
                                        handleUnarchivePrompt(
                                          day.prompts[0]!.id
                                        );
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
                        <div className="flex items-center justify-between flex-shrink-0">
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {day.prompts[0].category}
                          </Badge>
                          <div onClick={(e) => e.stopPropagation()}>
                            <FeedbackButton
                              type="prompt"
                              targetId={day.prompts[0]!.id}
                              title={day.prompts[0]!.hook}
                              content={day.prompts[0]!.prompt_text}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                            >
                              📝
                            </FeedbackButton>
                          </div>
                        </div>

                        {/* Hook */}
                        <div className="flex-shrink-0">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            HOOK
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed line-clamp-3">
                            {day.prompts[0]!.hook}
                          </p>
                        </div>

                        {/* Prompt */}
                        <div className="flex-1 min-h-0">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            PROMPT
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed overflow-y-auto h-full line-clamp-6">
                            {day.prompts[0]!.prompt_text}
                          </p>
                        </div>

                        {/* Spacing before button */}
                        <div className="mt-4"></div>

                        {/* Select Prompt Button */}
                        <div className="flex-shrink-0 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handlePickPrompt(day.prompts[0]!)}
                            disabled={day.prompts[0]!.is_used}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {day.prompts[0]!.is_used ? "Used" : "Select"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-dashed border-gray-300 bg-gray-50 flex-1 flex flex-col min-h-[320px]">
                      <CardContent className="p-4 flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">
                            No prompt
                          </div>
                          <div className="text-sm text-gray-400">
                            for this slot
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Second Prompt */}
                  {day.prompts[1] ? (
                    <Card className="border border-gray-200 bg-white flex-1 flex flex-col min-h-[320px]">
                      <CardContent className="p-4 flex-1 flex flex-col space-y-4">
                        {/* Upper right corner status */}
                        <div className="flex items-start justify-between flex-shrink-0">
                          <div className="flex items-center space-x-1">
                            {/* Rating stars */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <QuickRating
                                type="prompt"
                                targetId={day.prompts[1]!.id}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge
                              variant={
                                day.prompts[1]!.is_used
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs px-2 py-1"
                            >
                              {day.prompts[1]!.is_used ? "Used" : "New"}
                            </Badge>
                            {!day.prompts[1]!.is_used ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchivePrompt(day.prompts[1]!.id);
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
                                        handleUnarchivePrompt(
                                          day.prompts[1]!.id
                                        );
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
                        <div className="flex items-center justify-between flex-shrink-0">
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {day.prompts[1]!.category}
                          </Badge>
                          <div onClick={(e) => e.stopPropagation()}>
                            <FeedbackButton
                              type="prompt"
                              targetId={day.prompts[1]!.id}
                              title={day.prompts[1]!.hook}
                              content={day.prompts[1]!.prompt_text}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                            >
                              📝
                            </FeedbackButton>
                          </div>
                        </div>

                        {/* Hook */}
                        <div className="flex-shrink-0">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            HOOK
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed line-clamp-3">
                            {day.prompts[1]!.hook}
                          </p>
                        </div>

                        {/* Prompt */}
                        <div className="flex-1 min-h-0">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            PROMPT
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed overflow-y-auto h-full line-clamp-6">
                            {day.prompts[1]!.prompt_text}
                          </p>
                        </div>

                        {/* Spacing before button */}
                        <div className="mt-4"></div>

                        {/* Select Prompt Button */}
                        <div className="flex-shrink-0 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handlePickPrompt(day.prompts[1]!)}
                            disabled={day.prompts[1]!.is_used}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {day.prompts[1]!.is_used ? "Used" : "Select"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-dashed border-gray-300 bg-gray-50 flex-1 flex flex-col min-h-[320px]">
                      <CardContent className="p-4 flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">
                            No other prompt
                          </div>
                          <div className="text-sm text-gray-400">
                            for the day
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* More prompts indicator if there are more than 2 */}
                  {day.prompts.length > 2 && (
                    <div className="text-sm text-gray-500 text-center py-2 bg-orange-50 rounded border border-orange-200">
                      +{day.prompts.length - 2} more
                    </div>
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
