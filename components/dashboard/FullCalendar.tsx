"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/hooks/useDashboardData";

interface PostData {
  id: string;
  title: string;
  status: "scheduled" | "unscheduled" | "completed";
  category: "educational" | "story" | "question" | "promotional" | "personal";
  time?: string;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  posts: PostData[];
}

interface FullCalendarProps {
  calendarData: Record<string, CalendarEvent>;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const categoryColors = {
  educational: "bg-purple-100 text-purple-700 border-purple-200",
  story: "bg-blue-100 text-blue-700 border-blue-200",
  question: "bg-yellow-100 text-yellow-700 border-yellow-200",
  promotional: "bg-orange-100 text-orange-700 border-orange-200",
  personal: "bg-pink-100 text-pink-700 border-pink-200",
};

const statusColors = {
  scheduled: "text-blue-600",
  unscheduled: "text-gray-500",
  completed: "text-green-600",
};

// Map prompt categories to our display categories
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

export function FullCalendar({ calendarData }: FullCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const generateCalendarData = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const calendarDays: CalendarDay[] = [];

    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    const daysFromPrevMonth = firstDayWeekday;
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = prevMonth.getDate() - i;
      calendarDays.push({
        date,
        isCurrentMonth: false,
        posts: [],
      });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(date).padStart(2, "0")}`;

      const eventData = calendarData[dateString];
      const posts: PostData[] = [];

      // Add posts from the event data
      if (eventData?.posts) {
        eventData.posts.forEach((post) => {
          const timeValue = post.posted_at
            ? new Date(post.posted_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : undefined;

          posts.push({
            id: post.id.toString(),
            title: post.title || "Untitled Post",
            status:
              post.status === "used"
                ? "completed"
                : post.status === "draft"
                ? "unscheduled"
                : "scheduled",
            category: mapCategory(post.content_type || "educational"),
            ...(timeValue && { time: timeValue }),
          });
        });
      }

      // Add prompts as potential posts
      if (eventData?.prompts) {
        eventData.prompts.forEach((prompt) => {
          posts.push({
            id: `prompt-${prompt.id}`,
            title: prompt.hook || prompt.prompt_text.substring(0, 50) + "...",
            status: prompt.is_used ? "completed" : "scheduled",
            category: mapCategory(prompt.category),
          });
        });
      }

      const isToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        date === today.getDate();

      calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday,
        posts,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      calendarDays.push({
        date,
        isCurrentMonth: false,
        posts: [],
      });
    }

    return calendarDays;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const handleDateClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDate(selectedDate === day.date ? null : day.date);
    }
  };

  const calendarDays = generateCalendarData(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const renderPost = (post: PostData) => (
    <div
      key={post.id}
      className={`p-2 mb-2 rounded text-xs border cursor-pointer hover:shadow-sm transition-shadow ${
        categoryColors[post.category]
      }`}
    >
      <div className={`font-medium mb-1 ${statusColors[post.status]}`}>
        {post.status}
      </div>
      <div className="font-medium text-gray-900 leading-tight">
        {post.title.length > 50
          ? `${post.title.substring(0, 50)}...`
          : post.title}
      </div>
      <div className="text-xs mt-1 opacity-75">{post.category}</div>
      {post.time && <div className="text-xs mt-1 opacity-75">{post.time}</div>}
    </div>
  );

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const isSelected = selectedDate === day.date && day.isCurrentMonth;
    const hasToday = day.isToday && day.isCurrentMonth;

    return (
      <div
        key={index}
        className={`min-h-[140px] p-2 border border-gray-200 cursor-pointer transition-all hover:bg-gray-50 ${
          !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
        } ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""} ${
          hasToday ? "ring-2 ring-blue-300" : ""
        }`}
        onClick={() => handleDateClick(day)}
      >
        <div
          className={`text-sm font-medium mb-2 ${
            !day.isCurrentMonth
              ? "text-gray-400"
              : hasToday
              ? "text-blue-600"
              : "text-gray-900"
          }`}
        >
          {day.date}
        </div>

        <div className="space-y-1">{day.posts.map(renderPost)}</div>

        {day.posts.length > 2 && (
          <div className="text-xs text-gray-500 mt-1">
            +{day.posts.length - 2} more
          </div>
        )}
      </div>
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today.getDate());
  };

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Content Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-sm"
              >
                Today
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold min-w-[160px] text-center text-gray-900">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
