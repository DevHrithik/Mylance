/**
 * Date utilities for timezone-safe scheduling
 * Ensures consistent M/W/F scheduling regardless of timezone
 */

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
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const dayOfWeek = date.getUTCDay();
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
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const dayName = dayNames[date.getUTCDay()];
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
  const date = new Date(Date.UTC(year!, month! - 1, day!));

  const dayName = dayNames[date.getUTCDay()];
  const monthName = monthNames[date.getUTCMonth()];

  return `${dayName}, ${monthName} ${date.getUTCDate()}`;
}

/**
 * Gets the next M/W/F date from a given date
 * @param fromDate Date to start from (YYYY-MM-DD format)
 * @returns Next M/W/F date in YYYY-MM-DD format
 */
export function getNextMWFDate(fromDate?: string): string {
  const today = fromDate ? new Date(fromDate + "T00:00:00Z") : new Date();
  const currentDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  // Target days (1 = Monday, 3 = Wednesday, 5 = Friday)
  const targetDays = [1, 3, 5];

  // If current date is already M/W/F, return it
  if (targetDays.includes(currentDate.getUTCDay())) {
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Find next M/W/F
  while (!targetDays.includes(currentDate.getUTCDay())) {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getUTCDate()).padStart(2, "0");
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

  // Use UTC to avoid timezone issues
  const today = startDate ? new Date(startDate + "T00:00:00Z") : new Date();
  const currentDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  // Define target days (1 = Monday, 3 = Wednesday, 5 = Friday)
  const targetDays = [1, 3, 5];

  // Start from today or next valid day
  while (!targetDays.includes(currentDate.getUTCDay())) {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  for (let i = 0; i < count; i++) {
    // Add current date in YYYY-MM-DD format
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getUTCDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);

    // Move to next M/W/F
    const currentDay = currentDate.getUTCDay();
    if (currentDay === 1) {
      // Monday -> Wednesday (add 2 days)
      currentDate.setUTCDate(currentDate.getUTCDate() + 2);
    } else if (currentDay === 3) {
      // Wednesday -> Friday (add 2 days)
      currentDate.setUTCDate(currentDate.getUTCDate() + 2);
    } else if (currentDay === 5) {
      // Friday -> Monday (add 3 days)
      currentDate.setUTCDate(currentDate.getUTCDate() + 3);
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
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
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
