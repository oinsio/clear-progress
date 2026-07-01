import i18next from "i18next";

import { type Clock, Temporal } from "@/lib/temporal";

const DAILY_FREQUENCY = "daily";
const RELATIVE_TODAY_KEY = "repeat.today";
const RELATIVE_TOMORROW_KEY = "repeat.tomorrow";
const DEFAULT_LOCALE = "en";
/** JS Date months are 0-based, Temporal months are 1-based */
const TEMPORAL_TO_JS_MONTH_OFFSET = 1;

/**
 * Formats next_date with relative (today/tomorrow) and absolute formats.
 * Implements FR3, FR4 of show-upcoming-recurrences
 */
export function formatNextDate(
  isoDate: string,
  frequency: string,
  clock: Clock,
): string {
  const date = Temporal.PlainDate.from(isoDate);
  const today = clock.plainDateISO();

  if (Temporal.PlainDate.compare(date, today) === 0) {
    return i18next.t(RELATIVE_TODAY_KEY);
  }

  const tomorrow = today.add({ days: 1 });
  if (Temporal.PlainDate.compare(date, tomorrow) === 0) {
    return i18next.t(RELATIVE_TOMORROW_KEY);
  }

  return formatAbsoluteDate(date, frequency, today);
}

/**
 * Formats a date for the preview list — always absolute, no relative.
 * Implements FR7 of show-upcoming-recurrences
 */
export function formatUpcomingDate(
  isoDate: string,
  frequency: string,
  clock: Clock,
): string {
  const date = Temporal.PlainDate.from(isoDate);
  const today = clock.plainDateISO();
  return formatAbsoluteDate(date, frequency, today);
}

function formatAbsoluteDate(
  date: Temporal.PlainDate,
  frequency: string,
  today: Temporal.PlainDate,
): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  if (frequency !== DAILY_FREQUENCY) {
    options.weekday = "short";
  }

  if (date.year !== today.year) {
    options.year = "numeric";
  }

  const locale = i18next.language || DEFAULT_LOCALE;
  const jsDate = new Date(
    date.year,
    date.month - TEMPORAL_TO_JS_MONTH_OFFSET,
    date.day,
  );
  return new Intl.DateTimeFormat(locale, options).format(jsDate);
}
