"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/hooks/useDashboardData";
import { useRouter } from "next/navigation";

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  hasCompletedPost?: boolean;
  hasAvailablePrompt?: boolean;
}

interface ContentCalendarProps {
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

export function ContentCalendar({ calendarData }: ContentCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

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
      });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(date).padStart(2, "0")}`;

      const eventData = calendarData[dateString];
      const isToday =
        year === today.getFullYear() &&
        month === today.getMonth() &&
        date === today.getDate();

      calendarDays.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasCompletedPost: eventData?.hasCompletedPost || false,
        hasAvailablePrompt: eventData?.hasAvailablePrompt || false,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      calendarDays.push({
        date,
        isCurrentMonth: false,
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
  };

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;

    // Create date in local timezone to avoid UTC shifts
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day.date
    );

    // Format date as YYYY-MM-DD using local timezone to match calendar data
    const year = clickedDate.getFullYear();
    const month = String(clickedDate.getMonth() + 1).padStart(2, "0");
    const dateValue = String(clickedDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${dateValue}`;

    // Navigate to content calendar with date parameter
    router.push(`/content-calendar?date=${dateString}`);
  };

  const calendarDays = generateCalendarData(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const baseClasses =
      "h-8 w-8 rounded-full flex items-center justify-center text-sm relative cursor-pointer transition-colors";

    let dayClasses = baseClasses;
    let circleClasses = "";

    if (!day.isCurrentMonth) {
      dayClasses += " text-gray-300 cursor-default";
    } else {
      dayClasses += " text-gray-900 hover:bg-gray-50";

      if (day.isToday) {
        // Today gets a subtle gray border if no other activity
        if (!day.hasCompletedPost && !day.hasAvailablePrompt) {
          circleClasses =
            "absolute inset-0 rounded-full border-2 border-gray-400";
          dayClasses += " font-medium";
        }
      }

      if (day.hasCompletedPost) {
        circleClasses = "absolute inset-0 rounded-full bg-blue-500";
        dayClasses += " text-white font-medium";
      } else if (day.hasAvailablePrompt) {
        circleClasses =
          "absolute inset-0 rounded-full border-2 border-cyan-400";
        dayClasses += " text-gray-900 font-medium";
      }
    }

    return (
      <div key={index} className="flex justify-center">
        <div className={dayClasses} onClick={() => handleDateClick(day)}>
          {circleClasses && <div className={circleClasses} />}
          <span className="relative z-10">{day.date}</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Content Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => renderCalendarDay(day, index))}
        </div>
      </CardContent>
    </Card>
  );
}
