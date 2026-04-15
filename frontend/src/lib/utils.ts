import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─────────────────────────────────────────────────────────────────────────────
// Styling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge Tailwind CSS classes safely.
 * Resolves conflicts (e.g. "p-2 p-4" → "p-4") and handles
 * conditional class values via clsx.
 *
 * @example cn("px-4 py-2", isActive && "bg-blue-600", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────────────────────────────────
// Date & Time
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract total minutes from midnight from any time representation.
 * Handles:
 *   - ISO datetime from Prisma @db.Time: "1970-01-01T14:00:00.000Z" → 840
 *   - Plain "HH:mm" or "HH:mm:ss": "14:00" → 840
 * Always uses UTC getters for ISO strings (the Z suffix means UTC).
 */
export function parseSlotTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // ISO datetime string (contains "T" or "Z") — extract UTC hours/minutes
  if (timeStr.includes("T") || timeStr.includes("Z")) {
    const d = new Date(timeStr);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  // Plain "HH:mm" or "HH:mm:ss"
  const parts = timeStr.split(":");
  return Number(parts[0] ?? 0) * 60 + Number(parts[1] ?? 0);
}

/**
 * Format a Prisma @db.Time value (or "HH:mm" string) to 12-hour display.
 *
 * This handles the critical timezone issue: Prisma serializes @db.Time columns
 * as ISO datetime strings anchored to 1970-01-01 in UTC (e.g., "1970-01-01T14:00:00.000Z").
 * Using `new Date(iso).toLocaleTimeString()` would INCORRECTLY convert UTC→local timezone.
 * Instead, we extract the UTC hours/minutes and format them directly.
 *
 * @example formatSlotTime("1970-01-01T14:00:00.000Z") → "2:00 PM"
 * @example formatSlotTime("14:30") → "2:30 PM"
 * @example formatSlotTime("09:00") → "9:00 AM"
 */
export function formatSlotTime(timeStr: string): string {
  if (!timeStr) return "—";
  const totalMinutes = parseSlotTimeToMinutes(timeStr);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Format a Prisma @db.Date value to a human-readable date.
 *
 * Prisma serializes @db.Date columns as UTC midnight ISO strings
 * (e.g., "2026-04-15T00:00:00.000Z"). Using `new Date(iso).toLocaleDateString()`
 * can show the WRONG date in timezones west of UTC.
 * We use UTC getters to extract the correct calendar date.
 *
 * @example formatSlotDate("2026-04-15T00:00:00.000Z") → "April 15, 2026"
 * @example formatSlotDate("2024-03-15") → "March 15, 2024"
 */
export function formatSlotDate(dateString: string): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  // If this looks like a UTC midnight date (from @db.Date), use UTC getters
  // to avoid timezone shifting the date
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  if (dateString.includes("T") || dateString.includes("Z")) {
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }
  // Plain "YYYY-MM-DD" — parse as local date
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a Prisma @db.Date value to a short date.
 *
 * @example formatSlotDateShort("2026-04-15T00:00:00.000Z") → "Apr 15, 2026"
 * @example formatSlotDateShort("2024-03-15") → "Mar 15, 2024"
 */
export function formatSlotDateShort(dateString: string): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (dateString.includes("T") || dateString.includes("Z")) {
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a Prisma @db.Date value to a short day format (e.g., "Mon, 15 Apr").
 * Uses UTC getters for ISO strings to avoid timezone date shift.
 */
export function formatSlotDateDay(dateString: string): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (dateString.includes("T") || dateString.includes("Z")) {
    return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
  }
  const local = new Date(`${dateString}T00:00:00`);
  return `${days[local.getDay()]}, ${local.getDate()} ${months[local.getMonth()]}`;
}

// ── Legacy formatters (updated to handle ISO datetime strings) ───────────────

/**
 * Format an ISO date string to a human-readable date.
 * Updated to handle Prisma @db.Date UTC midnight strings safely.
 * @example formatDate("2024-03-15") → "March 15, 2024"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  // Delegate to formatSlotDate which handles UTC-midnight strings correctly
  return formatSlotDate(dateString);
}

/**
 * Format an ISO date string to a short date.
 * Updated to handle Prisma @db.Date UTC midnight strings safely.
 * @example formatDateShort("2024-03-15") → "Mar 15, 2024"
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return "—";
  return formatSlotDateShort(dateString);
}

/**
 * Format a time string to 12-hour format.
 * Updated to handle both "HH:mm" AND ISO datetime strings from Prisma @db.Time.
 * @example formatTime("14:30") → "2:30 PM"
 * @example formatTime("1970-01-01T14:30:00.000Z") → "2:30 PM"
 */
export function formatTime(timeString: string): string {
  if (!timeString) return "—";
  // Delegate to formatSlotTime which handles both formats correctly
  return formatSlotTime(timeString);
}

/**
 * Format an ISO datetime string to a relative label.
 * @example formatRelativeTime("2024-03-14T10:00:00Z") → "2 hours ago"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "—";
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return formatDateShort(dateString);
}

// ─────────────────────────────────────────────────────────────────────────────
// File & Numbers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a byte count to a human-readable file size.
 * @example formatFileSize(1048576) → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format a currency value in INR.
 * @example formatCurrency(500) → "₹500"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────────────────────────────────────
// String Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate initials from a full name (max 2 characters).
 * @example getInitials("John Doe") → "JD"
 * @example getInitials("Alice")    → "A"
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Capitalize the first letter of a string.
 * @example capitalize("pending") → "Pending"
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a snake_case or kebab-case string to a readable label.
 * @example toLabel("lab_report") → "Lab Report"
 */
export function toLabel(str: string): string {
  if (!str) return "";
  return str
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a human-readable label for an appointment or doctor status.
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    cancelled: "Cancelled",
    rescheduled: "Rescheduled",
    suspended: "Suspended",
    available: "Available",
    booked: "Booked",
  };
  return labels[status] ?? capitalize(status);
}

/**
 * Return Tailwind CSS classes for a status badge.
 * Classes include background, text color, and border.
 */
export function getStatusColors(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-amber-50  text-amber-700  border-amber-200",
    approved: "bg-blue-50   text-blue-700   border-blue-200",
    completed: "bg-green-50  text-green-700  border-green-200",
    rejected: "bg-red-50    text-red-700    border-red-200",
    cancelled: "bg-gray-50   text-gray-600   border-gray-200",
    rescheduled: "bg-purple-50 text-purple-700 border-purple-200",
    suspended: "bg-violet-50 text-violet-700 border-violet-200",
    available: "bg-green-50  text-green-700  border-green-200",
    booked: "bg-blue-50   text-blue-700   border-blue-200",
  };
  return colors[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string. Returns null on failure instead of throwing.
 */
export function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Generate a debounced version of a callback.
 * Useful for search inputs to avoid firing on every keystroke.
 *
 * @example
 * const debouncedSearch = debounce(setSearch, 400);
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Truncate a string to a max length with ellipsis.
 * @example truncate("Hello World", 8) → "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
