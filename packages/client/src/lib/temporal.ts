import { Temporal } from "temporal-polyfill";

export { Temporal };

/**
 * Clock abstraction for dependency injection in tests.
 * Allows mocking Temporal.Now without vi.useFakeTimers().
 */
export type Clock = {
  instant(): Temporal.Instant;
  plainDateISO(): Temporal.PlainDate;
  timeZoneId(): string;
};

/**
 * System clock — uses real Temporal.Now.
 * Use this in production code as default parameter.
 */
export const systemClock: Clock = {
  instant: () => Temporal.Now.instant(),
  plainDateISO: () => Temporal.Now.plainDateISO(),
  timeZoneId: () => Temporal.Now.timeZoneId(),
};

/**
 * Fake clock for tests — returns fixed instant and date.
 * @param isoTimestamp - ISO 8601 timestamp (e.g., "2026-04-16T10:30:00Z")
 * @param timeZone - IANA timezone (default: "UTC")
 */
export function fakeClock(isoTimestamp: string, timeZone = "UTC"): Clock {
  const instant = Temporal.Instant.from(isoTimestamp);
  return {
    instant: () => instant,
    plainDateISO: () => instant.toZonedDateTimeISO(timeZone).toPlainDate(),
    timeZoneId: () => timeZone,
  };
}
