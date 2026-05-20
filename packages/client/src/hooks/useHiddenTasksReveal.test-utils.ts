import { type Clock, Temporal } from "@/lib/temporal";

export function createMutableClock(
  isoTimestamp: string,
  timeZone: string,
): Clock & { setInstant(iso: string): void } {
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
