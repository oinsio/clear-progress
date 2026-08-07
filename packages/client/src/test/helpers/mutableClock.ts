import type { MockInstance } from "vitest";

import { type Clock, Temporal } from "@/lib/temporal";

/** A test `Clock` whose current instant can be advanced between assertions. */
export type MutableClock = Clock & { setInstant(iso: string): void };

/**
 * Builds a `Clock` seeded at `isoTimestamp` in `timeZone` whose instant can be
 * moved forward via `setInstant`, letting a test cross a day boundary without
 * `vi.useFakeTimers()` (banned by this project's temporal rules).
 */
export function createMutableClock(
  isoTimestamp: string,
  timeZone: string,
): MutableClock {
  let instant = Temporal.Instant.from(isoTimestamp);
  return {
    instant: () => instant,
    plainDateISO: () => instant.toZonedDateTimeISO(timeZone).toPlainDate(),
    timeZoneId: () => timeZone,
    setInstant(iso: string) {
      instant = Temporal.Instant.from(iso);
    },
  };
}

/** Returns the callback passed to the most recent `setTimeout` spy call. */
export function captureScheduledCallback(
  setTimeoutSpy: MockInstance<typeof setTimeout>,
): () => void {
  const [callback] = setTimeoutSpy.mock.calls.at(-1) as [() => void, number];
  return callback;
}
