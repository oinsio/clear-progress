import { type Clock, systemClock, Temporal } from "@/lib/temporal";
import type { ISODate, ISOTimestamp } from "@/types/entities";

/**
 * Converts a Clock or Temporal.Instant to ISOTimestamp (branded type).
 * Without arguments returns the current time via systemClock.
 *
 * @param clockOrInstant - Clock for getting current time, or Temporal.Instant to wrap
 * @returns ISO 8601 timestamp string with branded type
 */
export function toISOTimestamp(
  clockOrInstant?: Clock | Temporal.Instant,
): ISOTimestamp {
  let instant: Temporal.Instant;
  if (!clockOrInstant) {
    instant = systemClock.instant();
  } else if (clockOrInstant instanceof Temporal.Instant) {
    instant = clockOrInstant;
  } else {
    instant = clockOrInstant.instant();
  }
  // Normalization: always 3 fractional digits for safe string comparison
  // Temporal.Instant.toString() may omit the fractional part at second boundaries
  // (e.g. "2026-04-16T10:30:00Z"), which breaks lexicographic comparison
  // with Date.toISOString() (always "2026-04-16T10:30:00.000Z").
  return instant.toString({ fractionalSecondDigits: 3 }) as ISOTimestamp;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sanitizes a date string from an arbitrary format into ISO date (YYYY-MM-DD).
 * Handles:
 * - ISO date: "2026-04-19" → as-is
 * - ISO timestamp: "2026-04-19T19:00:00.000Z" → "2026-04-19"
 * - Date.toString(): "Sun Apr 19 2026 19:00:00 GMT+0000 (...)" → "2026-04-19"
 * - Empty string: "" → ""
 *
 * @returns String in YYYY-MM-DD format or empty string
 */
export function sanitizeDateOnly(value: string): string {
  if (!value) return "";

  // ISO date format — validate with regex and Temporal
  if (ISO_DATE_REGEX.test(value)) {
    try {
      Temporal.PlainDate.from(value);
      return value;
    } catch {
      return "";
    }
  }

  // ISO timestamp — extract date portion before "T"
  const timestampIndex = value.indexOf("T");
  if (timestampIndex > 0) {
    const datePart = value.substring(0, timestampIndex);
    if (ISO_DATE_REGEX.test(datePart)) {
      try {
        Temporal.PlainDate.from(datePart);
        return datePart;
      } catch {
        return "";
      }
    }
  }

  // Fallback: attempt to parse via Temporal.PlainDate
  try {
    const plainDate = Temporal.PlainDate.from(value);
    return plainDate.toString();
  } catch {
    return "";
  }
}

/**
 * Converts a YYYY-MM-DD string to ISODate (branded type).
 * If dateString is not provided, the current date is used.
 * Validates format via Temporal.PlainDate.from().
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @param clock - Clock for getting the current date (defaults to systemClock)
 * @returns ISO 8601 date string with branded type
 * @throws {RangeError} If dateString does not match YYYY-MM-DD format
 */
export function toISODate(
  dateString?: string,
  clock: Clock = systemClock,
): ISODate {
  const value = dateString ?? clock.plainDateISO().toString();
  Temporal.PlainDate.from(value); // throws if invalid
  return value as ISODate;
}

/**
 * Returns the maximum number of days in the given month.
 * For February returns 29 (we allow input of 29, though it will be clamped in non-leap years during calculation).
 *
 * @param month - Month number (1-12)
 * @returns Number of days in the month
 */
export function getDaysInMonth(month: number): number {
  const DAYS_IN_MONTH: Record<number, number> = {
    1: 31, // January
    2: 29, // February (allow 29)
    3: 31, // March
    4: 30, // April
    5: 31, // May
    6: 30, // June
    7: 31, // July
    8: 31, // August
    9: 30, // September
    10: 31, // October
    11: 30, // November
    12: 31, // December
  };

  return DAYS_IN_MONTH[month] ?? 31;
}

/**
 * Returns the current date for use as default values
 * when configuring recurring tasks.
 *
 * @param clock - Clock for getting the current date (defaults to systemClock)
 * @returns Object with the current day of month and month
 */
export function getCurrentDateDefaults(clock: Clock = systemClock): {
  dayOfMonth: number;
  month: number;
  day: number;
} {
  const today = clock.plainDateISO();

  return {
    dayOfMonth: today.day,
    month: today.month,
    day: today.day,
  };
}
