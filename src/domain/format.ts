/** Presentation-only formatting helpers. Locale is pinned so SSR and CSR agree. */

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** 3725 → "1:02:05", 185 → "3:05". */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  return `${minutes}:${paddedSeconds}`;
}

/** 3725 → "1 hr 2 min" — for course-level totals where a clock is too precise. */
export function formatDurationLong(totalSeconds: number): string {
  const safeSeconds = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours === 0) return `${Math.max(minutes, 1)} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatFileSize(sizeBytes: number | null): string {
  if (sizeBytes === null) return "External";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function formatCount(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

/** "3 days ago" style label, computed from an injected reference date. */
export function formatRelativeTime(isoDate: string, referenceDate: Date): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffSeconds = Math.round((referenceDate.getTime() - timestamp) / 1000);
  if (diffSeconds < 60) return "just now";

  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  return formatDate(isoDate);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}