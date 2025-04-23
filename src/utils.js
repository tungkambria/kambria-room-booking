// utils.js

// Format date to YYYY-MM-DD in GMT+7 timezone
export const formatDateGMT7 = (date) => {
  // Adjust for GMT+7 (7 hours ahead of UTC)
  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() + 7);

  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
  const day = String(adjustedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Get today's date in GMT+7 timezone
export const getTodayGMT7 = () => {
  const today = new Date();
  today.setHours(today.getHours() + 7); // Adjust to GMT+7
  return new Date(today.setHours(0, 0, 0, 0)); // Set to midnight
};

// Generate all occurrences for a recurring event
export const generateOccurrences = (startDate, endDate, type, days = []) => {
  const occurrences = [];
  let currentDate = new Date(startDate);
  const finalEndDate = new Date(endDate);

  // Ensure we have at least one day for weekly recurrence
  if (type === "weekly" && days.length === 0) {
    days = [currentDate.getDay()];
  }

  while (currentDate <= finalEndDate) {
    if (type === "daily") {
      occurrences.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (type === "weekly") {
      // For weekly, we need to consider the selected days
      const currentDay = currentDate.getDay();

      // Find the next selected day (same day or next in week)
      let nextDay = days.find((day) => day >= currentDay);

      if (nextDay === undefined) {
        // If no days after current day, find first day in next week
        nextDay = Math.min(...days);
        currentDate.setDate(currentDate.getDate() + 7 - currentDay + nextDay);
      } else {
        currentDate.setDate(currentDate.getDate() + (nextDay - currentDay));
      }

      // Only add if it's one of our selected days
      if (days.includes(currentDate.getDay())) {
        occurrences.push(new Date(currentDate));
      }

      // If we just processed the last day of the week, move to next week
      if (currentDate.getDay() === Math.max(...days)) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (type === "monthly") {
      occurrences.push(new Date(currentDate));

      // Move to same day next month
      const nextMonth = currentDate.getMonth() + 1;
      currentDate.setMonth(nextMonth);

      // Handle cases where next month doesn't have this day (e.g., Jan 31 -> Feb 28)
      if (currentDate.getMonth() !== nextMonth % 12) {
        currentDate.setDate(0); // Move to last day of previous month
      }
    }
  }

  return occurrences;
};

// Weekday information for display purposes
export const weekDays = [
  { id: 0, name: "Sunday", shortName: "Sun" },
  { id: 1, name: "Monday", shortName: "Mon" },
  { id: 2, name: "Tuesday", shortName: "Tue" },
  { id: 3, name: "Wednesday", shortName: "Wed" },
  { id: 4, name: "Thursday", shortName: "Thu" },
  { id: 5, name: "Friday", shortName: "Fri" },
  { id: 6, name: "Saturday", shortName: "Sat" },
];

// Helper to format recurrence information for display
export const formatRecurrenceInfo = (booking) => {
  if (!booking.isRecurring) return "One-time";

  let info = `Recurring ${booking.recurrenceType}`;

  if (booking.recurrenceEndDate) {
    info += ` until ${new Date(booking.recurrenceEndDate).toLocaleDateString(
      "vi"
    )}`;
  }

  if (booking.recurrenceDays?.length > 0) {
    const dayNames = booking.recurrenceDays
      .map((d) => weekDays.find((wd) => wd.id === d)?.shortName)
      .filter(Boolean);
    info += ` on ${dayNames.join(", ")}`;
  }

  return info;
};
