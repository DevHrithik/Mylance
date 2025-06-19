/**
 * Date utilities for timezone-safe scheduling
 * Ensures consistent M/W/F scheduling regardless of timezone
 */

import { formatDistanceToNow, format } from "date-fns";

/**
 * Checks if a date is Monday, Wednesday, or Friday
 * @param dateString Date in YYYY-MM-DD format
 * @returns boolean
 */
export function isMondayWednesdayFriday(dateString: string): boolean {
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => isNaN(part))) {
    return false;
  }

  const [year, month, day] = parts;
  const date = new Date(year!, month! - 1, day!);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Mon=1, Wed=3, Fri=5
}

/**
 * Gets the day name for a date string
 * @param dateString Date in YYYY-MM-DD format
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(dateString: string): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => isNaN(part))) {
    return "Invalid Date";
  }

  const [year, month, day] = parts;
  const date = new Date(year!, month! - 1, day!);
  const dayName = dayNames[date.getDay()];
  return dayName || "Invalid Date";
}

/**
 * Formats a date string for display
 * @param dateString Date in YYYY-MM-DD format
 * @returns Formatted date (e.g., "Mon, Jan 15")
 */
export function formatDateForDisplay(dateString: string): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => isNaN(part))) {
    return "Invalid Date";
  }

  const [year, month, day] = parts;
  const date = new Date(year!, month! - 1, day!);

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];

  return `${dayName}, ${monthName} ${date.getDate()}`;
}

/**
 * Gets the next M/W/F date from a given date
 * @param fromDate Date to start from (YYYY-MM-DD format)
 * @returns Next M/W/F date in YYYY-MM-DD format
 */
export function getNextMWFDate(fromDate?: string): string {
  const today = fromDate ? new Date(fromDate + "T00:00:00") : new Date();
  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Target days (1 = Monday, 3 = Wednesday, 5 = Friday)
  const targetDays = [1, 3, 5];

  // If current date is already M/W/F, return it
  if (targetDays.includes(currentDate.getDay())) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Find next M/W/F
  while (!targetDays.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generates the next N M/W/F dates for scheduling
 * @param count Number of dates to generate
 * @param startDate Optional start date (YYYY-MM-DD format)
 * @returns Array of dates in YYYY-MM-DD format
 */
export function generateMWFScheduleDates(
  count: number,
  startDate?: string
): string[] {
  const dates: string[] = [];

  // Use local time to avoid timezone issues
  const today = startDate ? new Date(startDate + "T00:00:00") : new Date();
  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Define target days (1 = Monday, 3 = Wednesday, 5 = Friday)
  const targetDays = [1, 3, 5];

  // Start from today or next valid day
  while (!targetDays.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (let i = 0; i < count; i++) {
    // Add current date in YYYY-MM-DD format
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);

    // Move to next M/W/F
    const currentDay = currentDate.getDay();
    if (currentDay === 1) {
      // Monday -> Wednesday (add 2 days)
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (currentDay === 3) {
      // Wednesday -> Friday (add 2 days)
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (currentDay === 5) {
      // Friday -> Monday (add 3 days)
      currentDate.setDate(currentDate.getDate() + 3);
    }
  }

  return dates;
}

/**
 * Validates if a date string is in correct format and is M/W/F
 * @param dateString Date string to validate
 * @returns Object with isValid and error message
 */
export function validateMWFDate(dateString: string): {
  isValid: boolean;
  error?: string;
} {
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { isValid: false, error: "Date must be in YYYY-MM-DD format" };
  }

  // Check if it's a valid date
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => isNaN(part))) {
    return { isValid: false, error: "Invalid date format" };
  }

  const [year, month, day] = parts;
  const date = new Date(year!, month! - 1, day!);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month! - 1 ||
    date.getDate() !== day
  ) {
    return { isValid: false, error: "Invalid date" };
  }

  // Check if it's M/W/F
  if (!isMondayWednesdayFriday(dateString)) {
    return {
      isValid: false,
      error: "Date must be Monday, Wednesday, or Friday",
    };
  }

  return { isValid: true };
}

/**
 * Simple date formatting that avoids timezone issues
 * Takes a YYYY-MM-DD string and returns a formatted date
 */
export function formatSimpleDate(
  dateString: string | null | undefined
): string {
  if (!dateString) return "Not scheduled";

  // For YYYY-MM-DD format, add time to avoid timezone shifts
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString();
}

/**
 * Format date for date input (ensures YYYY-MM-DD format)
 */
export function formatDateForInput(
  dateString: string | null | undefined
): string {
  if (!dateString) return "";

  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // For any other format, extract date part
  return dateString.split("T")[0] || "";
}

/**
 * Format date for database storage (simple YYYY-MM-DD)
 */
export function formatDateForDatabase(dateString: string): string | null {
  if (!dateString) return null;

  // Keep it simple - extract just the date part
  return dateString.split("T")[0] || "";
}

/**
 * Get next Monday from any date
 */
export function getNextMonday(): Date {
  const today = new Date();
  const nextMonday = new Date(today);

  // Get days until next Monday (1 = Monday, 0 = Sunday)
  const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  return nextMonday;
}

/**
 * Generate Monday/Wednesday/Friday schedule starting from next Monday
 */
export function generateMWFSchedule(promptCount: number = 12): string[] {
  const dates: string[] = [];
  const nextMonday = getNextMonday();

  // Mon, Wed, Fri pattern for 6 days (2 prompts per day)
  const daysToAdd = [0, 2, 4, 7, 9, 11]; // Mon, Wed, Fri, Mon, Wed, Fri

  for (let i = 0; i < promptCount; i++) {
    const dayIndex = Math.floor(i / 2); // 2 prompts per day
    const targetDate = new Date(nextMonday);
    targetDate.setDate(nextMonday.getDate() + (daysToAdd[dayIndex] || 0));

    // Format as YYYY-MM-DD
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}
