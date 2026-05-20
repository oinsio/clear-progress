import { Temporal } from "@/lib/temporal";

export function buildISOForTodayAt(
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate);
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}

export function buildISOForYesterdayAt(
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate).subtract({ days: 1 });
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}

export function buildISOForDaysAgoAt(
  daysAgo: number,
  hours: number,
  minutes: number,
  referenceDate: string,
): string {
  const date = Temporal.PlainDate.from(referenceDate).subtract({
    days: daysAgo,
  });
  return date
    .toZonedDateTime({
      timeZone: "UTC",
      plainTime: { hour: hours, minute: minutes },
    })
    .toInstant()
    .toString();
}
