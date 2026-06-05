import { DEFAULT_DAY_BOUNDARY } from "@/constants";
import type { Clock } from "@/lib/temporal";
import { Temporal } from "@/lib/temporal";

const DAY_BOUNDARY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Implements FR3 of day-boundary.
 * Returns logical date as ISO string ("YYYY-MM-DD").
 * If current time < dayBoundary, returns previous calendar day.
 * When boundary is "00:00", always returns current calendar day (fast path).
 */
export function getLogicalDate(clock: Clock, dayBoundary: string): string {
  const zonedDateTime = clock.instant().toZonedDateTimeISO(clock.timeZoneId());

  if (dayBoundary === DEFAULT_DAY_BOUNDARY) {
    return zonedDateTime.toPlainDate().toString();
  }

  const currentTime = zonedDateTime.toPlainTime();
  const boundaryTime = Temporal.PlainTime.from(dayBoundary);

  if (Temporal.PlainTime.compare(currentTime, boundaryTime) < 0) {
    return zonedDateTime.toPlainDate().subtract({ days: 1 }).toString();
  }

  return zonedDateTime.toPlainDate().toString();
}

/**
 * Implements FR11 of day-boundary.
 * Validates HH:mm format: hours 00-23, minutes 00-59.
 */
export function isValidDayBoundary(value: string): boolean {
  return DAY_BOUNDARY_PATTERN.test(value);
}
