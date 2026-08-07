import type { Clock } from "@/lib/temporal";
import { Temporal } from "@/lib/temporal";

export const BOUNDARY_BUFFER_MS = 1000;

/**
 * Implements FR8 of fix-completed-today-stale-on-day-rollover.
 * Schedules onFire to run once, at the next day-boundary instant plus a
 * small buffer. Does not self-reschedule — callers re-invoke it from
 * inside onFire if they need a recurring timer.
 */
export function scheduleNextBoundary(
  clock: Clock,
  dayBoundary: string,
  onFire: () => void,
): ReturnType<typeof setTimeout> {
  const now = clock.instant();
  const timeZone = clock.timeZoneId();
  const boundaryTime = Temporal.PlainTime.from(dayBoundary);
  const today = clock.plainDateISO();

  const boundaryInstantOn = (date: Temporal.PlainDate): Temporal.Instant =>
    date.toZonedDateTime({ timeZone, plainTime: boundaryTime }).toInstant();

  const todayBoundary = boundaryInstantOn(today);
  const nextBoundary =
    Temporal.Instant.compare(todayBoundary, now) > 0
      ? todayBoundary
      : boundaryInstantOn(today.add({ days: 1 }));

  const msUntilBoundary = nextBoundary
    .since(now)
    .total({ unit: "milliseconds" });

  return setTimeout(onFire, msUntilBoundary + BOUNDARY_BUFFER_MS);
}
